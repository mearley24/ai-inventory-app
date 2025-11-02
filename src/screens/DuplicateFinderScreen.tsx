import React from "react";
import { View, Text, Pressable, FlatList, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useInventoryStore } from "../state/inventoryStore";
import { InventoryItem } from "../types/inventory";
import { safeGoBack } from "../utils/navigation";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function DuplicateFinderScreen({ navigation }: any) {
  const findDuplicates = useInventoryStore((s) => s.findDuplicates);
  const mergeDuplicates = useInventoryStore((s) => s.mergeDuplicates);
  const autoMergeAllDuplicates = useInventoryStore((s) => s.autoMergeAllDuplicates);

  const [duplicateGroups, setDuplicateGroups] = React.useState<InventoryItem[][]>([]);
  const [selectedGroups, setSelectedGroups] = React.useState<{ [key: number]: string }>({});

  React.useEffect(() => {
    const groups = findDuplicates();
    setDuplicateGroups(groups);
  }, []);

  const handleAutoMergeAll = () => {
    const dupCount = duplicateGroups.length;

    Alert.alert(
      "Auto Merge All Duplicates",
      `This will:\n• Merge ${dupCount} duplicate ${dupCount === 1 ? "group" : "groups"}\n• Keep one item per group\n• Set ALL inventory quantities to 0\n\nContinue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Merge All",
          style: "destructive",
          onPress: () => {
            const result = autoMergeAllDuplicates();
            Alert.alert(
              "Success!",
              `✅ Merged ${result.merged} groups\n✅ Removed ${result.removed} duplicate items\n✅ All quantities set to 0`,
              [{ text: "OK", onPress: () => safeGoBack(navigation) }]
            );
          },
        },
      ]
    );
  };

  const handleMerge = (groupIndex: number, group: InventoryItem[]) => {
    const keepItemId = selectedGroups[groupIndex];

    if (!keepItemId) {
      Alert.alert("Select Item", "Please select which item to keep");
      return;
    }

    const keepItem = group.find((item) => item.id === keepItemId);
    if (!keepItem) return;

    const totalQty = group.reduce((sum, item) => sum + item.quantity, 0);

    Alert.alert(
      "Merge Duplicates",
      `This will merge ${group.length} duplicate items into one.\n\nTotal quantity: ${totalQty}\n\nContinue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Merge",
          style: "destructive",
          onPress: () => {
            mergeDuplicates(group, keepItem);
            // Refresh the list
            const newGroups = findDuplicates();
            setDuplicateGroups(newGroups);

            if (newGroups.length === 0) {
              Alert.alert("Success", "All duplicates merged!", [
                { text: "OK", onPress: () => safeGoBack(navigation) },
              ]);
            }
          },
        },
      ]
    );
  };

  const renderDuplicateGroup = ({ item: group, index: groupIndex }: { item: InventoryItem[]; index: number }) => (
    <Animated.View entering={FadeInDown.delay(groupIndex * 100).springify()}>
      <View className="bg-white rounded-2xl p-4 mx-6 mb-4" style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}>
        {/* Group Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-lg font-bold text-neutral-900">{group[0].name}</Text>
            <Text className="text-sm text-neutral-500 mt-1">
              {group.length} duplicates found • Total qty: {group.reduce((sum, item) => sum + item.quantity, 0)}
            </Text>
          </View>
          <Ionicons name="warning" size={24} color="#F59E0B" />
        </View>

        {/* Duplicate Items */}
        {group.map((item) => {
          const isSelected = selectedGroups[groupIndex] === item.id;

          return (
            <Pressable
              key={item.id}
              onPress={() => {
                setSelectedGroups((prev) => ({
                  ...prev,
                  [groupIndex]: item.id,
                }));
              }}
              className={`flex-row items-center p-3 rounded-xl mb-2 ${
                isSelected ? "bg-indigo-50 border-2 border-indigo-500" : "bg-neutral-50"
              }`}
            >
              <View className="flex-1">
                <View className="flex-row items-center">
                  <View className="bg-neutral-200 rounded-full px-2 py-1 mr-2">
                    <Text className="text-xs font-medium text-neutral-700">{item.category}</Text>
                  </View>
                  <Text className="text-sm text-neutral-600">Qty: {item.quantity}</Text>
                  {item.price && (
                    <>
                      <Text className="text-sm text-neutral-400 mx-1">•</Text>
                      <Text className="text-sm font-semibold text-indigo-600">
                        ${item.price.toFixed(2)}
                      </Text>
                    </>
                  )}
                </View>
                {item.description && (
                  <Text className="text-xs text-neutral-500 mt-1" numberOfLines={1}>
                    {item.description}
                  </Text>
                )}
                {item.barcode && (
                  <Text className="text-xs text-neutral-400 mt-1">SKU: {item.barcode}</Text>
                )}
              </View>
              <Ionicons
                name={isSelected ? "radio-button-on" : "radio-button-off"}
                size={24}
                color={isSelected ? "#4F46E5" : "#9CA3AF"}
              />
            </Pressable>
          );
        })}

        {/* Merge Button */}
        <Pressable
          onPress={() => handleMerge(groupIndex, group)}
          disabled={!selectedGroups[groupIndex]}
          className={`mt-3 rounded-xl overflow-hidden ${
            !selectedGroups[groupIndex] ? "opacity-50" : ""
          }`}
        >
          <LinearGradient
            colors={["#4F46E5", "#7C3AED"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingVertical: 12, alignItems: "center" }}
          >
            <Text className="text-white font-semibold">
              {selectedGroups[groupIndex] ? "Merge Duplicates" : "Select Item to Keep"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Animated.View>
  );

  return (
    <LinearGradient colors={["#6366f1", "#8b5cf6", "#a855f7"]} style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable onPress={() => safeGoBack(navigation)} className="w-10 h-10 items-center justify-center">
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <Text className="text-white text-xl font-semibold">Find Duplicates</Text>
          <View className="w-10" />
        </View>

        {duplicateGroups.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="checkmark-circle" size={80} color="white" />
            <Text className="text-white text-2xl font-bold mt-4">No Duplicates!</Text>
            <Text className="text-white/80 text-base text-center mt-2">
              Your inventory is clean. All items are unique.
            </Text>
            <Pressable
              onPress={() => safeGoBack(navigation)}
              className="bg-white rounded-xl px-6 py-3 mt-6"
            >
              <Text className="text-indigo-600 font-semibold">Go Back</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="px-6 pb-4">
              <Text className="text-white/90 text-base">
                Found {duplicateGroups.length} duplicate {duplicateGroups.length === 1 ? "group" : "groups"}
              </Text>
              <Text className="text-white/70 text-sm mt-1">
                Tap &ldquo;Auto Merge&rdquo; to merge all duplicates and reset quantities to 0
              </Text>

              {/* Auto Merge All Button */}
              <Pressable
                onPress={handleAutoMergeAll}
                className="bg-white rounded-xl mt-4 overflow-hidden"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <View className="flex-row items-center justify-center px-6 py-4">
                  <Ionicons name="flash" size={20} color="#EA580C" />
                  <Text className="text-orange-600 font-bold text-base ml-2">
                    Auto Merge All & Reset to Zero
                  </Text>
                </View>
              </Pressable>
            </View>

            <FlatList
              data={duplicateGroups}
              renderItem={renderDuplicateGroup}
              keyExtractor={(_, index) => index.toString()}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}
