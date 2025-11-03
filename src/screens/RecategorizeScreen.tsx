import React, { useState, useEffect } from "react";
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
import {
  createJob,
  executeJob,
  getActiveJob,
  clearOldJobs,
  cancelJob,
  RecategorizationJob
} from "../services/recategorizationTask";
import { safeGoBack } from "../utils/navigation";

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route?: {
    params?: {
      selectedItemIds?: string[];
    };
  };
};

export default function RecategorizeScreen({ navigation, route }: Props) {
  const items = useInventoryStore((s) => s.items);
  const bulkUpdateCategories = useInventoryStore((s) => s.bulkUpdateCategories);

  const [websiteUrl, setWebsiteUrl] = useState("https://www.snapav.com");
  const [activeJob, setActiveJob] = useState<RecategorizationJob | null>(null);
  const [canNavigateAway, setCanNavigateAway] = useState(false);

  // Get selected items if passed from inventory screen
  const selectedItemIds = route?.params?.selectedItemIds;
  const itemsToProcess = selectedItemIds
    ? items.filter(item => selectedItemIds.includes(item.id))
    : items;

  // Check for active job on mount
  useEffect(() => {
    const checkActiveJob = async () => {
      const job = await getActiveJob();
      if (job) {
        console.log(`Found job with status: ${job.status}, changes: ${job.changes?.length || 0}`);
        setActiveJob(job);

        // If job is completed but wasn't applied, apply it now
        if (job.status === "completed" && job.changes && job.changes.length > 0) {
          console.log("🎉 Found completed job on mount! Applying changes...");
          const updates = job.changes.map((r) => ({
            id: r.id,
            category: r.newCategory,
            subcategory: r.newSubcategory,
          }));
          await bulkUpdateCategories(updates);
          console.log("✅ Changes applied successfully on mount!");
          Alert.alert(
            "Changes Applied!",
            `Successfully applied ${job.changes.length} category changes from previous session.`,
            [{ text: "OK" }]
          );
        }

        // If job is running, continue monitoring it
        if (job.status === "running") {
          setCanNavigateAway(true);
          monitorJob(job.id);
        }
      }
      // Clean up old jobs
      await clearOldJobs();
    };
    checkActiveJob();
  }, []);

  // Monitor job progress
  const monitorJob = async (jobId: string) => {
    const checkInterval = setInterval(async () => {
      const job = await getActiveJob();

      if (!job || job.id !== jobId) {
        clearInterval(checkInterval);
        return;
      }

      setActiveJob(job);

      if (job.status === "completed") {
        clearInterval(checkInterval);
        console.log(`🎉 Job completed! Found ${job.changes.length} changes to apply`);

        // Apply changes to inventory
        if (job.changes.length > 0) {
          console.log("Applying changes to inventory...");
          const updates = job.changes.map((r) => ({
            id: r.id,
            category: r.newCategory,
            subcategory: r.newSubcategory,
          }));

          await bulkUpdateCategories(updates);
          console.log("✅ Changes applied successfully!");

          Alert.alert(
            "Complete!",
            `Successfully recategorized ${job.changes.length} items with categories and subcategories.`,
            [{ text: "OK" }]
          );
        } else {
          console.log("⚠️ No changes to apply");
          Alert.alert(
            "Complete!",
            "Recategorization completed, but no changes were needed.",
            [{ text: "OK" }]
          );
        }
      } else if (job.status === "failed") {
        clearInterval(checkInterval);
        Alert.alert(
          "Error",
          job.error || "Recategorization failed. Please try again."
        );
      } else if (job.status === "cancelled") {
        clearInterval(checkInterval);
      }
    }, 1000); // Check every second

    // Clean up interval when component unmounts
    return () => clearInterval(checkInterval);
  };

  const handleRecategorize = async () => {
    if (itemsToProcess.length === 0) {
      Alert.alert("No Items", "No inventory items to recategorize");
      return;
    }

    if (!websiteUrl.trim()) {
      Alert.alert("Website Required", "Please enter a website URL");
      return;
    }

    // Calculate estimated time
    const estimatedMinutes = Math.ceil((itemsToProcess.length / 30) / 3 * 5 / 60); // 30 per batch, 3 concurrent, ~5 sec each

    let warningMessage = selectedItemIds
      ? `This will process ${itemsToProcess.length} selected items with AI:\n\n`
      : `This will process all ${itemsToProcess.length} items with AI:\n\n`;

    warningMessage += `1. Extract categories from ${websiteUrl}\n2. Analyze items and categorize\n3. Auto-update categories & subcategories\n\nEstimated time: ~${estimatedMinutes} minutes`;

    if (itemsToProcess.length > 500) {
      warningMessage += `\n\n⚠️ IMPORTANT: Keep your phone awake and the app open during processing. If interrupted, no changes will be applied.`;
    }

    Alert.alert(
      selectedItemIds ? "Recategorize Selected Items" : "Recategorize All Items",
      warningMessage,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start Processing",
          onPress: async () => {
            try {
              // Create background job
              const job = await createJob(websiteUrl, itemsToProcess.length);
              setActiveJob(job);
              setCanNavigateAway(false); // Keep them on screen

              // Start monitoring
              monitorJob(job.id);

              // Execute job in background
              executeJob(job.id, itemsToProcess, (updatedJob) => {
                setActiveJob(updatedJob);
              });

              Alert.alert(
                "Processing Started",
                `Keep the app open and your phone awake.\nProgress: 0 / ${itemsToProcess.length}`,
                [{ text: "OK" }]
              );
            } catch (error) {
              console.error("Error starting recategorization:", error);
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to start recategorization. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    if (!activeJob || activeJob.status !== "running") {
      return;
    }

    Alert.alert(
      "Cancel Recategorization",
      "Are you sure you want to cancel? Progress will be lost and no changes will be applied.",
      [
        { text: "Keep Running", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelJob(activeJob.id);
              Alert.alert(
                "Cancelled",
                "Recategorization has been cancelled.",
                [{ text: "OK" }]
              );
            } catch (error) {
              console.error("Error cancelling job:", error);
              Alert.alert("Error", "Failed to cancel job");
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
            {selectedItemIds ? (
              <>
                <Text className="text-white/90 text-sm">
                  Selected Items: {itemsToProcess.length}
                </Text>
                <Text className="text-white/70 text-xs mt-1">
                  (Total inventory: {items.length} items)
                </Text>
              </>
            ) : (
              <Text className="text-white/90 text-sm">
                Total Items: {items.length}
              </Text>
            )}
            {activeJob && (
              <>
                <Text className="text-white/90 text-sm">
                  Processed: {activeJob.processedItems} / {activeJob.totalItems}
                </Text>
                {activeJob.changes.length > 0 && (
                  <Text className="text-white/90 text-sm">
                    Items Updated: {activeJob.changes.length}
                  </Text>
                )}
              </>
            )}
          </View>

          {/* Start Button */}
          {!activeJob && (
            <Pressable
              onPress={handleRecategorize}
              className="bg-white rounded-2xl p-4 items-center mb-4"
            >
              <Ionicons name="refresh" size={32} color="#8b5cf6" />
              <Text className="text-purple-600 text-lg font-semibold mt-2">
                {selectedItemIds ? `Recategorize ${itemsToProcess.length} Selected Items` : "Auto-Recategorize All"}
              </Text>
              <Text className="text-gray-600 text-sm mt-1">
                {selectedItemIds
                  ? `Process only the ${itemsToProcess.length} items you selected`
                  : `Process all ${itemsToProcess.length} items - keep app open!`
                }
              </Text>
            </Pressable>
          )}

          {/* Processing */}
          {activeJob && activeJob.status === "running" && (
            <View className="bg-white/20 rounded-2xl p-6 items-center mb-4">
              <ActivityIndicator size="large" color="white" />
              <Text className="text-white text-base font-semibold mt-4">
                Processing in Background
              </Text>
              <Text className="text-white/90 text-sm mt-2 text-center">
                {activeJob.processedItems} of {activeJob.totalItems} items analyzed
              </Text>
              {canNavigateAway && (
                <Text className="text-white/70 text-xs mt-4 text-center">
                  You can safely navigate away. We will notify you when complete.
                </Text>
              )}
              <Pressable
                onPress={handleCancel}
                className="bg-red-500 rounded-xl px-6 py-3 mt-4"
              >
                <Text className="text-white font-semibold">
                  Cancel
                </Text>
              </Pressable>
            </View>
          )}

          {/* Success Message */}
          {activeJob && activeJob.status === "completed" && (
            <View className="bg-green-100 rounded-2xl p-6 items-center mb-4">
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
              <Text className="text-green-800 text-lg font-semibold mt-4">
                Successfully Updated!
              </Text>
              <Text className="text-green-700 text-sm mt-2 text-center">
                {activeJob.changes.length} items have been recategorized with categories and subcategories.
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

          {/* Error Message */}
          {activeJob && activeJob.status === "failed" && (
            <View className="bg-red-100 rounded-2xl p-6 items-center mb-4">
              <Ionicons name="alert-circle" size={64} color="#EF4444" />
              <Text className="text-red-800 text-lg font-semibold mt-4">
                Error Occurred
              </Text>
              <Text className="text-red-700 text-sm mt-2 text-center">
                {activeJob.error || "An unknown error occurred"}
              </Text>
              <Pressable
                onPress={() => {
                  setActiveJob(null);
                  setCanNavigateAway(false);
                }}
                className="bg-red-600 rounded-xl px-6 py-3 mt-4"
              >
                <Text className="text-white font-semibold">
                  Try Again
                </Text>
              </Pressable>
            </View>
          )}

          {/* Cancelled Message */}
          {activeJob && activeJob.status === "cancelled" && (
            <View className="bg-yellow-100 rounded-2xl p-6 items-center mb-4">
              <Ionicons name="close-circle" size={64} color="#F59E0B" />
              <Text className="text-yellow-800 text-lg font-semibold mt-4">
                Cancelled
              </Text>
              <Text className="text-yellow-700 text-sm mt-2 text-center">
                Recategorization was cancelled. No changes were applied.
              </Text>
              <Pressable
                onPress={() => {
                  setActiveJob(null);
                  setCanNavigateAway(false);
                }}
                className="bg-yellow-600 rounded-xl px-6 py-3 mt-4"
              >
                <Text className="text-white font-semibold">
                  Start Over
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
