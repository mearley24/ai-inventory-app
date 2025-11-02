import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useInventoryStore } from "../state/inventoryStore";
import { recategorizeItems } from "../services/recategorizer";
import { safeGoBack } from "../utils/navigation";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function RecategorizeScreen({ navigation }: Props) {
  const items = useInventoryStore((s) => s.items);
  const bulkUpdateCategories = useInventoryStore((s) => s.bulkUpdateCategories);

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

    Alert.alert(
      "Recategorize All Items",
      `This will use AI to analyze all ${items.length} items and update their categories to match SnapAV categories.\n\nContinue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: async () => {
            setProcessing(true);
            setProgress("Starting...");
            setResults([]);

            try {
              const changes = await recategorizeItems(items, (msg, current, total) => {
                setProgress(msg);
              });

              setResults(changes);
              setProgress(`Complete! Found ${changes.length} items to recategorize`);

              if (changes.length === 0) {
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

  const handleApplyChanges = () => {
    if (results.length === 0) return;

    Alert.alert(
      "Apply Changes",
      `Update ${results.length} ${results.length === 1 ? "item" : "items"} to new categories?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Apply",
          onPress: () => {
            const updates = results.map((r) => ({
              id: r.id,
              category: r.newCategory,
            }));

            bulkUpdateCategories(updates);

            Alert.alert(
              "Success",
              `Updated ${results.length} ${results.length === 1 ? "item" : "items"}!`,
              [{ text: "OK", onPress: () => safeGoBack(navigation) }]
            );
          },
        },
      ]
    );
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Control4: "bg-blue-100",
      Audio: "bg-purple-100",
      "Bulk Wire & Connectors": "bg-orange-100",
      Cables: "bg-yellow-100",
      Conferencing: "bg-green-100",
      Control: "bg-indigo-100",
      Lighting: "bg-amber-100",
      "Media Distribution": "bg-pink-100",
      Mounts: "bg-gray-100",
      Networking: "bg-cyan-100",
      Power: "bg-red-100",
      "Projectors & Screens": "bg-violet-100",
      Racks: "bg-slate-100",
      "Smart Security & Access": "bg-emerald-100",
      Speakers: "bg-fuchsia-100",
      Surveillance: "bg-rose-100",
      Televisions: "bg-sky-100",
      "Tools & Hardware": "bg-stone-100",
      Other: "bg-neutral-100",
    };
    return colors[category] || "bg-neutral-100";
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
                  AI-Powered Recategorization
                </Text>
                <Text className="text-white/90 text-sm leading-5">
                  This tool uses AI to analyze all your inventory items and
                  assign them to the correct SnapAV product categories based on
                  their names and descriptions.
                </Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View className="bg-white/20 rounded-2xl p-4 mb-4">
            <Text className="text-white text-base font-semibold mb-2">
              Statistics
            </Text>
            <Text className="text-white/90 text-sm">
              Total Items: {items.length}
            </Text>
            {results.length > 0 && (
              <Text className="text-white/90 text-sm">
                Changes Found: {results.length}
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
                Start Recategorization
              </Text>
              <Text className="text-gray-600 text-sm mt-1">
                Analyze all {items.length} items
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

          {/* Results */}
          {!processing && results.length > 0 && (
            <>
              <Pressable
                onPress={handleApplyChanges}
                className="bg-white rounded-2xl p-4 items-center mb-4"
              >
                <Text className="text-purple-600 text-lg font-semibold">
                  Apply Changes ({results.length})
                </Text>
                <Text className="text-gray-600 text-sm mt-1">
                  Update categories for all items
                </Text>
              </Pressable>

              <Text className="text-white text-lg font-semibold mb-3">
                Suggested Changes ({results.length})
              </Text>

              {results.map((result, index) => {
                const item = items.find((i) => i.id === result.id);
                if (!item) return null;

                return (
                  <View
                    key={index}
                    className="bg-white/20 rounded-xl p-4 mb-3"
                  >
                    <Text className="text-white text-base font-semibold mb-2">
                      {item.name}
                    </Text>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 mr-2">
                        <Text className="text-white/70 text-xs mb-1">From:</Text>
                        <View
                          className={`${getCategoryColor(result.oldCategory)} rounded-lg px-3 py-2`}
                        >
                          <Text className="text-gray-800 text-sm font-medium">
                            {result.oldCategory}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="arrow-forward" size={20} color="white" />
                      <View className="flex-1 ml-2">
                        <Text className="text-white/70 text-xs mb-1">To:</Text>
                        <View
                          className={`${getCategoryColor(result.newCategory)} rounded-lg px-3 py-2`}
                        >
                          <Text className="text-gray-800 text-sm font-medium">
                            {result.newCategory}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
