import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  households,
  householdMembers,
  recipes,
  ingredients,
  cookingSteps,
  weeklyPlan,
  ingredientChecklist,
  toBuyList,
  type Household,
  type Recipe,
  type Ingredient,
  type CookingStep,
  type WeeklyPlan,
  type ToBuyList,
  type InsertRecipe,
  type InsertIngredient,
  type InsertCookingStep,
  type InsertWeeklyPlan,
  type InsertToBuyList,
  type InsertIngredientChecklist,
  type User,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// In-memory fallback database for local development without MySQL
const memoryDb = {
  users: [] as any[],
  households: [] as any[],
  householdMembers: [] as any[],
  recipes: [] as any[],
  ingredients: [] as any[],
  cookingSteps: [] as any[],
  weeklyPlan: [] as any[],
  ingredientChecklist: [] as any[],
  toBuyList: [] as any[],
};

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for upsertUser");
    const existingIndex = memoryDb.users.findIndex((u) => u.openId === user.openId);
    const now = new Date();
    if (existingIndex >= 0) {
      memoryDb.users[existingIndex] = {
        ...memoryDb.users[existingIndex],
        ...user,
        updatedAt: now,
      };
    } else {
      memoryDb.users.push({
        id: memoryDb.users.length + 1,
        createdAt: now,
        updatedAt: now,
        role: "user",
        lastSignedIn: now,
        ...user,
      });
    }
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for getUserByOpenId");
    return memoryDb.users.find((u) => u.openId === openId);
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ HOUSEHOLD QUERIES ============

export async function createHousehold(name: string, createdBy: number, inviteCode: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for createHousehold");
    const id = memoryDb.households.length + 1;
    memoryDb.households.push({
      id,
      name,
      createdBy,
      inviteCode,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  }

  const result = await db.insert(households).values({
    name,
    createdBy,
    inviteCode,
  });

  return result[0].insertId;
}

export async function getHouseholdByInviteCode(inviteCode: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for getHouseholdByInviteCode");
    return memoryDb.households.find((h) => h.inviteCode === inviteCode);
  }

  const result = await db
    .select()
    .from(households)
    .where(eq(households.inviteCode, inviteCode))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getHouseholdsByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for getHouseholdsByUserId");
    const members = memoryDb.householdMembers.filter((m) => m.userId === userId);
    return members
      .map((m) => {
        const h = memoryDb.households.find((x) => x.id === m.householdId);
        return h ? { households: h } : null;
      })
      .filter((x): x is { households: any } => x !== null);
  }

  return db
    .select()
    .from(households)
    .innerJoin(householdMembers, eq(households.id, householdMembers.householdId))
    .where(eq(householdMembers.userId, userId));
}

// ============ HOUSEHOLD MEMBER QUERIES ============

export async function addHouseholdMember(householdId: number, userId: number, role: "member" | "admin" = "member") {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for addHouseholdMember");
    const id = memoryDb.householdMembers.length + 1;
    memoryDb.householdMembers.push({
      id,
      householdId,
      userId,
      role,
      joinedAt: new Date(),
    });
    return id;
  }

  const result = await db.insert(householdMembers).values({
    householdId,
    userId,
    role,
  });

  return result[0].insertId;
}

export async function getHouseholdMembers(householdId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for getHouseholdMembers");
    const members = memoryDb.householdMembers.filter((m) => m.householdId === householdId);
    return members.map((m) => {
      const u = memoryDb.users.find((x) => x.id === m.userId);
      return {
        householdMembers: m,
        users: u,
      };
    });
  }

  return db
    .select()
    .from(householdMembers)
    .innerJoin(users, eq(householdMembers.userId, users.id))
    .where(eq(householdMembers.householdId, householdId));
}

// ============ RECIPE QUERIES ============

export async function createRecipe(data: InsertRecipe) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for createRecipe");
    const id = memoryDb.recipes.length + 1;
    memoryDb.recipes.push({
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    });
    return id;
  }

  const result = await db.insert(recipes).values(data);
  return result[0].insertId;
}

export async function getRecipesByHousehold(householdId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for getRecipesByHousehold");
    return memoryDb.recipes
      .filter((r) => r.householdId === householdId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  return db
    .select()
    .from(recipes)
    .where(eq(recipes.householdId, householdId))
    .orderBy(desc(recipes.createdAt));
}

export async function getRecipeById(recipeId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for getRecipeById");
    return memoryDb.recipes.find((r) => r.id === recipeId);
  }

  const result = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateRecipe(recipeId: number, data: Partial<InsertRecipe>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for updateRecipe");
    const idx = memoryDb.recipes.findIndex((r) => r.id === recipeId);
    if (idx >= 0) {
      memoryDb.recipes[idx] = {
        ...memoryDb.recipes[idx],
        ...data,
        updatedAt: new Date(),
      };
    }
    return;
  }

  await db.update(recipes).set(data).where(eq(recipes.id, recipeId));
}

