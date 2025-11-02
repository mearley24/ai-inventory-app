import React from "react";
import { View, Text, FlatList, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useInventoryStore } from "../state/inventoryStore";
import { InventoryItem } from "../types/inventory";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function InventoryScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [showOnlyStarred, setShowOnlyStarred] = React.useState(false);
  const items = useInventoryStore((s) => s.items);
  const deleteItem = useInventoryStore((s) => s.deleteItem);
  const toggleStarred = useInventoryStore((s) => s.toggleStarred);
  const getLowStockItems = useInventoryStore((s) => s.getLowStockItems);
  const getStarredLowStockItems = useInventoryStore((s) => s.getStarredLowStockItems);

  // Memoize expensive computations
  const categories = React.useMemo(() =>
    ["All", ...Array.from(new Set(items.map((item) => item.category)))],
    [items.length] // Only recompute when item count changes
  );

  const lowStockItems = React.useMemo(() => getLowStockItems(), [items]);
  const starredLowStockItems = React.useMemo(() => getStarredLowStockItems(), [items]);

  // Show low stock alert for starred items on mount (only once)
  const hasShownAlert = React.useRef(false);
  React.useEffect(() => {
    if (starredLowStockItems.length > 0 && !hasShownAlert.current) {
      hasShownAlert.current = true;
      Alert.alert(
        "Low Stock Alert",
        `${starredLowStockItems.length} starred ${starredLowStockItems.length === 1 ? "item is" : "items are"} running low:\n\n${starredLowStockItems.map(item => `• ${item.name} (${item.quantity} left)`).join("\n")}`,
        [{ text: "OK" }]
      );
    }
  }, [starredLowStockItems.length]);

  // Memoize filtered items
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchesStarred = !showOnlyStarred || item.isStarred;
      return matchesSearch && matchesCategory && matchesStarred;
    });
  }, [items, searchQuery, selectedCategory, showOnlyStarred]);

  const isLowStock = React.useCallback((item: InventoryItem) => {
    return item.lowStockThreshold && item.quantity <= item.lowStockThreshold;
  }, []);

  // Render item for FlatList - memoized for performance
  const renderItem = React.useCallback(({ item, index }: { item: InventoryItem; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 50, 500)).springify()}
    >
      <Pressable
        onPress={() => navigation.navigate("EditItem", { item })}
        className="bg-white rounded-2xl p-4 mb-3 mx-6 flex-row items-center"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* Icon */}
        <View
          className={`w-12 h-12 rounded-full items-center justify-center ${
            isLowStock(item) ? "bg-amber-100" : "bg-indigo-100"
          }`}
        >
          <Ionicons
            name={isLowStock(item) ? "warning" : "cube"}
            size={24}
            color={isLowStock(item) ? "#F59E0B" : "#4F46E5"}
          />
        </View>

        {/* Content */}
        <View className="flex-1 ml-4">
          <View className="flex-row items-center">
            <Text className="text-lg font-semibold text-neutral-900 flex-1">
              {item.name}
            </Text>
            {item.isStarred && (
              <Ionicons name="star" size={18} color="#F59E0B" />
            )}
          </View>
          <View className="flex-row items-center mt-1">
            <View className="bg-neutral-100 rounded-full px-2 py-1 mr-2">
              <Text className="text-xs font-medium text-neutral-600">
                {item.category}
              </Text>
            </View>
            <Text className="text-sm text-neutral-500">
              Qty: {item.quantity}
            </Text>
            {item.price && (
              <>
                <Text className="text-sm text-neutral-400 mx-1">•</Text>
                <Text className="text-sm font-semibold text-indigo-600">
                  ${item.price.toFixed(2)}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Star Button */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            toggleStarred(item.id);
          }}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons
            name={item.isStarred ? "star" : "star-outline"}
            size={24}
            color="#F59E0B"
          />
        </Pressable>

        {/* Delete Button */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            deleteItem(item.id);
          }}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </Pressable>
      </Pressable>
    </Animated.View>
  ), [navigation, isLowStock, toggleStarred, deleteItem]);

  const ListEmptyComponent = React.useCallback(() => (
    <View className="items-center justify-center py-20 px-6">
      <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
      <Text className="text-lg font-medium text-neutral-400 mt-4">
        {searchQuery ? "No items found" : "No inventory items"}
      </Text>
      <Text className="text-sm text-neutral-400 mt-1">
        {searchQuery ? "Try a different search" : "Add items to get started"}
      </Text>
    </View>
  ), [searchQuery]);

  return (
    <View className="flex-1 bg-neutral-50">
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-3">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-neutral-900">Inventory</Text>
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => navigation.navigate("Import")}
                className="bg-indigo-100 rounded-full px-4 py-2 flex-row items-center"
              >
                <Ionicons name="cloud-upload" size={16} color="#4F46E5" />
                <Text className="text-indigo-600 font-semibold ml-2">CSV</Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate("InvoiceUpload")}
                className="bg-purple-100 rounded-full px-4 py-2 flex-row items-center"
              >
                <Ionicons name="receipt" size={16} color="#7C3AED" />
                <Text className="text-purple-600 font-semibold ml-2">Invoice</Text>
              </Pressable>
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-base text-neutral-500">
              {items.length} items • {lowStockItems.length} low stock
            </Text>
            <View className="flex-row items-center gap-2">
              {starredLowStockItems.length > 0 && (
                <View className="bg-amber-100 rounded-full px-3 py-1 flex-row items-center">
                  <Ionicons name="warning" size={14} color="#F59E0B" />
                  <Text className="text-amber-700 font-semibold text-xs ml-1">
                    {starredLowStockItems.length} starred low
                  </Text>
                </View>
              )}
              <Pressable
                onPress={() => navigation.navigate("DuplicateFinder")}
                className="bg-orange-100 rounded-full px-3 py-1 flex-row items-center"
              >
                <Ionicons name="copy" size={14} color="#EA580C" />
                <Text className="text-orange-700 font-semibold text-xs ml-1">
                  Find Duplicates
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-6 mb-4">
          <View className="flex-row items-center bg-white rounded-xl px-4 py-3 shadow-sm">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-base text-neutral-900"
              placeholder="Search inventory..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Buttons */}
        <View className="px-6 mb-4 flex-row gap-2">
          <Pressable
            onPress={() => setShowOnlyStarred(!showOnlyStarred)}
            className={`px-4 py-2 rounded-full flex-row items-center ${
              showOnlyStarred ? "bg-amber-500" : "bg-white"
            }`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Ionicons
              name={showOnlyStarred ? "star" : "star-outline"}
              size={16}
              color={showOnlyStarred ? "white" : "#F59E0B"}
            />
            <Text
              className={`font-medium ml-1 ${
                showOnlyStarred ? "text-white" : "text-amber-600"
              }`}
            >
              Favorites
            </Text>
          </Pressable>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-6 mb-4"
          contentContainerStyle={{ gap: 8 }}
        >
          {categories.map((category) => (
            <Pressable
              key={category}
              onPress={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === category
                  ? "bg-indigo-600"
                  : "bg-white"
              }`}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Text
                className={`font-medium ${
                  selectedCategory === category
                    ? "text-white"
                    : "text-neutral-700"
                }`}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Items List - FlatList for better performance */}
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={21}
        />

        {/* Floating Add Button */}
        <View className="absolute bottom-6 right-6">
          <Pressable
            onPress={() => navigation.navigate("AddItem")}
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{
              backgroundColor: "#4F46E5",
              shadowColor: "#4F46E5",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Ionicons name="add" size={32} color="white" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
