import { create } from "zustand";
import { persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Language = "en" | "zh";

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    home: "Home",
    recipes: "Recipes",
    thisWeek: "This Week",
    settings: "Settings",
    toBuyList: "Shopping List",

    // Home Screen
    addRecipe: "Add Recipe",
    recentRecipes: "Recent Recipes",
    familyMembers: "Family Members",
    quickActions: "Quick Actions",
    noRecipes: "No recipes yet",

    // Recipe Management
    recipeName: "Recipe Name",
    recipeNameEn: "Recipe Name (English)",
    description: "Description",
    cookingMethod: "Cooking Method",
    dishType: "Dish Type",
    servings: "Servings",
    cookTime: "Cook Time (minutes)",
    sourceUrl: "Source URL",
    ingredients: "Ingredients",
    steps: "Steps",
    addIngredient: "Add Ingredient",
    addStep: "Add Step",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    search: "Search",
    searchByIngredient: "Search by ingredient",

    // Cooking Methods
    stir_fry: "Stir Fry (炒)",
    steam: "Steam (蒸)",
    cold_mix: "Cold Mix (凉拌)",
    braise: "Braise (炖)",
    grill: "Grill (烤)",
    boil: "Boil (煮)",

    // Dish Types
    cantonese: "Cantonese (粤菜)",
    chaoshan: "Chaoshan (潮汕菜)",
    hakka: "Hakka (客家菜)",
    sichuan: "Sichuan (川菜)",
    jiangsu: "Jiangsu (苏菜)",
    other: "Other",

    // Weekly Planner
    weeklyPlan: "Weekly Plan",
    addToWeek: "Add to This Week",
    removeFromWeek: "Remove from Week",
    ingredientChecklist: "Ingredient Checklist",
    allIngredientsChecked: "All ingredients checked!",
    missingIngredients: "Missing Ingredients",
    addToShoppingList: "Add to Shopping List",

    // Shopping List
    shoppingList: "Shopping List",
    addItem: "Add Item",
    itemName: "Item Name",
    markAsPurchased: "Mark as Purchased",
    clearAll: "Clear All",
    noItems: "No items",

    // Family Sharing
    household: "Household",
    familyName: "Household Name",
    members: "Members",
    inviteLink: "Invite Link",
    shareLink: "Share Link",
    copyLink: "Copy Link",
    linkCopied: "Link copied to clipboard",
    joinHousehold: "Join Household",
    inviteCode: "Invite Code",
    join: "Join",
    invalidCode: "Invalid invite code",

    // Settings
    language: "Language",
    chinese: "中文",
    english: "English",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    about: "About",
    logout: "Logout",

    // Messages
    loading: "Loading...",
    error: "Error",
    success: "Success",
    noConnection: "No internet connection",
    tryAgain: "Try Again",
    confirm: "Confirm",
    areYouSure: "Are you sure?",
    recipe: "Recipe",
    recipeNotFound: "Recipe not found",
    back: "Back",
    close: "Close",
    minutes: "minutes",
    addToThisWeek: "Add to This Week",
    addedToWeeklyPlan: "Added to weekly plan",
    source: "Source",
    fromUrl: "From URL",
    manual: "Manual Entry",
    recipeUrl: "Recipe URL",
    enterRecipeUrl: "Enter recipe URL (blog, YouTube, food website)",
    supportedSites: "Supported sites",
    extractRecipe: "Extract Recipe",
    recipeExtracted: "Recipe extracted successfully",
    failedToExtractRecipe: "Failed to extract recipe from URL",
    enterRecipeName: "Enter recipe name",
    enterRecipeNameEn: "Enter recipe name in English",
    enterDescription: "Enter recipe description",
    createRecipe: "Create Recipe",
    recipeCreated: "Recipe created successfully",
    failedToCreateRecipe: "Failed to create recipe",
    pleaseEnterUrl: "Please enter a URL",
    pleaseEnterRecipeName: "Please enter recipe name",
    pleaseSelectCookingMethod: "Please select cooking method",
    pleaseSelectDishType: "Please select dish type",
    noHousehold: "No household found. Please create or join a household first.",
    requiredFields: "Required fields",
    e.g.30: "e.g. 30",
    e.g.4: "e.g. 4",
    ingredientName: "Ingredient name",
    ingredientNameEn: "English name",
    quantity: "Quantity",
    unit: "Unit",
    notes: "Notes",
    smartInput: "Smart Input",
    smartInputPlaceholder: "Paste or type recipe info, AI will parse it...",
    smartInputHint: "Example: Tomato Egg Stir Fry, cook 15 min, 2 servings, ingredients: 2 eggs, 3 tomatoes",
    parsingRecipe: "Parsing recipe...",
    smartInputParsed: "Recipe info parsed successfully",
    pleaseEnterItemName: "Please enter item name",
    failedToAddItem: "Failed to add item",
    itemAdded: "Item added successfully",
    imageUrl: "Image URL",
    enterImageUrl: "Enter image URL",
    browseRecipes: "Browse Recipes",
    viewOriginalLink: "View Original Link",
  },
  zh: {
    // Navigation
    home: "首页",
    recipes: "食谱",
    thisWeek: "本周",
    settings: "设置",
    toBuyList: "购物清单",

    // Home Screen
    addRecipe: "添加食谱",
    recentRecipes: "最近食谱",
    familyMembers: "家庭成员",
    quickActions: "快速操作",
    noRecipes: "还没有食谱",

    // Recipe Management
    recipeName: "食谱名称",
    recipeNameEn: "食谱名称（英文）",
    description: "描述",
    cookingMethod: "烹饪方法",
    dishType: "菜系",
    servings: "份量",
    cookTime: "烹饪时间（分钟）",
    sourceUrl: "来源链接",
    ingredients: "材料",
    steps: "步骤",
    addIngredient: "添加材料",
    addStep: "添加步骤",
    save: "保存",
    cancel: "取消",
    delete: "删除",
    edit: "编辑",
    search: "搜索",
    searchByIngredient: "按材料搜索",

    // Cooking Methods
    stir_fry: "炒",
    steam: "蒸",
    cold_mix: "凉拌",
    braise: "炖",
    grill: "烤",
    boil: "煮",

    // Dish Types
    cantonese: "粤菜",
    chaoshan: "潮汕菜",
    hakka: "客家菜",
    sichuan: "川菜",
    jiangsu: "苏菜",
    other: "其他",

    // Weekly Planner
    weeklyPlan: "周计划",
    addToWeek: "添加到本周",
    removeFromWeek: "从本周移除",
    ingredientChecklist: "材料清单",
    allIngredientsChecked: "所有材料已勾选！",
    missingIngredients: "缺少的材料",
    addToShoppingList: "添加到购物清单",

    // Shopping List
    shoppingList: "购物清单",
    addItem: "添加项目",
    itemName: "项目名称",
    quantity: "数量",
    unit: "单位",
    markAsPurchased: "标记为已购买",
    clearAll: "全部清除",
    noItems: "没有项目",

    // Family Sharing
    household: "家庭",
    familyName: "家庭名称",
    members: "成员",
    inviteLink: "邀请链接",
    shareLink: "分享链接",
    copyLink: "复制链接",
    linkCopied: "链接已复制到剪贴板",
    joinHousehold: "加入家庭",
    inviteCode: "邀请码",
    join: "加入",
    invalidCode: "无效的邀请码",

    // Settings
    language: "语言",
    chinese: "中文",
    english: "English",
    theme: "主题",
    light: "浅色",
    dark: "深色",
    about: "关于",
    logout: "登出",

    // Messages
    loading: "加载中...",
    error: "错误",
    success: "成功",
    noConnection: "没有网络连接",
    tryAgain: "重试",
    confirm: "确认",
    areYouSure: "确定吗？",
    recipe: "食谱",
    recipeNotFound: "未找到食谱",
    back: "返回",
    close: "关闭",
    minutes: "分钟",
    addToThisWeek: "添加到本周",
    addedToWeeklyPlan: "已添加到本周食谱",
    source: "来源",
    fromUrl: "从链接提取",
    manual: "手动输入",
    recipeUrl: "食谱链接",
    enterRecipeUrl: "输入食谱链接（博客、YouTube、美食网站）",
    supportedSites: "支持的网站",
    extractRecipe: "提取食谱",
    recipeExtracted: "食谱提取成功",
    failedToExtractRecipe: "无法从链接提取食谱",
    enterRecipeName: "输入食谱名称",
    enterRecipeNameEn: "输入食谱英文名称",
    enterDescription: "输入食谱描述",
    createRecipe: "创建食谱",
    recipeCreated: "食谱创建成功",
    failedToCreateRecipe: "创建食谱失败",
    pleaseEnterUrl: "请输入链接",
    pleaseEnterRecipeName: "请输入食谱名称",
    pleaseSelectCookingMethod: "请选择烹饪方法",
    pleaseSelectDishType: "请选择菜系",
    noHousehold: "未找到家庭。请先创建或加入家庭。",
    requiredFields: "必填项",
    e.g.30: "如 30",
    e.g.4: "如 4",
    ingredientName: "材料名称",
    ingredientNameEn: "英文名称",
    quantity: "数量",
    unit: "单位",
    notes: "备注",
    smartInput: "智能识别",
    smartInputPlaceholder: "粘贴或输入食谱信息，AI 自动解析...",
    smartInputHint: "例如：番茄炒蛋，15分钟，2人份，材料：鸡蛋2个，番茄3个",
    parsingRecipe: "正在解析食谱...",
    smartInputParsed: "食谱信息解析成功",
    pleaseEnterItemName: "请输入项目名称",
    failedToAddItem: "添加项目失败",
    itemAdded: "项目添加成功",
    imageUrl: "图片链接",
    enterImageUrl: "输入图片链接",
    browseRecipes: "浏览食谱",
    viewOriginalLink: "查看原始链接",
  },
};

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const useI18n = create<I18nStore>()(
  persist(
    (set: any, get: any) => ({
      language: "en" as Language,
      setLanguage: (lang: Language) => set({ language: lang }),
      t: (key: string) => {
        const { language } = get() as { language: Language };
        return (translations[language] as any)[key] || key;
      },
    }),
    {
      name: "i18n-storage",
      storage: {
        getItem: async (name: string) => {
          const item = await AsyncStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: async (name: string, value: any) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name: string) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);