export async function deleteRecipe(recipeId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for deleteRecipe");
    memoryDb.recipes = memoryDb.recipes.filter((r) => r.id !== recipeId);
    memoryDb.ingredients = memoryDb.ingredients.filter((i) => i.recipeId !== recipeId);
    memoryDb.cookingSteps = memoryDb.cookingSteps.filter((s) => s.recipeId !== recipeId);
    return;
  }

  await db.delete(recipes).where(eq(recipes.id, recipeId));
}

// ============ INGREDIENT QUERIES ============

export async function createIngredient(data: InsertIngredient) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for createIngredient");
    const id = memoryDb.ingredients.length + 1;
    memoryDb.ingredients.push({
      id,
      createdAt: new Date(),
      ...data,
    });
    return id;
  }

  const result = await db.insert(ingredients).values(data);
  return result[0].insertId;
}

export async function getIngredientsByRecipe(recipeId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for getIngredientsByRecipe");
    return memoryDb.ingredients.filter((i) => i.recipeId === recipeId);
  }

  return db.select().from(ingredients).where(eq(ingredients.recipeId, recipeId));
}

export async function deleteIngredient(ingredientId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for deleteIngredient");
    memoryDb.ingredients = memoryDb.ingredients.filter((i) => i.id !== ingredientId);
    return;
  }

  await db.delete(ingredients).where(eq(ingredients.id, ingredientId));
}

// ============ COOKING STEP QUERIES ============

export async function createCookingStep(data: InsertCookingStep) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for createCookingStep");
    const id = memoryDb.cookingSteps.length + 1;
    memoryDb.cookingSteps.push({
      id,
      createdAt: new Date(),
      ...data,
    });
    return id;
  }

  const result = await db.insert(cookingSteps).values(data);
  return result[0].insertId;
}

export async function getCookingStepsByRecipe(recipeId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for getCookingStepsByRecipe");
    return memoryDb.cookingSteps
      .filter((s) => s.recipeId === recipeId)
      .sort((a, b) => a.stepNumber - b.stepNumber);
  }

  return db
    .select()
    .from(cookingSteps)
    .where(eq(cookingSteps.recipeId, recipeId))
    .orderBy(cookingSteps.stepNumber);
}

export async function deleteCookingStep(stepId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for deleteCookingStep");
    memoryDb.cookingSteps = memoryDb.cookingSteps.filter((s) => s.id !== stepId);
    return;
  }

  await db.delete(cookingSteps).where(eq(cookingSteps.id, stepId));
}

// ============ WEEKLY PLAN QUERIES ============

export async function addToWeeklyPlan(data: InsertWeeklyPlan) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for addToWeeklyPlan");
    const id = memoryDb.weeklyPlan.length + 1;
    memoryDb.weeklyPlan.push({
      id,
      addedAt: new Date(),
      ...data,
    });
    return id;
  }

  const result = await db.insert(weeklyPlan).values(data);
  return result[0].insertId;
}

export async function getWeeklyPlanByHousehold(householdId: number, weekStartDate: Date) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for getWeeklyPlanByHousehold");
    const plans = memoryDb.weeklyPlan.filter(
      (p) =>
        p.householdId === householdId &&
        p.weekStartDate.toDateString() === weekStartDate.toDateString()
    );
    return plans
      .map((p) => {
        const r = memoryDb.recipes.find((x) => x.id === p.recipeId);
        return r ? { weeklyPlan: p, recipes: r } : null;
      })
      .filter((x): x is { weeklyPlan: any; recipes: any } => x !== null);
  }

  return db
    .select()
    .from(weeklyPlan)
    .innerJoin(recipes, eq(weeklyPlan.recipeId, recipes.id))
    .where(
      and(
        eq(weeklyPlan.householdId, householdId),
        eq(weeklyPlan.weekStartDate, weekStartDate)
      )
    );
}

export async function removeFromWeeklyPlan(weeklyPlanId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for removeFromWeeklyPlan");
    memoryDb.weeklyPlan = memoryDb.weeklyPlan.filter((p) => p.id !== weeklyPlanId);
    memoryDb.ingredientChecklist = memoryDb.ingredientChecklist.filter(
      (c) => c.weeklyPlanId !== weeklyPlanId
    );
    return;
  }

  await db.delete(weeklyPlan).where(eq(weeklyPlan.id, weeklyPlanId));
}

// ============ INGREDIENT CHECKLIST QUERIES ============

