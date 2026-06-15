import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useI18n } from "@/lib/i18n";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

type RecipeMode = "url" | "manual";

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

export default function AddRecipeScreen() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const colors = useColors();
  const router = useRouter();

  const [mode, setMode] = useState<RecipeMode>("url");
  const [url, setUrl] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  // Manual entry state
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [description, setDescription] = useState("");
  const [cookingMethod, setCookingMethod] = useState("");
  const [dishType, setDishType] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");

  // Dropdown states
  const [dishTypePreset, setDishTypePreset] = useState("");
  const [showDishTypeDropdown, setShowDishTypeDropdown] = useState(false);
  const [cookingMethodPreset, setCookingMethodPreset] = useState("");
  const [showCookingMethodDropdown, setShowCookingMethodDropdown] = useState(false);

  // Smart input state
  const [smartInputText, setSmartInputText] = useState("");
  const [isParsingSmartInput, setIsParsingSmartInput] = useState(false);
  const [showSmartInput, setShowSmartInput] = useState(false);

  // Get user's households
  const { data: households } = trpc.household.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
  const utils = trpc.useUtils();
  const extractRecipe = trpc.recipe.extract.useMutation({
    onSuccess: (data: any) => {
      setIsExtracting(false);
      Alert.alert(t("success"), t("recipeExtracted"));
      // Invalidate recipe list to refresh data
      utils.recipe.list.invalidate();
      // Navigate to recipe detail or show extracted data
      if (data.id) {
        router.push(`/recipe/${data.id}`);
      }
    },
    onError: (error: any) => {
      setIsExtracting(false);
      Alert.alert(t("error"), error.message || t("failedToExtractRecipe"));
    },
  });

  const createRecipe = trpc.recipe.create.useMutation({
    onSuccess: (data) => {
      Alert.alert(t("success"), t("recipeCreated"));
      setName("");
      setNameEn("");
      setDescription("");
      setCookingMethod("");
      setDishType("");
      setCookTime("");
      setServings("");
      setDishTypePreset("");
      setCookingMethodPreset("");
      // Invalidate recipe list to refresh data
      utils.recipe.list.invalidate();
      router.push(`/recipe/${data.id}`);
    },
    onError: (error) => {
      Alert.alert(t("error"), error.message || t("failedToCreateRecipe"));
    },
  });

  // Smart input mutation
  const parseSmartInput = trpc.recipe.parseSmartInput.useMutation({
    onSuccess: (data: any) => {
      setIsParsingSmartInput(false);
      // Populate form fields with parsed data
      if (data.name) setName(data.name);
      if (data.nameEn) setNameEn(data.nameEn);
      if (data.description) setDescription(data.description);
      if (data.cookingMethod) {
        setCookingMethod(data.cookingMethod);
        setCookingMethodPreset(data.cookingMethod);
      }
      if (data.dishType) {
        setDishType(data.dishType);
        setDishTypePreset(data.dishType);
      }
      if (data.cookTimeMinutes) setCookTime(data.cookTimeMinutes.toString());
      if (data.servings) setServings(data.servings.toString());
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

  const handleExtractRecipe = async () => {
    if (!url.trim()) {
      Alert.alert(t("error"), t("pleaseEnterUrl"));
      return;
    }

    if (!households || households.length === 0) {
      Alert.alert(t("error"), t("noHousehold"));
      return;
    }

    setIsExtracting(true);
    extractRecipe.mutate({
      url: url.trim(),
    });
  };

  const handleCreateRecipe = async () => {
    if (!name.trim()) {
      Alert.alert(t("error"), t("pleaseEnterRecipeName"));
      return;
    }

    if (!cookingMethod.trim()) {
      Alert.alert(t("error"), t("pleaseSelectCookingMethod"));
      return;
    }

    if (!dishType.trim()) {
      Alert.alert(t("error"), t("pleaseSelectDishType"));
      return;
    }

    if (!households || households.length === 0) {
      Alert.alert(t("error"), t("noHousehold"));
      return;
    }

    createRecipe.mutate({
      name: name.trim(),
      nameEn: nameEn.trim() || undefined,
      description: description.trim() || undefined,
      cookingMethod: cookingMethod.trim(),
      dishType: dishType.trim(),
      cookTimeMinutes: cookTime ? parseInt(cookTime, 10) : undefined,
      servings: servings ? parseInt(servings, 10) : undefined,
      householdId: households[0].id,
    });
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <Text className="text-2xl font-bold text-foreground mb-4">{t("addRecipe")}</Text>
        <Text className="text-center text-muted">Please log in to continue</Text>
      </ScreenContainer>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScreenContainer className="p-4">
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="gap-6">
            {/* Header */}
            <View className="gap-2 mb-2 mt-4">
              <TouchableOpacity onPress={() => router.back()} className="mb-2">
                <Text className="text-primary font-bold text-base">← {t("back")}</Text>
              </TouchableOpacity>
              <Text className="text-3xl font-extrabold text-foreground tracking-tight">{t("addRecipe")}</Text>
            </View>

            {/* Mode Selector */}
            <View className="flex-row gap-2 bg-surface rounded-2xl p-2 border border-border" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl ${
                  mode === "url" ? "bg-primary shadow-sm" : "bg-transparent"
                }`}
                onPress={() => setMode("url")}
              >
                <Text
                  className={`font-bold text-center ${
                    mode === "url" ? "text-white" : "text-muted"
                  }`}
                >
                  {t("fromUrl")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl ${
                  mode === "manual" ? "bg-primary shadow-sm" : "bg-transparent"
                }`}
                onPress={() => setMode("manual")}
              >
                <Text
                  className={`font-bold text-center ${
                    mode === "manual" ? "text-white" : "text-muted"
                  }`}
                >
                  {t("manual")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Smart Input Toggle */}
            <TouchableOpacity
              className="bg-primary/10 border border-primary/30 rounded-2xl p-4 flex-row items-center justify-between"
              onPress={() => setShowSmartInput(!showSmartInput)}
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
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
              <View className="bg-surface border border-border rounded-2xl p-4 gap-3" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                <Text className="text-sm text-muted">{t("smartInputHint")}</Text>
                <TextInput
                  value={smartInputText}
                  onChangeText={setSmartInputText}
                  placeholder={t("smartInputPlaceholder")}
                  placeholderTextColor={colors.muted}
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-base min-h-[100px]"
                  multiline
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  className={`rounded-2xl p-3 ${isParsingSmartInput ? "bg-primary/50" : "bg-primary"}`}
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

            {/* URL Mode */}
            {mode === "url" && (
              <View className="gap-6 mt-4">
                <View className="gap-2">
                  <Text className="text-sm font-bold text-muted uppercase tracking-wider pl-1">{t("recipeUrl")}</Text>
                  <TextInput
                    placeholder={t("enterRecipeUrl")}
                    placeholderTextColor={colors.muted}
                    value={url}
                    onChangeText={setUrl}
                    editable={!isExtracting}
                    className="bg-surface border border-border rounded-2xl px-5 py-4 text-foreground text-base shadow-sm font-medium"
                    style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                    multiline
                  />
                  <Text className="text-xs text-muted pl-1">
                    {t("supportedSites")}: Blog, YouTube, Food websites
                  </Text>
                </View>

                <TouchableOpacity
                  className={`rounded-2xl p-4 active:opacity-80 shadow-md ${
                    isExtracting ? "bg-primary/50" : "bg-primary"
                  }`}
                  style={{ shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
                  onPress={handleExtractRecipe}
                  disabled={isExtracting}
                >
                  {isExtracting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-bold text-center text-lg">
                      {t("extractRecipe")}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Manual Mode */}
            {mode === "manual" && (
              <View className="gap-4">
                {/* Recipe Name */}
                <View className="gap-2 mt-4">
                  <Text className="text-sm font-bold text-muted uppercase tracking-wider pl-1">
                    {t("recipeName")} *
                  </Text>
                  <TextInput
                    placeholder={t("enterRecipeName")}
                    placeholderTextColor={colors.muted}
                    value={name}
                    onChangeText={setName}
                    className="bg-surface border border-border rounded-2xl px-5 py-4 text-foreground text-base shadow-sm font-medium"
                    style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                  />
                </View>

                {/* Recipe Name (English) */}
                <View className="gap-2">
                  <Text className="text-sm font-bold text-muted uppercase tracking-wider pl-1">
                    {t("recipeNameEn")}
                  </Text>
                  <TextInput
                    placeholder={t("enterRecipeNameEn")}
                    placeholderTextColor={colors.muted}
                    value={nameEn}
                    onChangeText={setNameEn}
                    className="bg-surface border border-border rounded-2xl px-5 py-4 text-foreground text-base shadow-sm font-medium"
                    style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                  />
                </View>

                {/* Description */}
                <View className="gap-2">
                  <Text className="text-sm font-bold text-muted uppercase tracking-wider pl-1">
                    {t("description")}
                  </Text>
                  <TextInput
                    placeholder={t("enterDescription")}
                    placeholderTextColor={colors.muted}
                    value={description}
                    onChangeText={setDescription}
                    className="bg-surface border border-border rounded-2xl px-5 py-4 text-foreground text-base shadow-sm font-medium h-32"
                    style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>

                {/* Cooking Method */}
                <View className="gap-2" style={{ zIndex: 2 }}>
                  <Text className="text-sm font-bold text-muted uppercase tracking-wider pl-1">
                    {t("cookingMethod")} *
                  </Text>
                  
                  <TouchableOpacity
                    className="bg-surface border border-border rounded-2xl px-5 py-4 flex-row justify-between items-center active:opacity-80 shadow-sm"
                    style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                    onPress={() => setShowCookingMethodDropdown(!showCookingMethodDropdown)}
                  >
                    <Text className={`text-base font-medium ${cookingMethodPreset ? "text-foreground" : "text-muted"}`}>
                      {cookingMethodPreset ? t(cookingMethodPreset) : t("pleaseSelectCookingMethod")}
                    </Text>
                    <IconSymbol
                      size={20}
                      name="chevron.right"
                      color={colors.muted}
                      style={{
                        transform: [{ rotate: showCookingMethodDropdown ? "90deg" : "0deg" }],
                      }}
                    />
                  </TouchableOpacity>

                  {showCookingMethodDropdown && (
                    <View className="bg-surface border border-border rounded-lg mt-1 overflow-hidden shadow-sm max-h-48">
                      <ScrollView nestedScrollEnabled={true}>
                        {COOKING_METHODS.map((method) => (
                          <TouchableOpacity
                            key={method.id}
                            className="px-4 py-3 border-b border-border active:bg-primary/10 flex-row justify-between items-center"
                            onPress={() => {
                              setCookingMethodPreset(method.id);
                              setShowCookingMethodDropdown(false);
                              if (method.id !== "other") {
                                setCookingMethod(method.id);
                              } else {
                                setCookingMethod("");
                              }
                            }}
                          >
                            <Text className="text-foreground">{t(method.id)}</Text>
                            {cookingMethodPreset === method.id && (
                              <Text className="text-primary font-bold">✓</Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {cookingMethodPreset === "other" && (
                    <TextInput
                      placeholder="Custom Cooking Method / 自定义烹饪方法"
                      placeholderTextColor={colors.muted}
                      value={cookingMethod}
                      onChangeText={setCookingMethod}
                      className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground mt-2"
                    />
                  )}
                </View>

                {/* Dish Type */}
                <View className="gap-2" style={{ zIndex: 1 }}>
                  <Text className="text-sm font-bold text-muted uppercase tracking-wider pl-1">
                    {t("dishType")} *
                  </Text>
                  
                  <TouchableOpacity
                    className="bg-surface border border-border rounded-2xl px-5 py-4 flex-row justify-between items-center active:opacity-80 shadow-sm"
                    style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                    onPress={() => setShowDishTypeDropdown(!showDishTypeDropdown)}
                  >
                    <Text className={`text-base font-medium ${dishTypePreset ? "text-foreground" : "text-muted"}`}>
                      {dishTypePreset ? t(dishTypePreset) : t("pleaseSelectDishType")}
                    </Text>
                    <IconSymbol
                      size={20}
                      name="chevron.right"
                      color={colors.muted}
                      style={{
                        transform: [{ rotate: showDishTypeDropdown ? "90deg" : "0deg" }],
                      }}
                    />
                  </TouchableOpacity>

                  {showDishTypeDropdown && (
                    <View className="bg-surface border border-border rounded-lg mt-1 overflow-hidden shadow-sm max-h-48">
                      <ScrollView nestedScrollEnabled={true}>
                        {DISH_TYPES.map((type) => (
                          <TouchableOpacity
                            key={type.id}
                            className="px-4 py-3 border-b border-border active:bg-primary/10 flex-row justify-between items-center"
                            onPress={() => {
                              setDishTypePreset(type.id);
                              setShowDishTypeDropdown(false);
                              if (type.id !== "other") {
                                setDishType(type.id);
                              } else {
                                setDishType("");
                              }
                            }}
                          >
                            <Text className="text-foreground">{t(type.id)}</Text>
                            {dishTypePreset === type.id && (
                              <Text className="text-primary font-bold">✓</Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {dishTypePreset === "other" && (
                    <TextInput
                      placeholder="Custom Dish Type / 自定义菜系"
                      placeholderTextColor={colors.muted}
                      value={dishType}
                      onChangeText={setDishType}
                      className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground mt-2"
                    />
                  )}
                </View>

                {/* Cook Time */}
                <View className="gap-2">
                  <Text className="text-sm font-bold text-muted uppercase tracking-wider pl-1">
                    {t("cookTime")} ({t("minutes")})
                  </Text>
                  <TextInput
                    placeholder={t("e.g.30")}
                    placeholderTextColor={colors.muted}
                    value={cookTime}
                    onChangeText={setCookTime}
                    keyboardType="number-pad"
                    className="bg-surface border border-border rounded-2xl px-5 py-4 text-foreground text-base shadow-sm font-medium"
                    style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                  />
                </View>

                {/* Servings */}
                <View className="gap-2">
                  <Text className="text-sm font-bold text-muted uppercase tracking-wider pl-1">
                    {t("servings")}
                  </Text>
                  <TextInput
                    placeholder={t("e.g.4")}
                    placeholderTextColor={colors.muted}
                    value={servings}
                    onChangeText={setServings}
                    keyboardType="number-pad"
                    className="bg-surface border border-border rounded-2xl px-5 py-4 text-foreground text-base shadow-sm font-medium"
                    style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                  />
                </View>

                {/* Create Button */}
                <TouchableOpacity
                  className="bg-primary rounded-2xl p-4 active:opacity-80 mt-6 shadow-md"
                  style={{ shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
                  onPress={handleCreateRecipe}
                  disabled={createRecipe.isPending}
                >
                  {createRecipe.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-bold text-center text-lg">
                      {t("createRecipe")}
                    </Text>
                  )}
                </TouchableOpacity>

                <Text className="text-xs text-muted text-center">
                  {t("requiredFields")}: {t("recipeName")}, {t("cookingMethod")}, {t("dishType")}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
