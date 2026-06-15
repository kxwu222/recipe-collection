import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert, TextInput, Image } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { IconSymbol } from "@/components/ui/icon-symbol";

const DISH_TYPES = [
  { id: "cantonese", label: "Cantonese (粤菜)" },
  { id: "chaoshan", label: "Chaoshan (潮汕菜)" },
  { id: "hakka", label: "Hakka (客家菜)" },
  { id: "sichuan", label: "Sichuan (川菜)" },
  { id: "jiangsu", label: "Jiangsu (苏菜)" },
  { id: "other", label: "Other" },
];

const COOKING_METHODS = [
  { id: "stir_fry", label: "炒" },
  { id: "steam", label: "蒸" },
  { id: "cold_mix", label: "凉拌" },
  { id: "braise", label: "炖" },
  { id: "grill", label: "烤" },
  { id: "boil", label: "煮" },
  { id: "other", label: "Other" },
];

export default function RecipeDetailScreen() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [addingToWeek, setAddingToWeek] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const recipeId = id ? parseInt(id, 10) : null;

  // Edit states
  const [editName, setEditName] = useState("");
  const [editNameEn, setEditNameEn] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCookingMethod, setEditCookingMethod] = useState("");
  const [editDishType, setEditDishType] = useState("");
  const [editCookTime, setEditCookTime] = useState("");
  const [editServings, setEditServings] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  
  // Custom dropdown states for edit
  const [editDishTypePreset, setEditDishTypePreset] = useState("");
  const [showEditDishTypeDropdown, setShowEditDishTypeDropdown] = useState(false);
  const [editCookingMethodPreset, setEditCookingMethodPreset] = useState("");
  const [showEditCookingMethodDropdown, setShowEditCookingMethodDropdown] = useState(false);

  // Ingredients and Steps edit states
  const [editIngredients, setEditIngredients] = useState<{ name: string; nameEn?: string; quantity?: string; unit?: string; notes?: string }[]>([]);
  const [editSteps, setEditSteps] = useState<{ instruction: string; instructionEn?: string }[]>([]);

  // Smart input state
  const [smartInputText, setSmartInputText] = useState("");
  const [isParsingSmartInput, setIsParsingSmartInput] = useState(false);
  const [showSmartInput, setShowSmartInput] = useState(false);

  // Get recipe details
  const { data: recipe, isLoading } = trpc.recipe.get.useQuery(
    { id: recipeId || 0 },
    { enabled: isAuthenticated && recipeId !== null }
  );

  // Get user's households
  const { data: households } = trpc.household.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const utils = trpc.useUtils();

  const updateRecipe = trpc.recipe.update.useMutation({
    onSuccess: () => {
      Alert.alert(t("success"), "Recipe updated successfully");
      setIsEditing(false);
      utils.recipe.get.invalidate({ id: recipeId || 0 });
      utils.recipe.list.invalidate();
    },
    onError: (error) => {
      Alert.alert(t("error"), error.message || "Failed to update recipe");
    },
  });

  const deleteRecipe = trpc.recipe.delete.useMutation({
    onSuccess: () => {
      Alert.alert(t("success"), "Recipe deleted successfully");
      utils.recipe.list.invalidate();
      router.back();
    },
    onError: (error) => {
      Alert.alert(t("error"), error.message || "Failed to delete recipe");
    },
  });

  const addToWeeklyPlan = trpc.weeklyPlan.add.useMutation({
    onSuccess: () => {
      Alert.alert(t("success"), t("addedToWeeklyPlan"));
      setAddingToWeek(false);
    },
    onError: (error) => {
      Alert.alert(t("error"), error.message);
      setAddingToWeek(false);
    },
  });

  // Smart input mutation
  const parseSmartInput = trpc.recipe.parseSmartInput.useMutation({
    onSuccess: (data: any) => {
      setIsParsingSmartInput(false);
      // Populate form fields with parsed data
      if (data.name) setEditName(data.name);
      if (data.nameEn) setEditNameEn(data.nameEn);
      if (data.description) setEditDescription(data.description);
      if (data.cookingMethod) {
        setEditCookingMethod(data.cookingMethod);
        setEditCookingMethodPreset(data.cookingMethod);
      }
      if (data.dishType) {
        setEditDishType(data.dishType);
        setEditDishTypePreset(data.dishType);
      }
      if (data.cookTimeMinutes) setEditCookTime(data.cookTimeMinutes.toString());
      if (data.servings) setEditServings(data.servings.toString());
      if (data.ingredients && Array.isArray(data.ingredients)) {
        setEditIngredients(data.ingredients);
      }
      if (data.steps && Array.isArray(data.steps)) {
        setEditSteps(data.steps);
      }
      setShowSmartInput(false);
      setSmartInputText("");
      Alert.alert(t("success"), t("smartInputParsed"));
    },
    onError: (error) => {
      setIsParsingSmartInput(false);
      Alert.alert(t("error"), error.message || t("failedToCreateRecipe"));
    },
  });

  const handleParseSmartInput = () => {
    if (!smartInputText.trim()) return;
    setIsParsingSmartInput(true);
    parseSmartInput.mutate({ text: smartInputText.trim() });
  };

  const handleAddToWeek = () => {
    if (!recipe || !households || households.length === 0) return;

    setAddingToWeek(true);
    const weekStartDate = new Date();
    weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay());

    addToWeeklyPlan.mutate({
      recipeId: recipe.id,
      householdId: households[0].id,
      weekStartDate,
    });
  };

  const startEditing = () => {
    if (!recipe) return;
    setEditName(recipe.name);
    setEditNameEn(recipe.nameEn || "");
    setEditDescription(recipe.description || "");
    
    // Initialize Cooking Method presets
    const methodExists = COOKING_METHODS.some(m => m.id === recipe.cookingMethod);
    setEditCookingMethodPreset(methodExists ? recipe.cookingMethod : "other");
    setEditCookingMethod(recipe.cookingMethod);
    
    // Initialize Dish Type presets
    const typeExists = DISH_TYPES.some(t => t.id === recipe.dishType);
    setEditDishTypePreset(typeExists ? recipe.dishType : "other");
    setEditDishType(recipe.dishType);

    setEditCookTime(recipe.cookTimeMinutes ? recipe.cookTimeMinutes.toString() : "");
    setEditServings(recipe.servings ? recipe.servings.toString() : "");
    setEditImageUrl(recipe.imageUrl || "");
    
    setEditIngredients(recipe.ingredients ? recipe.ingredients.map((ing: any) => ({
      name: ing.name,
      nameEn: ing.nameEn || undefined,
      quantity: ing.quantity || undefined,
      unit: ing.unit || undefined,
      notes: ing.notes || undefined,
    })) : []);
    
    setEditSteps(recipe.steps ? recipe.steps.map((step: any) => ({
      instruction: step.instruction,
      instructionEn: step.instructionEn || undefined,
    })) : []);
    
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editName.trim()) {
      Alert.alert(t("error"), t("pleaseEnterRecipeName"));
      return;
    }
    if (!editCookingMethod.trim()) {
      Alert.alert(t("error"), t("pleaseSelectCookingMethod"));
      return;
    }
    if (!editDishType.trim()) {
      Alert.alert(t("error"), t("pleaseSelectDishType"));
      return;
    }

    // Filter out ingredients with empty names
    const finalIngredients = editIngredients.filter(ing => ing.name.trim() !== "");
    // Filter out steps with empty instruction
    const finalSteps = editSteps.filter(step => step.instruction.trim() !== "");

    if (recipeId) {
      updateRecipe.mutate({
        id: recipeId,
        data: {
          name: editName.trim(),
          nameEn: editNameEn.trim() || undefined,
          description: editDescription.trim() || undefined,
          cookingMethod: editCookingMethod.trim(),
          dishType: editDishType.trim(),
          cookTimeMinutes: editCookTime ? parseInt(editCookTime, 10) : undefined,
          servings: editServings ? parseInt(editServings, 10) : undefined,
          imageUrl: editImageUrl.trim() || undefined,
          ingredients: finalIngredients,
          steps: finalSteps,
        },
      });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t("confirm"),
      t("areYouSure"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: () => {
            if (recipeId) deleteRecipe.mutate({ id: recipeId });
          },
        },
      ]
    );
  };

  const handleAddIngredient = () => {
    setEditIngredients([...editIngredients, { name: "", quantity: "", unit: "", notes: "" }]);
  };

  const handleUpdateIngredient = (index: number, field: string, value: string) => {
    const updated = [...editIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setEditIngredients(updated);
  };

  const handleRemoveIngredient = (index: number) => {
    const updated = [...editIngredients];
    updated.splice(index, 1);
    setEditIngredients(updated);
  };

  const handleAddStep = () => {
    setEditSteps([...editSteps, { instruction: "", instructionEn: "" }]);
  };

  const handleUpdateStep = (index: number, field: string, value: string) => {
    const updated = [...editSteps];
    updated[index] = { ...updated[index], [field]: value };
    setEditSteps(updated);
  };

  const handleRemoveStep = (index: number) => {
    const updated = [...editSteps];
    updated.splice(index, 1);
    setEditSteps(updated);
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <Text className="text-2xl font-bold text-foreground mb-4">{t("recipe")}</Text>
        <Text className="text-center text-muted">Please log in to continue</Text>
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!recipe) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <Text className="text-lg text-muted">{t("recipeNotFound")}</Text>
        <TouchableOpacity
          className="mt-4 bg-primary rounded-lg px-6 py-3 active:opacity-80"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">{t("back")}</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  if (isEditing) {
    return (
      <ScreenContainer className="p-4">
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="gap-6">
            {/* Header */}
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-foreground">{t("edit")}</Text>
              <TouchableOpacity onPress={() => setIsEditing(false)} className="py-2 px-3 bg-surface rounded border border-border">
                <Text className="text-foreground font-semibold">{t("cancel")}</Text>
              </TouchableOpacity>
            </View>

            {/* Smart Input Toggle */}
            <TouchableOpacity
              className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex-row items-center justify-between"
              onPress={() => setShowSmartInput(!showSmartInput)}
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">🤖</Text>
                <Text className="text-primary font-semibold">{t("smartInput")}</Text>
              </View>
              <Text className="text-primary text-sm">
                {showSmartInput ? "▼" : "▶"}
              </Text>
            </TouchableOpacity>

            {/* Smart Input Section */}
            {showSmartInput && (
              <View className="bg-surface border border-border rounded-lg p-4 gap-3">
                <Text className="text-sm text-muted">{t("smartInputHint")}</Text>
                <TextInput
                  value={smartInputText}
                  onChangeText={setSmartInputText}
                  placeholder={t("smartInputPlaceholder")}
                  placeholderTextColor={colors.muted}
                  className="bg-background border border-border rounded-lg px-4 py-3 text-foreground text-base min-h-[100px]"
                  multiline
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  className={`rounded-lg p-3 ${isParsingSmartInput ? "bg-primary/50" : "bg-primary"}`}
                  onPress={handleParseSmartInput}
                  disabled={isParsingSmartInput || !smartInputText.trim()}
                >
                  {isParsingSmartInput ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-semibold text-center">
                      {t("smartInput")}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Form Fields */}
            <View className="gap-4">
              {/* Recipe Name */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">{t("recipeName")} *</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-base"
                />
              </View>

              {/* Recipe Name En */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">{t("recipeNameEn")}</Text>
                <TextInput
                  value={editNameEn}
                  onChangeText={setEditNameEn}
                  className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-base"
                />
              </View>

              {/* Image URL */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">{t("imageUrl")}</Text>
                <TextInput
                  value={editImageUrl}
                  onChangeText={setEditImageUrl}
                  placeholder={t("enterImageUrl")}
                  placeholderTextColor={colors.muted}
                  className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-base"
                />
              </View>

              {/* Description */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">{t("description")}</Text>
                <TextInput
                  value={editDescription}
                  onChangeText={setEditDescription}
                  className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground h-32 text-base"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              {/* Cooking Method Dropdown */}
              <View className="gap-2" style={{ zIndex: 2 }}>
                <Text className="text-sm font-semibold text-foreground">{t("cookingMethod")} *</Text>
                <TouchableOpacity
                  className="bg-surface border border-border rounded-lg px-4 py-3 flex-row justify-between items-center active:opacity-80"
                  onPress={() => setShowEditCookingMethodDropdown(!showEditCookingMethodDropdown)}
                >
                  <Text className={editCookingMethodPreset ? "text-foreground" : "text-muted"}>
                    {editCookingMethodPreset ? t(editCookingMethodPreset) : t("pleaseSelectCookingMethod")}
                  </Text>
                  <IconSymbol
                    size={20}
                    name="chevron.right"
                    color={colors.muted}
                    style={{
                      transform: [{ rotate: showEditCookingMethodDropdown ? "90deg" : "0deg" }],
                    }}
                  />
                </TouchableOpacity>

                {showEditCookingMethodDropdown && (
                  <View className="bg-surface border border-border rounded-lg mt-1 overflow-hidden shadow-sm max-h-48">
                    <ScrollView nestedScrollEnabled={true}>
                      {COOKING_METHODS.map((method) => (
                        <TouchableOpacity
                          key={method.id}
                          className="px-4 py-3 border-b border-border active:bg-primary/10 flex-row justify-between items-center"
                          onPress={() => {
                            setEditCookingMethodPreset(method.id);
                            setShowEditCookingMethodDropdown(false);
                            if (method.id !== "other") {
                              setEditCookingMethod(method.id);
                            } else {
                              setEditCookingMethod("");
                            }
                          }}
                        >
                          <Text className="text-foreground">{t(method.id)}</Text>
                          {editCookingMethodPreset === method.id && (
                            <Text className="text-primary font-bold">✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {editCookingMethodPreset === "other" && (
                  <TextInput
                    placeholder="Custom Cooking Method / 自定义烹饪方法"
                    placeholderTextColor={colors.muted}
                    value={editCookingMethod}
                    onChangeText={setEditCookingMethod}
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground mt-2"
                  />
                )}
              </View>

              {/* Dish Type Dropdown */}
              <View className="gap-2" style={{ zIndex: 1 }}>
                <Text className="text-sm font-semibold text-foreground">{t("dishType")} *</Text>
                <TouchableOpacity
                  className="bg-surface border border-border rounded-lg px-4 py-3 flex-row justify-between items-center active:opacity-80"
                  onPress={() => setShowEditDishTypeDropdown(!showEditDishTypeDropdown)}
                >
                  <Text className={editDishTypePreset ? "text-foreground" : "text-muted"}>
                    {editDishTypePreset ? t(editDishTypePreset) : t("pleaseSelectDishType")}
                  </Text>
                  <IconSymbol
                    size={20}
                    name="chevron.right"
                    color={colors.muted}
                    style={{
                      transform: [{ rotate: showEditDishTypeDropdown ? "90deg" : "0deg" }],
                    }}
                  />
                </TouchableOpacity>

                {showEditDishTypeDropdown && (
                  <View className="bg-surface border border-border rounded-lg mt-1 overflow-hidden shadow-sm max-h-48">
                    <ScrollView nestedScrollEnabled={true}>
                      {DISH_TYPES.map((type) => (
                        <TouchableOpacity
                          key={type.id}
                          className="px-4 py-3 border-b border-border active:bg-primary/10 flex-row justify-between items-center"
                          onPress={() => {
                            setEditDishTypePreset(type.id);
                            setShowEditDishTypeDropdown(false);
                            if (type.id !== "other") {
                              setEditDishType(type.id);
                            } else {
                              setEditDishType("");
                            }
                          }}
                        >
                          <Text className="text-foreground">{t(type.id)}</Text>
                          {editDishTypePreset === type.id && (
                            <Text className="text-primary font-bold">✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {editDishTypePreset === "other" && (
                  <TextInput
                    placeholder="Custom Dish Type / 自定义菜系"
                    placeholderTextColor={colors.muted}
                    value={editDishType}
                    onChangeText={setEditDishType}
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground mt-2"
                  />
                )}
              </View>

              {/* Cook Time & Servings */}
              <View className="flex-row gap-4">
                <View className="flex-1 gap-2">
                  <Text className="text-sm font-semibold text-foreground">{t("cookTime")}</Text>
                  <TextInput
                    value={editCookTime}
                    onChangeText={setEditCookTime}
                    keyboardType="number-pad"
                    placeholder={t("e.g.30")}
                    placeholderTextColor={colors.muted}
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-base"
                  />
                </View>
                <View className="flex-1 gap-2">
                  <Text className="text-sm font-semibold text-foreground">{t("servings")}</Text>
                  <TextInput
                    value={editServings}
                    onChangeText={setEditServings}
                    keyboardType="number-pad"
                    placeholder={t("e.g.4")}
                    placeholderTextColor={colors.muted}
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-base"
                  />
                </View>
              </View>

              {/* Ingredients Manager */}
              <View className="gap-2 mt-4">
                <Text className="text-lg font-bold text-foreground">{t("ingredients")}</Text>
                {editIngredients.map((ingredient, index) => (
                  <View key={index} className="bg-surface border border-border rounded-lg p-3 gap-2">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-xs font-semibold text-muted">Ingredient #{index + 1}</Text>
                      <TouchableOpacity onPress={() => handleRemoveIngredient(index)} className="px-2.5 py-1.5 bg-red-100 rounded">
                        <Text className="text-xs text-red-600 font-semibold">{t("delete")}</Text>
                      </TouchableOpacity>
                    </View>
                    <View className="gap-2">
                      <TextInput
                        placeholder={t("ingredientName")}
                        placeholderTextColor={colors.muted}
                        value={ingredient.name}
                        onChangeText={(val) => handleUpdateIngredient(index, "name", val)}
                        className="border border-border rounded px-3 py-2 text-foreground text-base bg-surface"
                      />
                      <TextInput
                        placeholder={t("ingredientNameEn")}
                        placeholderTextColor={colors.muted}
                        value={ingredient.nameEn || ""}
                        onChangeText={(val) => handleUpdateIngredient(index, "nameEn", val)}
                        className="border border-border rounded px-3 py-2 text-foreground text-base bg-surface"
                      />
                      <View className="flex-row gap-2">
                        <TextInput
                          placeholder={t("quantity")}
                          placeholderTextColor={colors.muted}
                          value={ingredient.quantity || ""}
                          onChangeText={(val) => handleUpdateIngredient(index, "quantity", val)}
                          className="flex-1 border border-border rounded px-3 py-2 text-foreground text-base bg-surface"
                        />
                        <TextInput
                          placeholder={t("unit")}
                          placeholderTextColor={colors.muted}
                          value={ingredient.unit || ""}
                          onChangeText={(val) => handleUpdateIngredient(index, "unit", val)}
                          className="flex-1 border border-border rounded px-3 py-2 text-foreground text-base bg-surface"
                        />
                      </View>
                      <TextInput
                        placeholder={t("notes")}
                        placeholderTextColor={colors.muted}
                        value={ingredient.notes || ""}
                        onChangeText={(val) => handleUpdateIngredient(index, "notes", val)}
                        className="border border-border rounded px-3 py-2 text-foreground text-base bg-surface"
                      />
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={handleAddIngredient}
                  className="py-2.5 bg-surface border border-dashed border-primary/50 rounded-lg items-center mt-2"
                >
                  <Text className="text-primary font-semibold">+ {t("addIngredient")}</Text>
                </TouchableOpacity>
              </View>

              {/* Steps Manager */}
              <View className="gap-2 mt-4">
                <Text className="text-lg font-bold text-foreground">{t("steps")}</Text>
                {editSteps.map((step, index) => (
                  <View key={index} className="bg-surface border border-border rounded-lg p-3 gap-2">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-xs font-semibold text-muted">Step #{index + 1}</Text>
                      <TouchableOpacity onPress={() => handleRemoveStep(index)} className="px-2.5 py-1.5 bg-red-100 rounded">
                        <Text className="text-xs text-red-600 font-semibold">{t("delete")}</Text>
                      </TouchableOpacity>
                    </View>
                    <View className="gap-2">
                      <TextInput
                        placeholder="Instruction / 步骤描述 *"
                        placeholderTextColor={colors.muted}
                        value={step.instruction}
                        onChangeText={(val) => handleUpdateStep(index, "instruction", val)}
                        className="border border-border rounded px-3 py-2 text-foreground text-base h-20 bg-surface"
                        multiline
                        textAlignVertical="top"
                      />
                      <TextInput
                        placeholder="English Instruction / 英文步骤描述"
                        placeholderTextColor={colors.muted}
                        value={step.instructionEn || ""}
                        onChangeText={(val) => handleUpdateStep(index, "instructionEn", val)}
                        className="border border-border rounded px-3 py-2 text-foreground text-base h-20 bg-surface"
                        multiline
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={handleAddStep}
                  className="py-2.5 bg-surface border border-dashed border-primary/50 rounded-lg items-center mt-2"
                >
                  <Text className="text-primary font-semibold">+ {t("addStep")}</Text>
                </TouchableOpacity>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                className="bg-primary rounded-lg p-4 active:opacity-80 mt-6"
                onPress={handleSave}
                disabled={updateRecipe.isPending}
              >
                {updateRecipe.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-semibold text-center text-lg">{t("save")}</Text>
                )}
              </TouchableOpacity>

              <Text className="text-xs text-muted text-center mb-8">
                * {t("requiredFields")}
              </Text>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-2">
            <TouchableOpacity onPress={() => router.back()} className="py-1">
              <Text className="text-primary font-semibold">← {t("back")}</Text>
            </TouchableOpacity>
            
            <View className="flex-row gap-4 items-center">
              <TouchableOpacity onPress={startEditing} className="p-1 active:opacity-60">
                <IconSymbol size={22} name="pencil" color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} className="p-1 active:opacity-60">
                <IconSymbol size={22} name="trash.fill" color={colors.warning} />
              </TouchableOpacity>
            </View>
          </View>

          <Text className="text-3xl font-bold text-foreground">{recipe.name}</Text>
          {recipe.nameEn && (
            <Text className="text-lg text-muted -mt-4">{recipe.nameEn}</Text>
          )}

          {/* Recipe Image */}
          {recipe.imageUrl && (
            <View className="h-48 bg-primary/5 rounded-xl items-center justify-center overflow-hidden">
              <Image
                source={{ uri: recipe.imageUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          )}

          {/* Quick Info */}
          <View className="flex-row gap-3 flex-wrap">
            {recipe.cookingMethod && (
              <View className="bg-primary/10 rounded-lg px-3 py-2">
                <Text className="text-xs text-muted">{t("cookingMethod")}</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {t(recipe.cookingMethod)}
                </Text>
              </View>
            )}
            {recipe.dishType && (
              <View className="bg-primary/10 rounded-lg px-3 py-2">
                <Text className="text-xs text-muted">{t("dishType")}</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {t(recipe.dishType)}
                </Text>
              </View>
            )}
            {recipe.cookTimeMinutes && (
              <View className="bg-primary/10 rounded-lg px-3 py-2">
                <Text className="text-xs text-muted">{t("cookTime")}</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {recipe.cookTimeMinutes} {t("minutes")}
                </Text>
              </View>
            )}
            {recipe.servings && (
              <View className="bg-primary/10 rounded-lg px-3 py-2">
                <Text className="text-xs text-muted">{t("servings")}</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {recipe.servings}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {recipe.description && (
            <View className="gap-2">
              <Text className="text-lg font-semibold text-foreground">
                {t("description")}
              </Text>
              <Text className="text-base text-foreground leading-relaxed">
                {recipe.description}
              </Text>
            </View>
          )}

          {/* Ingredients */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <View className="gap-2">
              <Text className="text-lg font-semibold text-foreground">
                {t("ingredients")}
              </Text>
              <View className="bg-surface rounded-lg p-4 gap-2">
                {recipe.ingredients.map((ingredient: any, index: number) => (
                  <View key={index} className="flex-row justify-between items-start gap-2">
                    <View className="flex-1">
                      <Text className="font-semibold text-foreground">
                        {ingredient.name}
                      </Text>
                      {ingredient.nameEn && (
                        <Text className="text-xs text-muted">{ingredient.nameEn}</Text>
                      )}
                    </View>
                    <View className="items-end">
                      {ingredient.quantity && (
                        <Text className="text-sm text-foreground">
                          {ingredient.quantity} {ingredient.unit || ""}
                        </Text>
                      )}
                      {ingredient.notes && (
                        <Text className="text-xs text-muted">{ingredient.notes}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Cooking Steps */}
          {recipe.steps && recipe.steps.length > 0 && (
            <View className="gap-2">
              <Text className="text-lg font-semibold text-foreground">
                {t("steps")}
              </Text>
              <View className="gap-3">
                {recipe.steps.map((step: any, index: number) => (
                  <View key={index} className="flex-row gap-3">
                    <View className="bg-primary rounded-full w-8 h-8 items-center justify-center">
                      <Text className="text-white font-bold text-sm">{index + 1}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base text-foreground leading-relaxed">
                        {step.instruction}
                      </Text>
                      {step.instructionEn && (
                        <Text className="text-xs text-muted mt-1">{step.instructionEn}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Source URL */}
          {recipe.sourceUrl && (
            <View className="gap-2">
              <Text className="text-sm text-muted">{t("source")}</Text>
              <TouchableOpacity
                className="bg-primary/10 rounded-lg p-3 flex-row items-center gap-2"
                onPress={() => {
                  // In a real app, this would open the URL
                  Alert.alert(t("viewOriginalLink"), recipe.sourceUrl);
                }}
              >
                <IconSymbol size={16} name="link" color={colors.primary} />
                <Text className="text-sm text-primary font-medium flex-1" numberOfLines={1}>
                  {recipe.sourceUrl}
                </Text>
                <IconSymbol size={14} name="arrow.up.right" color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <View className="gap-3 mt-4">
            <TouchableOpacity
              className="bg-primary rounded-lg p-4 active:opacity-80"
              onPress={handleAddToWeek}
              disabled={addingToWeek}
            >
              {addingToWeek ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-semibold text-center">
                  {t("addToThisWeek")}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-surface rounded-lg p-4 border border-border active:opacity-80"
              onPress={() => router.back()}
            >
              <Text className="text-foreground font-semibold text-center">{t("close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