export async function createIngredientChecklist(data: InsertIngredientChecklist) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for createIngredientChecklist");
    const id = memoryDb.ingredientChecklist.length + 1;
    memoryDb.ingredientChecklist.push({
      id,
      isChecked: false,
      ...data,
    });
    return id;
  }

  const result = await db.insert(ingredientChecklist).values(data);
  return result[0].insertId;
}

export async function getChecklistByWeeklyPlan(weeklyPlanId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for getChecklistByWeeklyPlan");
    const checklist = memoryDb.ingredientChecklist.filter((c) => c.weeklyPlanId === weeklyPlanId);
    return checklist
      .map((c) => {
        const ing = memoryDb.ingredients.find((x) => x.id === c.ingredientId);
        return ing ? { ingredientChecklist: c, ingredients: ing } : null;
      })
      .filter((x): x is { ingredientChecklist: any; ingredients: any } => x !== null);
  }

  return db
    .select()
    .from(ingredientChecklist)
    .innerJoin(ingredients, eq(ingredientChecklist.ingredientId, ingredients.id))
    .where(eq(ingredientChecklist.weeklyPlanId, weeklyPlanId));
}

export async function updateChecklistItem(checklistId: number, isChecked: boolean, checkedBy?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for updateChecklistItem");
    const idx = memoryDb.ingredientChecklist.findIndex((c) => c.id === checklistId);
    if (idx >= 0) {
      memoryDb.ingredientChecklist[idx] = {
        ...memoryDb.ingredientChecklist[idx],
        isChecked,
        checkedBy,
        checkedAt: isChecked ? new Date() : null,
      };
    }
    return;
  }

  await db
    .update(ingredientChecklist)
    .set({
      isChecked,
      checkedBy,
      checkedAt: isChecked ? new Date() : null,
    })
    .where(eq(ingredientChecklist.id, checklistId));
}

// ============ TO-BUY LIST QUERIES ============

export async function addToBuyListItem(data: InsertToBuyList) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for addToBuyListItem");
    const id = memoryDb.toBuyList.length + 1;
    memoryDb.toBuyList.push({
      id,
      addedAt: new Date(),
      isChecked: false,
      ...data,
    });
    return id;
  }

  const result = await db.insert(toBuyList).values(data);
  return result[0].insertId;
}

export async function getToBuyListByHousehold(householdId: number, weekStartDate: Date) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for getToBuyListByHousehold");
    return memoryDb.toBuyList.filter(
      (t) =>
        t.householdId === householdId &&
        t.weekStartDate.toDateString() === weekStartDate.toDateString()
    );
  }

  return db
    .select()
    .from(toBuyList)
    .where(
      and(
        eq(toBuyList.householdId, householdId),
        eq(toBuyList.weekStartDate, weekStartDate)
      )
    );
}

export async function updateToBuyListItem(toBuyListId: number, isChecked: boolean, checkedBy?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for updateToBuyListItem");
    const idx = memoryDb.toBuyList.findIndex((t) => t.id === toBuyListId);
    if (idx >= 0) {
      memoryDb.toBuyList[idx] = {
        ...memoryDb.toBuyList[idx],
        isChecked,
        checkedBy,
        checkedAt: isChecked ? new Date() : null,
      };
    }
    return;
  }

  await db
    .update(toBuyList)
    .set({
      isChecked,
      checkedBy,
      checkedAt: isChecked ? new Date() : null,
    })
    .where(eq(toBuyList.id, toBuyListId));
}

export async function deleteToBuyListItem(toBuyListId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for deleteToBuyListItem");
    memoryDb.toBuyList = memoryDb.toBuyList.filter((t) => t.id !== toBuyListId);
    return;
  }

  await db.delete(toBuyList).where(eq(toBuyList.id, toBuyListId));
}

// ============ SEARCH QUERIES ============

export async function searchRecipesByIngredient(householdId: number, ingredientName: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using memory fallback for searchRecipesByIngredient");
    const recipes = memoryDb.recipes.filter((r) => r.householdId === householdId);
    const filtered = [];
    for (const recipe of recipes) {
      const ingredients = memoryDb.ingredients.filter((i) => i.recipeId === recipe.id);
      const hasIngredient = ingredients.some(
        (ing) =>
          ing.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
          (ing.nameEn && ing.nameEn.toLowerCase().includes(ingredientName.toLowerCase()))
      );
      if (hasIngredient) {
        filtered.push(recipe);
      }
    }
    return filtered;
  }

  return db
    .select()
    .from(recipes)
    .innerJoin(ingredients, eq(recipes.id, ingredients.recipeId))
    .where(
      and(
        eq(recipes.householdId, householdId),
        // Search in both Chinese and English ingredient names
      )
    );
}
