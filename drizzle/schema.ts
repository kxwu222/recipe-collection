import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Households represent a family or group sharing recipes
 */
export const households = mysqlTable("households", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdBy: int("createdBy").notNull(),
  inviteCode: varchar("inviteCode", { length: 32 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Household members - tracks which users belong to which household
 */
export const householdMembers = mysqlTable("householdMembers", {
  id: int("id").autoincrement().primaryKey(),
  householdId: int("householdId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["member", "admin"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

/**
 * Recipes table - stores recipe information
 */
export const recipes = mysqlTable("recipes", {
  id: int("id").autoincrement().primaryKey(),
  householdId: int("householdId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("nameEn", { length: 255 }),
  description: text("description"),
  descriptionEn: text("descriptionEn"),
  cookingMethod: varchar("cookingMethod", { length: 100 }).notNull(), // 炒, 蒸, 凉拌, etc.
  cookingMethodEn: varchar("cookingMethodEn", { length: 100 }), // Stir Fry, Steam, etc.
  dishType: varchar("dishType", { length: 100 }).notNull(), // 粤菜, 潮汕菜, 客家菜, etc.
  dishTypeEn: varchar("dishTypeEn", { length: 100 }), // Cantonese, Chaoshan, etc.
  servings: int("servings"),
  cookTimeMinutes: int("cookTimeMinutes"),
  sourceUrl: varchar("sourceUrl", { length: 2048 }),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Ingredients table - individual ingredients for recipes
 */
export const ingredients = mysqlTable("ingredients", {
  id: int("id").autoincrement().primaryKey(),
  recipeId: int("recipeId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("nameEn", { length: 255 }),
  quantity: varchar("quantity", { length: 100 }),
  unit: varchar("unit", { length: 50 }), // 克, 个, 汤匙, etc.
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Cooking steps table - step-by-step instructions
 */
export const cookingSteps = mysqlTable("cookingSteps", {
  id: int("id").autoincrement().primaryKey(),
  recipeId: int("recipeId").notNull(),
  stepNumber: int("stepNumber").notNull(),
  instruction: text("instruction").notNull(),
  instructionEn: text("instructionEn"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Weekly plan - recipes planned for the week
 */
export const weeklyPlan = mysqlTable("weeklyPlan", {
  id: int("id").autoincrement().primaryKey(),
  householdId: int("householdId").notNull(),
  recipeId: int("recipeId").notNull(),
  dayOfWeek: int("dayOfWeek"), // 0-6 (Sunday-Saturday), null for unscheduled
  mealType: varchar("mealType", { length: 50 }), // breakfast, lunch, dinner
  addedBy: int("addedBy").notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
  weekStartDate: timestamp("weekStartDate").notNull(), // Start date of the week
});

/**
 * Ingredient checklist - tracks which ingredients are checked off for weekly plan
 */
export const ingredientChecklist = mysqlTable("ingredientChecklist", {
  id: int("id").autoincrement().primaryKey(),
  weeklyPlanId: int("weeklyPlanId").notNull(),
  ingredientId: int("ingredientId").notNull(),
  isChecked: boolean("isChecked").default(false).notNull(),
  checkedBy: int("checkedBy"),
  checkedAt: timestamp("checkedAt"),
});

/**
 * To-buy list - shopping list items
 */
export const toBuyList = mysqlTable("toBuyList", {
  id: int("id").autoincrement().primaryKey(),
  householdId: int("householdId").notNull(),
  ingredientId: int("ingredientId"),
  itemName: varchar("itemName", { length: 255 }).notNull(),
  itemNameEn: varchar("itemNameEn", { length: 255 }),
  quantity: varchar("quantity", { length: 100 }),
  unit: varchar("unit", { length: 50 }),
  isChecked: boolean("isChecked").default(false).notNull(),
  checkedBy: int("checkedBy"),
  checkedAt: timestamp("checkedAt"),
  addedBy: int("addedBy").notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
  weekStartDate: timestamp("weekStartDate").notNull(),
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Household = typeof households.$inferSelect;
export type InsertHousehold = typeof households.$inferInsert;

export type HouseholdMember = typeof householdMembers.$inferSelect;
export type InsertHouseholdMember = typeof householdMembers.$inferInsert;

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = typeof recipes.$inferInsert;

export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = typeof ingredients.$inferInsert;

export type CookingStep = typeof cookingSteps.$inferSelect;
export type InsertCookingStep = typeof cookingSteps.$inferInsert;

export type WeeklyPlan = typeof weeklyPlan.$inferSelect;
export type InsertWeeklyPlan = typeof weeklyPlan.$inferInsert;

export type IngredientChecklist = typeof ingredientChecklist.$inferSelect;
export type InsertIngredientChecklist = typeof ingredientChecklist.$inferInsert;

export type ToBuyList = typeof toBuyList.$inferSelect;
export type InsertToBuyList = typeof toBuyList.$inferInsert;
