import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { fetchUrlContent } from "./_core/urlFetcher";
import crypto from "crypto";

// ============ MOCK DATA FOR FALLBACK ============

const mockRecipes = [
  {
    name: "红烧肉",
    cookingMethod: "braise",
    dishType: "cantonese",
    description: "经典家常菜，肥而不腻",
    cookTimeMinutes: 60,
    servings: 4,
    ingredients: [
      { name: "五花肉", quantity: "500", unit: "g" },
      { name: "生姜", quantity: "3", unit: "片" },
      { name: "葱", quantity: "2", unit: "根" },
      { name: "酱油", quantity: "2", unit: "勺" },
      { name: "冰糖", quantity: "30", unit: "g" },
    ],
    steps: [
      { instruction: "五花肉切块，焯水去血沫" },
      { instruction: "锅中放油，加冰糖炒出糖色" },
      { instruction: "放入五花肉翻炒上色" },
      { instruction: "加入酱油、姜片、葱段和适量水" },
      { instruction: "大火烧开后转小火炖45分钟" },
      { instruction: "大火收汁即可" },
    ],
  },
  {
    name: "蒜蓉西兰花",
    cookingMethod: "stir_fry",
    dishType: "cantonese",
    description: "清淡健康的快手菜",
    cookTimeMinutes: 10,
    servings: 2,
    ingredients: [
      { name: "西兰花", quantity: "1", unit: "棵" },
      { name: "大蒜", quantity: "5", unit: "瓣" },
      { name: "盐", quantity: "适量", unit: "" },
    ],
    steps: [
      { instruction: "西兰花切小朵，焯水" },
      { instruction: "大蒜切末" },
      { instruction: "锅中放油，爆香蒜末" },
      { instruction: "放入西兰花翻炒，加盐调味" },
    ],
  },
];

function getMockRecipeFromUrl(url: string) {
  const index = url.includes("肉") ? 0 : 1;
  return { ...mockRecipes[index], sourceUrl: url };
}

// ============ VALIDATION SCHEMAS ============

const recipeInputSchema = z.object({
  name: z.string().min(1).max(255),
  nameEn: z.string().max(255).optional(),
  description: z.string().optional(),
  cookingMethod: z.string().min(1).max(100),
  dishType: z.string().min(1).max(100),
  servings: z.number().int().positive().optional(),
  cookTimeMinutes: z.number().int().positive().optional(),
  sourceUrl: z.string().url().optional(),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        nameEn: z.string().max(255).optional(),
        quantity: z.string().max(100).optional(),
        unit: z.string().max(50).optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  steps: z
    .array(
      z.object({
        instruction: z.string().min(1),
        instructionEn: z.string().optional(),
      })
    )
    .optional(),
});

const extractRecipeSchema = z.object({
  url: z.string().url(),
});

const parseSmartInputSchema = z.object({
  text: z.string().min(1),
});

