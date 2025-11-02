import React from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useInventoryStore } from "../state/inventoryStore";
import { InventoryItem } from "../types/inventory";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function InventoryScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const items = useInventoryStore((s) => s.items);
  const deleteItem = useInventoryStore((s) => s.deleteItem);
  const getLowStockItems = useInventoryStore((s) => s.getLowStockItems);

  const categories = ["All", ...Array.from(new Set(items.map((item) => item.category)))];
  const lowStockItems = getLowStockItems();

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isLowStock = (item: InventoryItem) => {
    return item.lowStockThreshold && item.quantity <= item.lowStockThreshold;
  };

  return (
    <View className="flex-1 bg-neutral-50">
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-3">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-neutral-900">Inventory</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate("Import")}
              className="bg-indigo-100 rounded-full px-4 py-2 flex-row items-center"
            >
              <Ionicons name="cloud-upload" size={16} color="#4F46E5" />
              <Text className="text-indigo-600 font-semibold ml-2">Import</Text>
            </Pressable>
          </View>
          <Text className="text-base text-neutral-500">
            {items.length} items • {lowStockItems.length} low stock
          </Text>
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

        {/* Items List */}
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {filteredItems.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
              <Text className="text-lg font-medium text-neutral-400 mt-4">
                {searchQuery ? "No items found" : "No inventory items"}
              </Text>
              <Text className="text-sm text-neutral-400 mt-1">
                {searchQuery ? "Try a different search" : "Add items to get started"}
              </Text>
            </View>
          ) : (
            filteredItems.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(index * 50).springify()}
              >
                <Pressable
                  onPress={() => navigation.navigate("EditItem", { item })}
                  className="bg-white rounded-2xl p-4 mb-3 flex-row items-center"
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
                    <Text className="text-lg font-semibold text-neutral-900">
                      {item.name}
                    </Text>
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

                  {/* Delete Button */}
                  <Pressable
                    onPress={() => deleteItem(item.id)}
                    className="w-10 h-10 items-center justify-center"
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </Pressable>
                </Pressable>
              </Animated.View>
            ))
          )}
          <View className="h-20" />
        </ScrollView>

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
