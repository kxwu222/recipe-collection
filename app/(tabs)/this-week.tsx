import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { IconSymbol } from "@/components/ui/icon-symbol";

function getWeekStartDate(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day;
  return new Date(now.setDate(diff));
}

export default function ThisWeekScreen() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const [householdId, setHouseholdId] = useState<number | null>(null);
  const weekStartDate = getWeekStartDate();

  // Get user's households
  const { data: households } = trpc.household.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Get weekly plan
  const { data: weeklyPlan, isLoading } = trpc.weeklyPlan.list.useQuery(
    { householdId: householdId || 0, weekStartDate },
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
        <Text className="text-2xl font-bold text-foreground mb-4">{t("thisWeek")}</Text>
        <Text className="text-center text-muted">Please log in to continue</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-2 mt-4">
            <Text className="text-3xl font-extrabold text-foreground tracking-tight">{t("thisWeek")}</Text>
            <TouchableOpacity
              className="bg-primary rounded-full w-12 h-12 items-center justify-center active:opacity-80"
              style={{ shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
              onPress={() => router.push("/recipes")}
            >
              <IconSymbol size={24} name="plus" color="white" />
            </TouchableOpacity>
          </View>

          {/* Weekly Recipes */}
          <View className="gap-3">
            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} className="mt-8" />
            ) : weeklyPlan && weeklyPlan.length > 0 ? (
              weeklyPlan.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  className="bg-surface rounded-2xl p-5 border border-border active:opacity-80 shadow-sm"
                  style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                  onPress={() => router.push(`/recipe/${item.recipe.id}`)}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="font-bold text-lg text-foreground mb-2">
                        {item.recipe.name}
                      </Text>
                      <View className="flex-row gap-2">
                        <Text className="text-xs font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-full overflow-hidden">
                          {t(item.recipe.cookingMethod)}
                        </Text>
                        <Text className="text-xs font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-full overflow-hidden">
                          {t(item.recipe.dishType)}
                        </Text>
                      </View>
                      <TouchableOpacity className="mt-4 flex-row items-center gap-1 active:opacity-80">
                        <IconSymbol size={16} name="list.bullet" color={colors.primary} />
                        <Text className="text-primary text-sm font-bold ml-1">
                          {t("ingredientChecklist")} →
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View className="bg-primary/5 p-3 rounded-xl ml-4">
                      {item.recipe.imageUrl ? (
                        <Image
                          source={{ uri: item.recipe.imageUrl }}
                          className="w-14 h-14 rounded-xl"
                          resizeMode="cover"
                        />
                      ) : (
                        <IconSymbol size={28} name="book.fill" color={colors.primary} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="bg-surface rounded-2xl p-10 border border-border items-center justify-center shadow-sm"
                    style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                <IconSymbol size={48} name="calendar" color={colors.muted} />
                <Text className="text-center text-muted font-medium mb-6 mt-4 text-base">{t("noRecipes")}</Text>
                <TouchableOpacity
                  className="bg-primary px-8 py-4 rounded-full active:opacity-80 shadow-md"
                  style={{ shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
                  onPress={() => router.push("/recipes")}
                >
                  <Text className="text-white font-bold text-center text-base">{t("browseRecipes")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Shopping List Button */}
          {weeklyPlan && weeklyPlan.length > 0 && (
            <TouchableOpacity
              className="bg-primary rounded-2xl p-4 active:opacity-80 mt-4 flex-row items-center justify-center gap-2 shadow-md"
              style={{ shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
              onPress={() => router.push("/shopping-list")}
            >
              <IconSymbol size={24} name="cart.fill" color="white" />
              <Text className="text-white font-bold text-center text-lg">
                {t("toBuyList")}
              </Text>
              <IconSymbol size={20} name="chevron.right" color="white" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
