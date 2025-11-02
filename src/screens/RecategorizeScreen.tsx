import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useInventoryStore } from "../state/inventoryStore";
import { recategorizeItems, getCategoriesForWebsite } from "../services/recategorizer";
import { safeGoBack } from "../utils/navigation";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function RecategorizeScreen({ navigation }: Props) {
  const items = useInventoryStore((s) => s.items);
  const bulkUpdateCategories = useInventoryStore((s) => s.bulkUpdateCategories);

  const [websiteUrl, setWebsiteUrl] = useState("https://www.snapav.com");
  const [categories, setCategories] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState<
    { id: string; oldCategory: string; newCategory: string }[]
  >([]);

  const handleRecategorize = async () => {
    if (items.length === 0) {
      Alert.alert("No Items", "No inventory items to recategorize");
      return;
    }

    if (!websiteUrl.trim()) {
      Alert.alert("Website Required", "Please enter a website URL");
      return;
    }

    Alert.alert(
      "Recategorize All Items",
      `This will:\n1. Extract categories from ${websiteUrl}\n2. Analyze all ${items.length} items\n3. Auto-update categories to match website\n\nContinue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: async () => {
            setProcessing(true);
            setProgress("Extracting categories from website...");
            setResults([]);

            try {
              // Step 1: Extract categories from website
              const extractedCategories = await getCategoriesForWebsite(websiteUrl);
              setCategories(extractedCategories);
              setProgress(`Found ${extractedCategories.length} categories`);

              // Step 2: Recategorize items
              const changes = await recategorizeItems(
                items,
                extractedCategories,
                (msg: string, current: number, total: number) => {
                  setProgress(msg);
                }
              );

              setResults(changes);

              // Step 3: Auto-apply changes
              if (changes.length > 0) {
                const updates = changes.map((r) => ({
                  id: r.id,
                  category: r.newCategory,
                }));

                bulkUpdateCategories(updates);

                setProgress(`Complete! Updated ${changes.length} items`);
                Alert.alert(
                  "Success!",
                  `✅ Extracted ${extractedCategories.length} categories\n✅ Updated ${changes.length} items automatically\n\nAll items now match website categories!`,
                  [{ text: "OK", onPress: () => safeGoBack(navigation) }]
                );
              } else {
                setProgress("Complete! All items already in correct categories");
                Alert.alert(
                  "No Changes Needed",
                  "All items are already in the correct categories!",
                  [{ text: "OK", onPress: () => safeGoBack(navigation) }]
                );
              }
            } catch (error) {
              console.error("Recategorization error:", error);
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to recategorize items. Please try again."
              );
              setProgress("");
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={["#6366f1", "#8b5cf6", "#a855f7"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable
            onPress={() => safeGoBack(navigation)}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <Text className="text-white text-xl font-semibold">
            Recategorize Items
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
          {/* Info Card */}
          <View className="bg-white/20 rounded-2xl p-4 mb-4">
            <View className="flex-row items-start">
              <Ionicons
                name="information-circle"
                size={24}
                color="white"
                style={{ marginRight: 12 }}
              />
              <View className="flex-1">
                <Text className="text-white text-base font-semibold mb-2">
                  Automatic Recategorization
                </Text>
                <Text className="text-white/90 text-sm leading-5">
                  Enter any supplier website URL. AI will extract categories and
                  automatically update all your inventory to match.
                </Text>
              </View>
            </View>
          </View>

          {/* Website URL Input */}
          <View className="bg-white/20 rounded-2xl p-4 mb-4">
            <Text className="text-white text-sm font-semibold mb-2">
              Supplier Website
            </Text>
            <TextInput
              value={websiteUrl}
              onChangeText={setWebsiteUrl}
              placeholder="https://www.example.com"
              placeholderTextColor="rgba(255,255,255,0.5)"
              className="bg-white/30 rounded-xl px-4 py-3 text-white text-base"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text className="text-white/70 text-xs mt-2">
              Examples: snapav.com, adorama.com, bhphotovideo.com
            </Text>
          </View>

          {/* Stats */}
          <View className="bg-white/20 rounded-2xl p-4 mb-4">
            <Text className="text-white text-base font-semibold mb-2">
              Statistics
            </Text>
            <Text className="text-white/90 text-sm">
              Total Items: {items.length}
            </Text>
            {categories.length > 0 && (
              <Text className="text-white/90 text-sm">
                Categories Found: {categories.length}
              </Text>
            )}
            {results.length > 0 && (
              <Text className="text-white/90 text-sm">
                Items Updated: {results.length}
              </Text>
            )}
          </View>

          {/* Start Button */}
          {!processing && results.length === 0 && (
            <Pressable
              onPress={handleRecategorize}
              className="bg-white rounded-2xl p-4 items-center mb-4"
            >
              <Ionicons name="refresh" size={32} color="#8b5cf6" />
              <Text className="text-purple-600 text-lg font-semibold mt-2">
                Auto-Recategorize All
              </Text>
              <Text className="text-gray-600 text-sm mt-1">
                Extract categories and update all {items.length} items
              </Text>
            </Pressable>
          )}

          {/* Processing */}
          {processing && (
            <View className="bg-white/20 rounded-2xl p-6 items-center mb-4">
              <ActivityIndicator size="large" color="white" />
              <Text className="text-white text-base font-semibold mt-4">
                {progress}
              </Text>
            </View>
          )}

          {/* Success Message */}
          {!processing && results.length > 0 && (
            <View className="bg-green-100 rounded-2xl p-6 items-center mb-4">
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
              <Text className="text-green-800 text-lg font-semibold mt-4">
                Successfully Updated!
              </Text>
              <Text className="text-green-700 text-sm mt-2 text-center">
                {results.length} items have been automatically recategorized to match the website.
              </Text>
              <Pressable
                onPress={() => safeGoBack(navigation)}
                className="bg-green-600 rounded-xl px-6 py-3 mt-4"
              >
                <Text className="text-white font-semibold">
                  Done
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
