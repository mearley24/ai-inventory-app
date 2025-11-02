import React from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useInventoryStore } from "../state/inventoryStore";
import { SNAPAV_CATEGORIES } from "../utils/categories";
import Animated, { FadeIn } from "react-native-reanimated";

const CATEGORIES = SNAPAV_CATEGORIES;

export default function AddItemScreen({ navigation, route }: any) {
  const { barcode, suggestedName, suggestedCategory } = route.params || {};
  const addItem = useInventoryStore((s) => s.addItem);

  const [name, setName] = React.useState(suggestedName || "");
  const [quantity, setQuantity] = React.useState("1");
  const [price, setPrice] = React.useState("");
  const [category, setCategory] = React.useState(suggestedCategory || CATEGORIES[0]);
  const [description, setDescription] = React.useState("");
  const [lowStockThreshold, setLowStockThreshold] = React.useState("");

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }

    addItem({
      name: name.trim(),
      barcode: barcode || undefined,
      quantity: parseInt(quantity) || 0,
      price: price ? parseFloat(price) : undefined,
      category,
      description: description.trim() || undefined,
      lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : undefined,
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
            <Ionicons name="close" size={28} color="#1F2937" />
          </Pressable>
          <Text className="text-xl font-bold text-neutral-900">Add Item</Text>
          <Pressable onPress={handleSave}>
            <Text className="text-lg font-semibold text-indigo-600">Save</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn} className="pb-6">
            {/* Barcode Display */}
            {barcode && (
              <View className="bg-indigo-50 rounded-2xl p-4 mb-6">
                <View className="flex-row items-center">
                  <Ionicons name="barcode" size={24} color="#4F46E5" />
                  <Text className="text-indigo-900 font-medium ml-3">{barcode}</Text>
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
              <TextInput
                className="bg-white rounded-xl px-4 py-3 text-base text-neutral-900"
                placeholder="0"
                placeholderTextColor="#9CA3AF"
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
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
