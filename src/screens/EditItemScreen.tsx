import React from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useInventoryStore } from "../state/inventoryStore";
import Animated, { FadeIn } from "react-native-reanimated";

const CATEGORIES = [
  "Control4",
  "Audio",
  "Bulk Wire & Connectors",
  "Cables",
  "Conferencing",
  "Control",
  "Lighting",
  "Media Distribution",
  "Mounts",
  "Networking",
  "Power",
  "Projectors & Screens",
  "Racks",
  "Smart Security & Access",
  "Speakers",
  "Surveillance",
  "Televisions",
  "Tools & Hardware",
  "Other"
];

export default function EditItemScreen({ navigation, route }: any) {
  const { item } = route.params;
  const updateItem = useInventoryStore((s) => s.updateItem);

  const [name, setName] = React.useState(item.name);
  const [quantity, setQuantity] = React.useState(item.quantity.toString());
  const [price, setPrice] = React.useState(item.price?.toString() || "");
  const [category, setCategory] = React.useState(item.category);
  const [description, setDescription] = React.useState(item.description || "");
  const [lowStockThreshold, setLowStockThreshold] = React.useState(
    item.lowStockThreshold?.toString() || ""
  );
  const [isStarred, setIsStarred] = React.useState(item.isStarred || false);

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }

    updateItem(item.id, {
      name: name.trim(),
      quantity: parseInt(quantity) || 0,
      price: price ? parseFloat(price) : undefined,
      category,
      description: description.trim() || undefined,
      lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : undefined,
      isStarred,
    });

    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#1F2937" />
          </Pressable>
          <Text className="text-xl font-bold text-neutral-900">Edit Item</Text>
          <Pressable onPress={handleSave}>
            <Text className="text-lg font-semibold text-indigo-600">Save</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn} className="pb-6">
            {/* Barcode Display */}
            {item.barcode && (
              <View className="bg-indigo-50 rounded-2xl p-4 mb-6">
                <View className="flex-row items-center">
                  <Ionicons name="barcode" size={24} color="#4F46E5" />
                  <Text className="text-indigo-900 font-medium ml-3">{item.barcode}</Text>
                </View>
              </View>
            )}

            {/* Name Input */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">
                Item Name *
              </Text>
              <TextInput
                className="bg-white rounded-xl px-4 py-3 text-base text-neutral-900"
                placeholder="Enter item name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
            </View>

            {/* Quantity Input */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">
                Quantity
              </Text>
              <View className="flex-row items-center gap-3">
                <Pressable
                  onPress={() => {
                    const newQty = Math.max(0, (parseInt(quantity) || 0) - 1);
                    setQuantity(newQty.toString());
                  }}
                  className="w-12 h-12 rounded-xl bg-white items-center justify-center"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <Ionicons name="remove" size={24} color="#4F46E5" />
                </Pressable>

                <TextInput
                  className="flex-1 bg-white rounded-xl px-4 py-3 text-base text-neutral-900 text-center font-semibold"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="number-pad"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                />

                <Pressable
                  onPress={() => {
                    const newQty = (parseInt(quantity) || 0) + 1;
                    setQuantity(newQty.toString());
                  }}
                  className="w-12 h-12 rounded-xl bg-indigo-600 items-center justify-center"
                  style={{
                    shadowColor: "#4F46E5",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Ionicons name="add" size={24} color="white" />
                </Pressable>
              </View>
            </View>

            {/* Price Input */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">
                Price
              </Text>
              <TextInput
                className="bg-white rounded-xl px-4 py-3 text-base text-neutral-900"
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
            </View>

            {/* Category Selection */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">
                Category
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-full ${
                      category === cat ? "bg-indigo-600" : "bg-white"
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
                        category === cat ? "text-white" : "text-neutral-700"
                      }`}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Description Input */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">
                Description
              </Text>
              <TextInput
                className="bg-white rounded-xl px-4 py-3 text-base text-neutral-900"
                placeholder="Add notes about this item"
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                  minHeight: 80,
                }}
              />
            </View>

            {/* Low Stock Threshold */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">
                Low Stock Alert
              </Text>
              <TextInput
                className="bg-white rounded-xl px-4 py-3 text-base text-neutral-900"
                placeholder="Alert when quantity falls below..."
                placeholderTextColor="#9CA3AF"
                value={lowStockThreshold}
                onChangeText={setLowStockThreshold}
                keyboardType="number-pad"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
            </View>

            {/* Favorite/Starred Toggle */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">
                Mark as Favorite
              </Text>
              <Text className="text-xs text-neutral-500 mb-3">
                Get low stock alerts for favorite items
              </Text>
              <Pressable
                onPress={() => setIsStarred(!isStarred)}
                className={`flex-row items-center justify-between px-4 py-4 rounded-xl ${
                  isStarred ? "bg-amber-50" : "bg-white"
                }`}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name={isStarred ? "star" : "star-outline"}
                    size={24}
                    color="#F59E0B"
                  />
                  <Text
                    className={`ml-3 text-base font-medium ${
                      isStarred ? "text-amber-700" : "text-neutral-700"
                    }`}
                  >
                    {isStarred ? "Favorite Item" : "Add to Favorites"}
                  </Text>
                </View>
                <View
                  className={`w-12 h-7 rounded-full ${
                    isStarred ? "bg-amber-500" : "bg-neutral-300"
                  } justify-center`}
                >
                  <View
                    className={`w-5 h-5 rounded-full bg-white ${
                      isStarred ? "ml-6" : "ml-1"
                    }`}
                  />
                </View>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
