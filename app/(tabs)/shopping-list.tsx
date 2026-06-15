import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, TextInput, Alert } from "react-native";
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

export default function ShoppingListScreen() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const [householdId, setHouseholdId] = useState<number | null>(null);
  const weekStartDate = getWeekStartDate();
  
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Get user's households
  const { data: households } = trpc.household.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Get shopping list
  const { data: shoppingList, isLoading, refetch } = trpc.toBuyList.list.useQuery(
    { householdId: householdId || 0, weekStartDate },
    { enabled: isAuthenticated && householdId !== null }
  );

  // Add item mutation
  const addItem = trpc.toBuyList.add.useMutation({
    onSuccess: () => {
      Alert.alert(t("success"), t("itemAdded"));
      setNewItemName("");
      setNewItemQuantity("");
      setNewItemUnit("");
      setIsAdding(false);
      refetch();
    },
    onError: (error) => {
      Alert.alert(t("error"), error.message || t("failedToAddItem"));
      setIsAdding(false);
    },
  });

  // Check item mutation
  const checkItem = trpc.toBuyList.check.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Delete item mutation
  const deleteItem = trpc.toBuyList.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  useEffect(() => {
    if (households && households.length > 0) {
      setHouseholdId(households[0].id);
    }
  }, [households]);

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      Alert.alert(t("error"), t("pleaseEnterItemName"));
      return;
    }

    if (!households || households.length === 0) {
      Alert.alert(t("error"), t("noHousehold"));
      return;
    }

    setIsAdding(true);
    addItem.mutate({
      householdId: households[0].id,
      itemName: newItemName.trim(),
      quantity: newItemQuantity.trim() || undefined,
      unit: newItemUnit.trim() || undefined,
      weekStartDate,
    });
  };

  const handleCheckItem = (id: number, isChecked: boolean) => {
    checkItem.mutate({ id, isChecked: !isChecked });
  };

  const handleDeleteItem = (id: number) => {
    Alert.alert(
      t("confirm"),
      t("areYouSure"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: () => deleteItem.mutate({ id }),
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <Text className="text-2xl font-bold text-foreground mb-4">{t("shoppingList")}</Text>
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
            <Text className="text-3xl font-extrabold text-foreground tracking-tight">{t("shoppingList")}</Text>
            <TouchableOpacity
              className="bg-primary rounded-full w-12 h-12 items-center justify-center active:opacity-80"
              style={{ shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
              onPress={() => setIsAdding(!isAdding)}
            >
              <IconSymbol size={24} name={isAdding ? "xmark" : "plus"} color="white" />
            </TouchableOpacity>
          </View>

          {/* Add Item Form */}
          {isAdding && (
            <View className="bg-surface rounded-2xl p-4 border border-border gap-3" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <Text className="text-sm font-bold text-muted uppercase tracking-wider">{t("addItem")}</Text>
              <TextInput
                placeholder={t("itemName")}
                placeholderTextColor={colors.muted}
                value={newItemName}
                onChangeText={setNewItemName}
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-base"
              />
              <View className="flex-row gap-2">
                <TextInput
                  placeholder={t("quantity")}
                  placeholderTextColor={colors.muted}
                  value={newItemQuantity}
                  onChangeText={setNewItemQuantity}
                  keyboardType="number-pad"
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-foreground text-base"
                />
                <TextInput
                  placeholder={t("unit")}
                  placeholderTextColor={colors.muted}
                  value={newItemUnit}
                  onChangeText={setNewItemUnit}
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-foreground text-base"
                />
              </View>
              <TouchableOpacity
                className={`rounded-xl p-3 ${isAdding ? "bg-primary/50" : "bg-primary"}`}
                onPress={handleAddItem}
                disabled={isAdding || !newItemName.trim()}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-semibold text-center">{t("addItem")}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Shopping List */}
          <View className="gap-3">
            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} className="mt-8" />
            ) : shoppingList && shoppingList.length > 0 ? (
              shoppingList.map((item) => (
                <View
                  key={item.id}
                  className="bg-surface rounded-2xl p-4 border border-border flex-row items-center justify-between"
                  style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                >
                  <TouchableOpacity
                    className="flex-row items-center gap-3 flex-1"
                    onPress={() => handleCheckItem(item.id, item.isChecked)}
                  >
                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${item.isChecked ? "bg-primary border-primary" : "border-muted"}`}>
                      {item.isChecked && <IconSymbol size={14} name="checkmark" color="white" />}
                    </View>
                    <View className="flex-1">
                      <Text className={`font-semibold text-foreground ${item.isChecked ? "line-through opacity-50" : ""}`}>
                        {item.itemName}
                      </Text>
                      {(item.quantity || item.unit) && (
                        <Text className="text-xs text-muted">
                          {item.quantity} {item.unit}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteItem(item.id)}
                    className="p-2"
                  >
                    <IconSymbol size={18} name="trash" color={colors.warning} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View className="bg-surface rounded-2xl p-10 border border-border items-center justify-center" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                <IconSymbol size={48} name="cart" color={colors.muted} />
                <Text className="text-center text-muted font-medium mb-6 mt-4 text-base">{t("noItems")}</Text>
                <TouchableOpacity
                  className="bg-primary px-8 py-4 rounded-full active:opacity-80 shadow-md"
                  style={{ shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
                  onPress={() => setIsAdding(true)}
                >
                  <Text className="text-white font-bold text-center text-base">{t("addItem")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}