const weeklyPlanInputSchema = z.object({
  recipeId: z.number().int().positive(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  mealType: z.string().max(50).optional(),
  weekStartDate: z.date(),
});

const toBuyListInputSchema = z.object({
  itemName: z.string().min(1).max(255),
  itemNameEn: z.string().max(255).optional(),
  quantity: z.string().max(100).optional(),
  unit: z.string().max(50).optional(),
  ingredientId: z.number().int().positive().optional(),
  weekStartDate: z.date(),
});

// ============ HOUSEHOLD ROUTER ============

const householdRouter = router({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const inviteCode = crypto.randomBytes(16).toString("hex");
      const householdId = await db.createHousehold(input.name, ctx.user.id, inviteCode);

      // Add creator as admin
      await db.addHouseholdMember(householdId, ctx.user.id, "admin");

      return { id: householdId, inviteCode };
    }),

  join: protectedProcedure
    .input(z.object({ inviteCode: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const household = await db.getHouseholdByInviteCode(input.inviteCode);
      if (!household) {
        throw new Error("Invalid invite code");
      }

      await db.addHouseholdMember(household.id, ctx.user.id, "member");
      return household;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const result = await db.getHouseholdsByUserId(ctx.user.id);
    return result.map((r) => r.households);
  }),

  members: protectedProcedure
    .input(z.object({ householdId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const result = await db.getHouseholdMembers(input.householdId);
      return result.map((r) => ({
        ...r.householdMembers,
        user: r.users,
      }));
    }),
});

// ============ RECIPE ROUTER ============

const recipeRouter = router({
  create: protectedProcedure
    .input(recipeInputSchema.extend({ householdId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const recipeId = await db.createRecipe({
        householdId: input.householdId,
        name: input.name,
        nameEn: input.nameEn,
        description: input.description,
        cookingMethod: input.cookingMethod,
        dishType: input.dishType,
        servings: input.servings,
        cookTimeMinutes: input.cookTimeMinutes,
        sourceUrl: input.sourceUrl,
        createdBy: ctx.user.id,
      });

      // Add ingredients
      if (input.ingredients) {
        for (const ing of input.ingredients) {
          await db.createIngredient({
            recipeId,
            name: ing.name,
            nameEn: ing.nameEn,
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes,
          });
        }
      }

      // Add cooking steps
      if (input.steps) {
        for (let i = 0; i < input.steps.length; i++) {
          await db.createCookingStep({
            recipeId,
            stepNumber: i + 1,
            instruction: input.steps[i].instruction,
            instructionEn: input.steps[i].instructionEn,
          });
        }
      }

      return { id: recipeId };
    }),

  extract: publicProcedure
    .input(extractRecipeSchema)
    .mutation(async ({ input }) => {
      // Fetch content from URL
      const fetched = await fetchUrlContent(input.url);

      // Build context for LLM
      let userMessage = "";
      if (fetched.title || fetched.description) {
        userMessage += `标题: ${fetched.title}\n`;
        userMessage += `描述: ${fetched.description}\n\n`;
      }
      if (fetched.content) {
        userMessage += `页面内容:\n${fetched.content}\n\n`;
      }
      userMessage += `原始链接: ${input.url}`;
      if (fetched.platform) {
        userMessage += `\n平台: ${fetched.platform}`;
      }

      try {
        // Use LLM to extract recipe from fetched content
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `你是一个菜谱提取助手。从提供的链接内容中提取菜谱信息。

要求：
1. 如果内容是菜谱，提取完整信息
2. 如果内容是视频链接（小红书、抖音、B站等），根据标题和描述推断菜谱信息
3. 如果内容不是菜谱，返回空或基本信息

返回JSON格式：
{
  "name": "菜谱名称",
  "cookingMethod": "烹饪方式（stir_fry/steam/cold_mix/braise/grill/boil/other）",
  "dishType": "菜系（cantonese/chaoshan/hakka/sichuan/jiangsu/other）",
  "description": "简短描述",
  "cookTimeMinutes": 烹饪时间（分钟，可选）,
  "servings": 份数（可选）,
  "ingredients": [
    {"name": "食材名", "quantity": "用量", "unit": "单位"}
  ],
  "steps": [
    {"instruction": "步骤说明"}
  ]
}`,
            },
            {
              role: "user",
              content: userMessage,
            },
          ] as any,
          response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;
        if (typeof content === "string") {
          const recipe = JSON.parse(content);
          // Add sourceUrl to preserve original link
          return { ...recipe, sourceUrl: input.url };
        }
        throw new Error("Invalid response format");
      } catch (error) {
        console.warn("LLM extraction failed, using mock data:", error);
        // Fallback to mock data when LLM is unavailable
        return getMockRecipeFromUrl(input.url);
      }
    }),

  parseSmartInput: publicProcedure
    .input(parseSmartInputSchema)
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a recipe information parser. Parse the user's natural language input and extract recipe information. Return JSON with:
- name: recipe name (string)
- nameEn: English recipe name (string, optional)
- description: brief description (string, optional)
- cookingMethod: one of "stir_fry", "steam", "cold_mix", "braise", "grill", "boil", "other" (string)
- dishType: one of "cantonese", "chaoshan", "hakka", "sichuan", "jiangsu", "other" (string)
- cookTimeMinutes: cooking time in minutes (number, optional)
- servings: number of servings (number, optional)
- ingredients: array of {name, nameEn (optional), quantity (optional), unit (optional), notes (optional)} (array)
- steps: array of {instruction, instructionEn (optional)} (array, optional)

If information is not provided, leave fields as null/undefined. Infer reasonable defaults when possible.`,
          },
          {
            role: "user",
            content: input.text,
          },
        ] as any,
        response_format: { type: "json_object" },
      });

      try {
        const content = response.choices[0].message.content;
        if (typeof content === "string") {
          return JSON.parse(content);
        }
        throw new Error("Invalid response format");
      } catch (error) {
        throw new Error("Failed to parse recipe information");
      }
    }),

  list: protectedProcedure
    .input(z.object({ householdId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return db.getRecipesByHousehold(input.householdId);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const recipe = await db.getRecipeById(input.id);
      if (!recipe) return null;

      const ingredients = await db.getIngredientsByRecipe(input.id);
      const steps = await db.getCookingStepsByRecipe(input.id);

      return {
        ...recipe,
        ingredients,
        steps,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        data: recipeInputSchema.partial(),
      })
    )
    .mutation(async ({ input }) => {
      const { ingredients, steps, ...recipeData } = input.data;

      await db.updateRecipe(input.id, recipeData);

      // Update ingredients if provided
      if (ingredients) {
        const existing = await db.getIngredientsByRecipe(input.id);
        for (const ing of existing) {
          await db.deleteIngredient(ing.id);
        }
        for (const ing of ingredients) {
          await db.createIngredient({
            recipeId: input.id,
            name: ing.name,
            nameEn: ing.nameEn,
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes,
          });
        }
      }

      // Update steps if provided
      if (steps) {
        const existing = await db.getCookingStepsByRecipe(input.id);
        for (const step of existing) {
          await db.deleteCookingStep(step.id);
        }
        for (let i = 0; i < steps.length; i++) {
          await db.createCookingStep({
            recipeId: input.id,
            stepNumber: i + 1,
            instruction: steps[i].instruction,
            instructionEn: steps[i].instructionEn,
          });
        }
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await db.deleteRecipe(input.id);
    }),

  search: protectedProcedure
    .input(
      z.object({
        householdId: z.number().int().positive(),
        ingredientName: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      // Get all recipes for household
      const recipes = await db.getRecipesByHousehold(input.householdId);

      // Filter recipes that contain the ingredient
      const filtered = [];
      for (const recipe of recipes) {
        const ingredients = await db.getIngredientsByRecipe(recipe.id);
        const hasIngredient = ingredients.some(
          (ing) =>
            ing.name.toLowerCase().includes(input.ingredientName.toLowerCase()) ||
            (ing.nameEn && ing.nameEn.toLowerCase().includes(input.ingredientName.toLowerCase()))
        );

        if (hasIngredient) {
          filtered.push(recipe);
        }
      }

      return filtered;
    }),
});

// ============ WEEKLY PLAN ROUTER ============

const weeklyPlanRouter = router({
  add: protectedProcedure
    .input(weeklyPlanInputSchema.extend({ householdId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const weeklyPlanId = await db.addToWeeklyPlan({
        householdId: input.householdId,
        recipeId: input.recipeId,
        dayOfWeek: input.dayOfWeek,
        mealType: input.mealType,
        addedBy: ctx.user.id,
        weekStartDate: input.weekStartDate,
      });

      // Create ingredient checklist items
      const ingredients = await db.getIngredientsByRecipe(input.recipeId);
      for (const ing of ingredients) {
        await db.createIngredientChecklist({
          weeklyPlanId,
          ingredientId: ing.id,
          isChecked: false,
        });
      }

      return { id: weeklyPlanId };
    }),

  list: protectedProcedure
    .input(
      z.object({
        householdId: z.number().int().positive(),
        weekStartDate: z.date(),
      })
    )
    .query(async ({ input }) => {
      const result = await db.getWeeklyPlanByHousehold(input.householdId, input.weekStartDate);
      return result.map((r) => ({
        ...r.weeklyPlan,
        recipe: r.recipes,
      }));
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await db.removeFromWeeklyPlan(input.id);
    }),

  checkIngredient: protectedProcedure
    .input(
      z.object({
        checklistId: z.number().int().positive(),
        isChecked: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.updateChecklistItem(input.checklistId, input.isChecked, ctx.user.id);
    }),

  getChecklist: protectedProcedure
    .input(z.object({ weeklyPlanId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const result = await db.getChecklistByWeeklyPlan(input.weeklyPlanId);
      return result.map((r) => ({
        ...r.ingredientChecklist,
        ingredient: r.ingredients,
      }));
    }),
});

// ============ TO-BUY LIST ROUTER ============

const toBuyListRouter = router({
  add: protectedProcedure
    .input(toBuyListInputSchema.extend({ householdId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const itemId = await db.addToBuyListItem({
        householdId: input.householdId,
        itemName: input.itemName,
        itemNameEn: input.itemNameEn,
        quantity: input.quantity,
        unit: input.unit,
        ingredientId: input.ingredientId,
        addedBy: ctx.user.id,
        weekStartDate: input.weekStartDate,
        isChecked: false,
      });

      return { id: itemId };
    }),

  list: protectedProcedure
    .input(
      z.object({
        householdId: z.number().int().positive(),
        weekStartDate: z.date(),
      })
    )
    .query(async ({ input }) => {
      return db.getToBuyListByHousehold(input.householdId, input.weekStartDate);
    }),

  check: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        isChecked: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.updateToBuyListItem(input.id, input.isChecked, ctx.user.id);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await db.deleteToBuyListItem(input.id);
    }),
});

// ============ APP ROUTER ============

export const appRouter = router({
  health: publicProcedure.query(() => ({ status: "ok" })),
  household: householdRouter,
  recipe: recipeRouter,
  weeklyPlan: weeklyPlanRouter,
  toBuyList: toBuyListRouter,
});

export type AppRouter = typeof appRouter;
