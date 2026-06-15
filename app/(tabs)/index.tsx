import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function HomeScreen() {
  const { t } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const [householdId, setHouseholdId] = useState<number | null>(null);

  // Get user's households
  const { data: households, isLoading: householdsLoading } = trpc.household.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Get recent recipes
  const { data: recipes, isLoading: recipesLoading } = trpc.recipe.list.useQuery(
    { householdId: householdId || 0 },
    { enabled: isAuthenticated && householdId !== null }
  );

  useEffect(() => {
    if (households && households.length > 0) {
      setHouseholdId(households[0].id);
    }
  }, [households]);

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <Text className="text-2xl font-bold text-foreground mb-4">{t("home")}</Text>
        <Text className="text-center text-muted mb-8">Please log in to continue</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2 mb-2 mt-4">
            <Text className="text-4xl font-extrabold text-foreground tracking-tight">
              {t("home")}
            </Text>
            <Text className="text-base text-muted font-medium">
              {user?.name ? `Welcome back, ${user.name} 👋` : "Welcome to your kitchen"}
            </Text>
          </View>

          {/* Quick Actions */}
          <View className="gap-4">
            <Text className="text-xl font-bold text-foreground">{t("quickActions")}</Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                className="flex-1 bg-primary rounded-2xl p-5 items-center justify-center active:opacity-80"
                style={{ shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
                onPress={() => router.push("/add-recipe")}
              >
                <View className="bg-white/20 p-3 rounded-full mb-3">
                  <IconSymbol size={28} name="plus" color="#fff" />
                </View>
                <Text className="text-white font-bold text-center">{t("addRecipe")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-surface rounded-2xl p-5 items-center justify-center active:opacity-80 border border-border"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                onPress={() => router.push("/this-week")}
              >
                <View className="bg-primary/10 p-3 rounded-full mb-3">
                  <IconSymbol size={28} name="calendar" color={colors.primary} />
                </View>
                <Text className="text-foreground font-bold text-center">{t("thisWeek")}</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-4">
              <TouchableOpacity
                className="flex-1 bg-surface rounded-2xl p-5 items-center justify-center active:opacity-80 border border-border"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                onPress={() => router.push("/shopping-list")}
              >
                <View className="bg-primary/10 p-3 rounded-full mb-3">
                  <IconSymbol size={28} name="cart.fill" color={colors.primary} />
                </View>
                <Text className="text-foreground font-bold text-center">{t("toBuyList")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-surface rounded-2xl p-5 items-center justify-center active:opacity-80 border border-border"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                onPress={() => router.push("/recipes?focusSearch=true")}
              >
                <View className="bg-primary/10 p-3 rounded-full mb-3">
                  <IconSymbol size={28} name="magnifyingglass" color={colors.primary} />
                </View>
                <Text className="text-foreground font-bold text-center">{t("search")}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Household Info */}
          {householdsLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : households && households.length > 0 ? (
            <View className="bg-surface rounded-2xl p-5 border border-border flex-row items-center justify-between mt-2"
                  style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <View>
                <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-1">{t("household")}</Text>
                <Text className="text-xl font-bold text-foreground">{households[0].name}</Text>
              </View>
              <TouchableOpacity
                className="bg-primary/10 px-4 py-2 rounded-full active:opacity-80"
                onPress={() => router.push("/family" as any)}
              >
                <Text className="text-primary font-bold">{t("members")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="bg-surface rounded-2xl p-5 border border-border active:opacity-80 flex-row items-center justify-center gap-2 mt-2"
              onPress={() => router.push("/create-household" as any)}
            >
              <IconSymbol size={20} name="house.fill" color={colors.primary} />
              <Text className="text-foreground font-bold text-center">
                {t("household")} - {t("join")}
              </Text>
            </TouchableOpacity>
          )}

          {/* Recent Recipes */}
          <View className="gap-4 pb-8 mt-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-foreground">{t("recentRecipes")}</Text>
              <TouchableOpacity onPress={() => router.push("/recipes")}>
                <Text className="text-primary font-semibold">View All</Text>
              </TouchableOpacity>
            </View>
            
            {recipesLoading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : recipes && recipes.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                {recipes.slice(0, 5).map((recipe) => (
                  <TouchableOpacity
                    key={recipe.id}
                    className="bg-surface rounded-2xl p-4 border border-border active:opacity-80 w-64"
                    style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                    onPress={() => router.push(`/recipe/${recipe.id}`)}
                  >
                    <View className="h-32 bg-primary/5 rounded-xl mb-3 items-center justify-center overflow-hidden">
                      {recipe.imageUrl ? (
                        <Image
                          source={{ uri: recipe.imageUrl }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <IconSymbol size={40} name="book.fill" color={colors.primary} />
                      )}
                    </View>
                    <Text className="font-bold text-lg text-foreground mb-1" numberOfLines={1}>{recipe.name}</Text>
                    <View className="flex-row gap-2">
                      <Text className="text-xs bg-primary/10 text-primary font-medium px-2 py-1 rounded-full overflow-hidden">
                        {t(recipe.cookingMethod)}
                      </Text>
                      <Text className="text-xs bg-primary/10 text-primary font-medium px-2 py-1 rounded-full overflow-hidden">
                        {t(recipe.dishType)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View className="bg-surface rounded-2xl p-8 border border-border items-center justify-center"
                    style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                <IconSymbol size={48} name="book.fill" color={colors.muted} />
                <Text className="text-center text-muted mt-4 font-medium">{t("noRecipes")}</Text>
                <TouchableOpacity 
                  className="mt-4 bg-primary px-6 py-3 rounded-full active:opacity-80"
                  onPress={() => router.push("/add-recipe")}
                >
                  <Text className="text-white font-bold">Add Your First Recipe</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
