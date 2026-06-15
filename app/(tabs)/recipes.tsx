import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, TextInput, Image } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef } from "react";
import { IconSymbol } from "@/components/ui/icon-symbol";

const COOKING_METHODS = [
  { id: "stir_fry", label: "炒" },
  { id: "steam", label: "蒸" },
  { id: "cold_mix", label: "凉拌" },
  { id: "braise", label: "炖" },
  { id: "grill", label: "烤" },
  { id: "boil", label: "煮" },
];

const DISH_TYPES = [
  { id: "cantonese", label: "粤菜" },
  { id: "chaoshan", label: "潮汕菜" },
  { id: "hakka", label: "客家菜" },
  { id: "sichuan", label: "川菜" },
  { id: "jiangsu", label: "苏菜" },
];

export default function RecipesScreen() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const { focusSearch } = useLocalSearchParams<{ focusSearch?: string }>();
  const searchInputRef = useRef<TextInput>(null);

  const [householdId, setHouseholdId] = useState<number | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Get user's households
  const { data: households } = trpc.household.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Get recipes
  const { data: recipes, isLoading } = trpc.recipe.list.useQuery(
    { householdId: householdId || 0 },
    { enabled: isAuthenticated && householdId !== null }
  );

  // Search recipes by ingredient
  const { data: searchedByIngredient } = trpc.recipe.search.useQuery(
    { householdId: householdId || 0, ingredientName: searchQuery },
    { enabled: isAuthenticated && householdId !== null && searchQuery.trim().length > 0 }
  );

  useEffect(() => {
    if (households && households.length > 0) {
      setHouseholdId(households[0].id);
    }
  }, [households]);

  useEffect(() => {
    if (focusSearch === "true") {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [focusSearch]);

  const filteredRecipes = recipes?.filter((recipe) => {
    // 1. Filter by Cooking Method
    if (selectedMethod && recipe.cookingMethod !== selectedMethod) return false;
    
    // 2. Filter by Dish Type
    if (selectedType && recipe.dishType !== selectedType) return false;

    // 3. Filter by Search Query
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const nameMatches = recipe.name.toLowerCase().includes(query) ||
      (recipe.nameEn && recipe.nameEn.toLowerCase().includes(query));
    if (nameMatches) return true;

    const isMatchedByIngredient = searchedByIngredient?.some((r) => r.id === recipe.id);
    if (isMatchedByIngredient) return true;

    return false;
  });

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <Text className="text-2xl font-bold text-foreground mb-4">{t("recipes")}</Text>
        <Text className="text-center text-muted">Please log in to continue</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-3xl font-extrabold text-foreground tracking-tight">{t("recipes")}</Text>
            <TouchableOpacity
              className="bg-primary rounded-full w-12 h-12 items-center justify-center active:opacity-80"
              style={{ shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
              onPress={() => router.push("/add-recipe")}
            >
              <IconSymbol size={24} name="plus" color="white" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-surface border border-border rounded-2xl px-4 py-2"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <IconSymbol size={20} name="magnifyingglass" color={colors.muted} />
            <TextInput
              ref={searchInputRef}
              placeholder={`${t("searchByIngredient")} / ${t("recipeName")}`}
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-foreground px-3 py-2 text-base font-medium"
              clearButtonMode="while-editing"
            />
            {searchQuery.trim().length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} className="bg-muted/20 rounded-full p-1">
                <Text className="text-muted font-bold text-xs px-1">✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filters */}
          <View className="gap-4 py-2">
            <View>
              <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-2">{t("cookingMethod")}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity
                  className={`px-5 py-2 rounded-full border ${
                    selectedMethod === null
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                  onPress={() => setSelectedMethod(null)}
                >
                  <Text className={`font-bold ${selectedMethod === null ? "text-white" : "text-foreground"}`}>
                    All
                  </Text>
                </TouchableOpacity>
                {COOKING_METHODS.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    className={`px-5 py-2 rounded-full border ${
                      selectedMethod === method.id
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                    onPress={() => setSelectedMethod(method.id)}
                  >
                    <Text className={`font-bold ${selectedMethod === method.id ? "text-white" : "text-foreground"}`}>
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View>
              <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-2">{t("dishType")}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity
                  className={`px-5 py-2 rounded-full border ${
                    selectedType === null
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                  onPress={() => setSelectedType(null)}
                >
                  <Text className={`font-bold ${selectedType === null ? "text-white" : "text-foreground"}`}>
                    All
                  </Text>
                </TouchableOpacity>
                {DISH_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    className={`px-5 py-2 rounded-full border ${
                      selectedType === type.id
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                    onPress={() => setSelectedType(type.id)}
                  >
                    <Text className={`font-bold ${selectedType === type.id ? "text-white" : "text-foreground"}`}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Recipe List */}
          <View className="flex-row flex-wrap gap-2 pb-8 justify-between">
            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} className="w-full mt-8" />
            ) : filteredRecipes && filteredRecipes.length > 0 ? (
              filteredRecipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  className="bg-surface rounded-2xl p-3 border border-border active:opacity-80"
                  style={{ width: '48%', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                  onPress={() => router.push(`/recipe/${recipe.id}`)}
                >
                  <View className="h-28 bg-primary/5 rounded-xl mb-3 items-center justify-center overflow-hidden">
                    {recipe.imageUrl ? (
                      <Image
                        source={{ uri: recipe.imageUrl }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <IconSymbol size={36} name="book.fill" color={colors.primary} />
                    )}
                  </View>
                  <Text className="font-bold text-base text-foreground mb-1" numberOfLines={1}>
                    {recipe.name}
                  </Text>
                  <View className="flex-row gap-1 flex-wrap">
                    <Text className="text-[10px] bg-primary/10 text-primary font-medium px-2 py-1 rounded-full">
                      {t(recipe.cookingMethod)}
                    </Text>
                    <Text className="text-[10px] bg-primary/10 text-primary font-medium px-2 py-1 rounded-full">
                      {t(recipe.dishType)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="w-full items-center justify-center py-12">
                <IconSymbol size={48} name="magnifyingglass" color={colors.muted} />
                <Text className="text-center text-muted font-medium mt-4">{t("noRecipes")}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
