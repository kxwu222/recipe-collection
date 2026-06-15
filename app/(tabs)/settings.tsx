import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useI18n, type Language } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function SettingsScreen() {
  const { t, language, setLanguage } = useI18n();
  const { user, logout, isAuthenticated } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <Text className="text-3xl font-extrabold text-foreground tracking-tight mb-2 mt-4">{t("settings")}</Text>

          {/* User Info */}
          {isAuthenticated && user && (
            <View className="bg-surface rounded-2xl p-5 border border-border shadow-sm" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <Text className="text-sm font-bold text-muted uppercase tracking-wider mb-2">User</Text>
              <Text className="text-xl font-bold text-foreground">{user.name || "User"}</Text>
              {user.email && (
                <Text className="text-sm font-medium text-muted mt-1">{user.email}</Text>
              )}
            </View>
          )}

          {/* Language Settings */}
          <View className="gap-3">
            <Text className="text-sm font-bold text-muted uppercase tracking-wider pl-1">{t("language")}</Text>
            <TouchableOpacity
              className={`rounded-2xl p-4 border shadow-sm ${
                language === "en"
                  ? "bg-primary border-primary"
                  : "bg-surface border-border"
              } active:opacity-80`}
              style={{ shadowColor: language === "en" ? colors.primary : "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: language === "en" ? 0.2 : 0.05, shadowRadius: 4, elevation: 2 }}
              onPress={() => handleLanguageChange("en")}
            >
              <View className="flex-row items-center justify-between">
                <Text
                  className={`font-bold text-base ${
                    language === "en" ? "text-white" : "text-foreground"
                  }`}
                >
                  English
                </Text>
                {language === "en" && (
                  <Text className="text-white font-bold text-lg">✓</Text>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className={`rounded-2xl p-4 border shadow-sm ${
                language === "zh"
                  ? "bg-primary border-primary"
                  : "bg-surface border-border"
              } active:opacity-80`}
              style={{ shadowColor: language === "zh" ? colors.primary : "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: language === "zh" ? 0.2 : 0.05, shadowRadius: 4, elevation: 2 }}
              onPress={() => handleLanguageChange("zh")}
            >
              <View className="flex-row items-center justify-between">
                <Text
                  className={`font-bold text-base ${
                    language === "zh" ? "text-white" : "text-foreground"
                  }`}
                >
                  中文
                </Text>
                {language === "zh" && (
                  <Text className="text-white font-bold text-lg">✓</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Theme Settings */}
          <View className="gap-3">
            <Text className="text-sm font-bold text-muted uppercase tracking-wider pl-1">{t("theme")}</Text>
            <View className="bg-surface rounded-2xl p-5 border border-border shadow-sm" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <View className="flex-row items-center justify-between">
                <Text className="font-bold text-base text-foreground">
                  {colorScheme === "dark" ? t("dark") : t("light")}
                </Text>
                <Text className="text-lg text-muted">
                  {colorScheme === "dark" ? "🌙" : "☀️"}
                </Text>
              </View>
              <Text className="text-sm font-medium text-muted mt-2">
                Uses system settings
              </Text>
            </View>
          </View>

          {/* About */}
          <View className="gap-3">
            <Text className="text-sm font-bold text-muted uppercase tracking-wider pl-1">{t("about")}</Text>
            <View className="bg-surface rounded-2xl p-5 border border-border shadow-sm" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <Text className="font-bold text-lg text-foreground mb-1">Recipes Collection</Text>
              <Text className="text-sm font-medium text-muted">Version 1.0.0</Text>
              <Text className="text-sm font-medium text-muted mt-3">
                A mobile app for household recipe management and meal planning
              </Text>
            </View>
          </View>

          {/* Logout */}
          {isAuthenticated && (
            <TouchableOpacity
              className="bg-error/90 rounded-2xl p-4 active:opacity-80 shadow-sm mt-4 mb-8"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
              onPress={handleLogout}
            >
              <Text className="text-white font-bold text-lg text-center">
                {t("logout")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
