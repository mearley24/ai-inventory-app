import React from "react";
import { View, Text, FlatList, ScrollView, Pressable, TextInput, Alert, Clipboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useInventoryStore } from "../state/inventoryStore";
import { useTimeTrackerStore } from "../state/timeTrackerStore";
import { useAuthStore } from "../state/authStore";
import { InventoryItem } from "../types/inventory";

export default function InventoryScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [showOnlyStarred, setShowOnlyStarred] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"all" | "inStock">("inStock");
  const [selectedSupplier, setSelectedSupplier] = React.useState<string>("All");
  const [selectedLocation, setSelectedLocation] = React.useState<string>("All");

  // Individual selectors to prevent unnecessary re-renders
  const items = useInventoryStore((s) => s.items);
  const deleteItem = useInventoryStore((s) => s.deleteItem);
  const toggleStarred = useInventoryStore((s) => s.toggleStarred);
  const clearAll = useInventoryStore((s) => s.clearAll);
  const projects = useTimeTrackerStore((s) => s.projects);
  const company = useAuthStore((s) => s.company);

  // Debug: Log when items change
  React.useEffect(() => {
    console.log("📦 Inventory screen - items count:", items.length);
  }, [items]);

  // Get unique suppliers from items
  const suppliers = React.useMemo(() => {
    const uniqueSuppliers = Array.from(new Set(items.map((item) => item.supplier).filter(Boolean))) as string[];
    return ["All", ...uniqueSuppliers.sort()];
  }, [items]);

  // Get unique locations from items
  const locations = React.useMemo(() => {
    const uniqueLocations = Array.from(new Set(items.map((item) => item.location).filter(Boolean))) as string[];
    return ["All", ...uniqueLocations.sort()];
  }, [items]);

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Inventory",
      `Are you sure you want to delete ALL ${items.length} items? This will delete from cloud and local storage. This cannot be undone!`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear from store (this handles Firestore)
              await clearAll();

              // Also clear local AsyncStorage to be thorough
              const AsyncStorage = require("@react-native-async-storage/async-storage").default;
              await AsyncStorage.removeItem("inventory-storage");

              Alert.alert("Success", "All inventory items have been deleted from cloud and device");
            } catch (error) {
              console.error("Error clearing inventory:", error);
              Alert.alert("Error", "Failed to clear inventory. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleShowCompanyId = () => {
    if (company) {
      Alert.alert(
        "Your Company ID",
        `Share this ID with team members so they can join your company:\n\n${company.id}`,
        [
          {
            text: "Copy ID",
            onPress: () => {
              Clipboard.setString(company.id);
              Alert.alert("Copied!", "Company ID copied to clipboard");
            },
          },
          { text: "Close" },
        ]
      );
    }
  };

  // Memoize expensive computations
  const categories = React.useMemo(() =>
    ["All", ...Array.from(new Set(items.map((item) => item.category)))],
    [items]
  );

  // Compute low stock items directly instead of calling store methods
  const lowStockItems = React.useMemo(() =>
    items.filter((item) => item.lowStockThreshold && item.quantity <= item.lowStockThreshold),
    [items]
  );

  const starredLowStockItems = React.useMemo(() =>
    items.filter((item) => item.isStarred && item.lowStockThreshold && item.quantity <= item.lowStockThreshold),
    [items]
  );

  // Count items in stock
  const inStockCount = React.useMemo(() => items.filter((item) => item.quantity > 0).length, [items]);

  // Show low stock alert for starred items on mount (only once)
  const hasShownAlert = React.useRef(false);
  React.useEffect(() => {
    if (starredLowStockItems.length > 0 && !hasShownAlert.current) {
      hasShownAlert.current = true;
      Alert.alert(
        "Low Stock Alert",
        `${starredLowStockItems.length} starred ${starredLowStockItems.length === 1 ? "item is" : "items are"} running low:\n\n${starredLowStockItems.map((item: InventoryItem) => `• ${item.name} (${item.quantity} left)`).join("\n")}`,
        [{ text: "OK" }]
      );
    }
  }, [starredLowStockItems.length]);

  // Memoize filtered items
  const filteredItems = React.useMemo(() => {
    let filtered = items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchesStarred = !showOnlyStarred || item.isStarred;
      const matchesTab = activeTab === "all" || (activeTab === "inStock" && item.quantity > 0);
      const matchesSupplier = selectedSupplier === "All" || item.supplier === selectedSupplier;
      const matchesLocation = selectedLocation === "All" || item.location === selectedLocation;
      return matchesSearch && matchesCategory && matchesStarred && matchesTab && matchesSupplier && matchesLocation;
    });

    // Sort: items with quantity > 0 at top, then by quantity descending
    filtered.sort((a, b) => {
      // First, prioritize items with quantity > 0
      if (a.quantity > 0 && b.quantity === 0) return -1;
      if (a.quantity === 0 && b.quantity > 0) return 1;
      // Then sort by quantity descending
      return b.quantity - a.quantity;
    });

    return filtered;
  }, [items, searchQuery, selectedCategory, showOnlyStarred, activeTab, selectedSupplier, selectedLocation]);


  // Render item for FlatList - simple, compact list design
  const renderItem = React.useCallback(({ item }: { item: InventoryItem }) => {
    const lowStock = item.lowStockThreshold && item.quantity <= item.lowStockThreshold;

    return (
      <Pressable
        onPress={() => navigation.navigate("EditItem", { item })}
        className="bg-white border-b border-neutral-200 px-4 py-2 flex-row items-center"
      >
        {/* Content */}
        <View className="flex-1">
          <Text className="text-base font-semibold text-neutral-900" numberOfLines={1}>
            {item.isStarred ? "⭐ " : ""}{lowStock ? "⚠️ " : ""}{item.name}
          </Text>
          <View className="flex-row items-center mt-0.5">
            {item.supplier && (
              <Text className="text-xs font-bold text-purple-600 mr-1">
                [{item.supplier}]
              </Text>
            )}
            <Text className="text-xs text-neutral-600" numberOfLines={1}>
              {item.category} • Qty: {item.quantity}{item.price && ` • $${item.price.toFixed(2)}`}{item.location && ` • 📍${item.location}`}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            toggleStarred(item.id);
          }}
          className="w-8 h-8 items-center justify-center ml-2"
        >
          <Ionicons
            name={item.isStarred ? "star" : "star-outline"}
            size={20}
            color="#F59E0B"
          />
        </Pressable>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            deleteItem(item.id);
          }}
          className="w-8 h-8 items-center justify-center"
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </Pressable>
      </Pressable>
    );
  }, [navigation, toggleStarred, deleteItem]);

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

  // Add getItemLayout for better FlatList performance
  const getItemLayout = React.useCallback(
    (_: any, index: number) => ({
      length: 48, // even more compact height (py-2 = ~48px)
      offset: 48 * index,
      index,
    }),
    []
  );

  return (
    <View className="flex-1 bg-neutral-50">
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-3xl font-bold text-neutral-900">Inventory</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={handleClearAll}
                className="bg-red-100 rounded-full w-10 h-10 items-center justify-center"
              >
                <Ionicons name="trash" size={20} color="#EF4444" />
              </Pressable>
              <Pressable
                onPress={handleShowCompanyId}
                className="bg-indigo-100 rounded-full w-10 h-10 items-center justify-center"
              >
                <Ionicons name="people" size={20} color="#4F46E5" />
              </Pressable>
            </View>
          </View>

          {/* Stats Row */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base text-neutral-500">
              {items.length} items • {lowStockItems.length} low stock
            </Text>
            {starredLowStockItems.length > 0 && (
              <View className="bg-amber-100 rounded-full px-3 py-1 flex-row items-center">
                <Ionicons name="warning" size={14} color="#F59E0B" />
                <Text className="text-amber-700 font-semibold text-xs ml-1">
                  {starredLowStockItems.length} starred low
                </Text>
              </View>
            )}
          </View>

          {/* Upload Options - All in one row with smaller text */}
          <View className="flex-row gap-2 mb-3">
            <Pressable
              onPress={() => navigation.navigate("DToolsImport")}
              className="flex-1 bg-white rounded-xl px-2 py-3 items-center justify-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Ionicons name="construct" size={24} color="#10B981" />
              <Text className="text-emerald-600 font-semibold text-xs mt-1">D-Tools</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate("Import")}
              className="flex-1 bg-white rounded-xl px-2 py-3 items-center justify-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Ionicons name="cloud-upload" size={24} color="#4F46E5" />
              <Text className="text-indigo-600 font-semibold text-xs mt-1">CSV Import</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate("InvoiceUpload")}
              className="flex-1 bg-white rounded-xl px-2 py-3 items-center justify-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Ionicons name="receipt" size={24} color="#7C3AED" />
              <Text className="text-purple-600 font-semibold text-xs mt-1">Invoice</Text>
            </Pressable>
          </View>

          {/* Folder Actions Row */}
          <View className="flex-row gap-2 mb-3">
            <Pressable
              onPress={() => navigation.navigate("InvoiceFolder")}
              className="flex-1 bg-white rounded-xl px-2 py-3 items-center justify-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Ionicons name="folder" size={24} color="#DB2777" />
              <Text className="text-pink-600 font-semibold text-xs mt-1">Invoice Folder</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate("DToolsFolder")}
              className="flex-1 bg-white rounded-xl px-2 py-3 items-center justify-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Ionicons name="folder-open" size={24} color="#10B981" />
              <Text className="text-emerald-600 font-semibold text-xs mt-1">D-Tools Folder</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate("Recategorize")}
              className="flex-1 bg-white rounded-xl px-2 py-3 items-center justify-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Ionicons name="sparkles" size={24} color="#14B8A6" />
              <Text className="text-teal-700 font-semibold text-xs mt-1">AI Categorize</Text>
            </Pressable>
          </View>
        </View>

        {/* Tabs */}
        <View className="px-6 mb-4">
          <View className="flex-row bg-white rounded-xl p-1 shadow-sm">
            <Pressable
              onPress={() => setActiveTab("inStock")}
              className={`flex-1 py-2 rounded-lg ${activeTab === "inStock" ? "bg-indigo-600" : "bg-transparent"}`}
            >
              <Text className={`text-center font-semibold ${activeTab === "inStock" ? "text-white" : "text-neutral-600"}`}>
                In Stock ({inStockCount})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("all")}
              className={`flex-1 py-2 rounded-lg ${activeTab === "all" ? "bg-indigo-600" : "bg-transparent"}`}
            >
              <Text className={`text-center font-semibold ${activeTab === "all" ? "text-white" : "text-neutral-600"}`}>
                All Items ({items.length})
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Supplier Tabs */}
        {suppliers.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-6 mb-4"
            contentContainerStyle={{ gap: 8 }}
          >
            {suppliers.map((supplier) => (
              <Pressable
                key={supplier}
                onPress={() => setSelectedSupplier(supplier)}
                className={`px-4 py-2 rounded-full ${
                  selectedSupplier === supplier
                    ? "bg-purple-600"
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
                    selectedSupplier === supplier
                      ? "text-white"
                      : "text-neutral-700"
                  }`}
                >
                  {supplier}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Location Tabs */}
        {locations.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-6 mb-4"
            contentContainerStyle={{ gap: 8 }}
          >
            {locations.map((location) => (
              <Pressable
                key={location}
                onPress={() => setSelectedLocation(location)}
                className={`px-4 py-2 rounded-full flex-row items-center ${
                  selectedLocation === location
                    ? "bg-emerald-600"
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
                <Ionicons
                  name="location"
                  size={14}
                  color={selectedLocation === location ? "white" : "#10B981"}
                  style={{ marginRight: 4 }}
                />
                <Text
                  className={`font-medium ${
                    selectedLocation === location
                      ? "text-white"
                      : "text-neutral-700"
                  }`}
                >
                  {location}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

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
          getItemLayout={getItemLayout}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={100}
          initialNumToRender={15}
          windowSize={5}
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
