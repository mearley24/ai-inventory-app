import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useInventoryStore } from "../state/inventoryStore";
import { useTimeTrackerStore } from "../state/timeTrackerStore";
import { ProposalItem } from "../types/inventory";
import { parseInvoiceImage } from "../api/invoice-parser";
import Animated, { FadeInDown } from "react-native-reanimated";

const PROJECT_COLORS = [
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899",
];

export default function ProposalUploadScreen({ navigation }: any) {
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [proposalItems, setProposalItems] = useState<ProposalItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const items = useInventoryStore((s) => s.items);
  const addProjectWithProposal = useTimeTrackerStore((s) => s.addProjectWithProposal);

  // Match proposal items to inventory and check stock
  const matchItemsToInventory = (lineItems: any[]): ProposalItem[] => {
    return lineItems.map((item) => {
      // Try to find matching inventory item
      const normalizedName = item.description.toLowerCase().replace(/[^a-z0-9]/g, "");
      const matchedItem = items.find((invItem) => {
        const invNormalized = invItem.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        return invNormalized.includes(normalizedName) || normalizedName.includes(invNormalized);
      });

      const availableQuantity = matchedItem?.quantity || 0;
      const inStock = availableQuantity >= item.quantity;

      return {
        name: item.description,
        quantity: item.quantity,
        category: item.category || matchedItem?.category,
        price: item.unitPrice || matchedItem?.price,
        matchedInventoryId: matchedItem?.id,
        inStock,
        availableQuantity,
      };
    });
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Camera permission is required to take photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        await processDocument(result.assets[0].uri, "image");
      }
    } catch (error: any) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to take photo: " + error.message);
    }
  };

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const fileType = result.assets[0].mimeType?.startsWith("image") ? "image" : "pdf";
        await processDocument(result.assets[0].uri, fileType);
      }
    } catch (error: any) {
      console.error("File picker error:", error);
      Alert.alert("Error", "Failed to select file: " + error.message);
    }
  };

  const handleSelectFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Photo library permission is required.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        await processDocument(result.assets[0].uri, "image");
      }
    } catch (error: any) {
      console.error("Library error:", error);
      Alert.alert("Error", "Failed to select image: " + error.message);
    }
  };

  const processDocument = async (uri: string, type: "image" | "pdf") => {
    setIsUploading(true);
    try {
      console.log("Processing proposal:", uri, type);
      const parsed = await parseInvoiceImage(uri, type === "pdf" ? "application/pdf" : undefined);

      if (!parsed.lineItems || parsed.lineItems.length === 0) {
        Alert.alert("No Items Found", "Could not extract any items from the proposal. Please try a clearer image or PDF.");
        return;
      }

      // Match items to inventory and check stock
      const matchedItems = matchItemsToInventory(parsed.lineItems);
      setProposalItems(matchedItems);
      setShowPreview(true);

      // Auto-fill project name if vendor is found
      if (parsed.vendor && !projectName) {
        setProjectName(parsed.vendor);
      }
    } catch (error: any) {
      console.error("Processing error:", error);
      Alert.alert("Error", "Failed to process proposal: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateProject = () => {
    if (!projectName.trim()) {
      Alert.alert("Project Name Required", "Please enter a project name.");
      return;
    }

    if (proposalItems.length === 0) {
      Alert.alert("No Items", "Please upload a proposal document first.");
      return;
    }

    // Check for low stock warnings
    const lowStockItems = proposalItems.filter((item) => !item.inStock);
    if (lowStockItems.length > 0) {
      Alert.alert(
        "Low Stock Warning",
        `${lowStockItems.length} item(s) have insufficient stock. Continue anyway?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Create Project",
            onPress: () => createProject(),
          },
        ]
      );
    } else {
      createProject();
    }
  };

  const createProject = () => {
    const color = PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];

    addProjectWithProposal(
      {
        name: projectName.trim(),
        description: description.trim() || undefined,
        color,
        clientName: clientName.trim() || undefined,
        clientEmail: clientEmail.trim() || undefined,
      },
      proposalItems
    );

    Alert.alert("Success", "Project created with proposal!");
    navigation.goBack();
  };

  const totalItems = proposalItems.length;
  const inStockCount = proposalItems.filter((item) => item.inStock).length;
  const lowStockCount = totalItems - inStockCount;

  return (
    <View className="flex-1 bg-neutral-50">
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-4 pb-3">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#171717" />
          </Pressable>
          <Text className="text-xl font-bold text-neutral-900">Upload Proposal</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 py-4">
            {/* Project Details */}
            <View className="bg-white rounded-2xl p-5 mb-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
              <Text className="text-lg font-bold text-neutral-900 mb-4">Project Details</Text>

              <Text className="text-sm font-medium text-neutral-700 mb-2">Project Name *</Text>
              <TextInput
                className="bg-neutral-50 rounded-xl px-4 py-3 text-base text-neutral-900 mb-4"
                placeholder="Enter project name"
                placeholderTextColor="#9CA3AF"
                value={projectName}
                onChangeText={setProjectName}
              />

              <Text className="text-sm font-medium text-neutral-700 mb-2">Client Name</Text>
              <TextInput
                className="bg-neutral-50 rounded-xl px-4 py-3 text-base text-neutral-900 mb-4"
                placeholder="Enter client name"
                placeholderTextColor="#9CA3AF"
                value={clientName}
                onChangeText={setClientName}
              />

              <Text className="text-sm font-medium text-neutral-700 mb-2">Client Email</Text>
              <TextInput
                className="bg-neutral-50 rounded-xl px-4 py-3 text-base text-neutral-900 mb-4"
                placeholder="client@example.com"
                placeholderTextColor="#9CA3AF"
                value={clientEmail}
                onChangeText={setClientEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text className="text-sm font-medium text-neutral-700 mb-2">Description</Text>
              <TextInput
                className="bg-neutral-50 rounded-xl px-4 py-3 text-base text-neutral-900"
                placeholder="Optional project description"
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={{ textAlignVertical: "top" }}
              />
            </View>

            {/* Upload Proposal */}
            <View className="bg-white rounded-2xl p-5 mb-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
              <Text className="text-lg font-bold text-neutral-900 mb-2">Upload Proposal</Text>
              <Text className="text-sm text-neutral-500 mb-4">Upload a proposal, BOM, or quote to auto-populate items</Text>

              {isUploading ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text className="text-neutral-500 mt-4">Processing proposal...</Text>
                </View>
              ) : (
                <View className="gap-3">
                  <Pressable
                    onPress={handleTakePhoto}
                    className="bg-indigo-600 rounded-xl py-4 flex-row items-center justify-center"
                  >
                    <Ionicons name="camera" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Take Photo</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleSelectFromLibrary}
                    className="bg-purple-600 rounded-xl py-4 flex-row items-center justify-center"
                  >
                    <Ionicons name="image" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Choose from Library</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleSelectFile}
                    className="bg-blue-600 rounded-xl py-4 flex-row items-center justify-center"
                  >
                    <Ionicons name="document" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Select PDF/Image File</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Stock Summary */}
            {showPreview && proposalItems.length > 0 && (
              <>
                <View className="bg-white rounded-2xl p-5 mb-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                  <Text className="text-lg font-bold text-neutral-900 mb-4">Stock Summary</Text>

                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-base text-neutral-700">Total Items:</Text>
                    <Text className="text-base font-semibold text-neutral-900">{totalItems}</Text>
                  </View>

                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-base text-neutral-700">In Stock:</Text>
                    <Text className="text-base font-semibold text-emerald-600">{inStockCount}</Text>
                  </View>

                  {lowStockCount > 0 && (
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-base text-neutral-700">Low/Out of Stock:</Text>
                      <Text className="text-base font-semibold text-red-600">{lowStockCount}</Text>
                    </View>
                  )}

                  {lowStockCount > 0 && (
                    <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
                      <View className="flex-row items-center">
                        <Ionicons name="warning" size={20} color="#F59E0B" />
                        <Text className="text-sm font-medium text-amber-800 ml-2">Some items are low or out of stock</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Items List */}
                <View className="bg-white rounded-2xl p-5 mb-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                  <Text className="text-lg font-bold text-neutral-900 mb-4">Items ({proposalItems.length})</Text>

                  {proposalItems.map((item, index) => (
                    <Animated.View
                      key={index}
                      entering={FadeInDown.delay(index * 50).springify()}
                      className={`border-b border-neutral-100 py-3 ${index === proposalItems.length - 1 ? "border-b-0" : ""}`}
                    >
                      <View className="flex-row items-start justify-between mb-1">
                        <View className="flex-1 mr-2">
                          <Text className="text-base font-semibold text-neutral-900 mb-1">{item.name}</Text>
                          {item.category && (
                            <Text className="text-xs text-neutral-500">{item.category}</Text>
                          )}
                        </View>
                        <View className="items-end">
                          <Text className="text-base font-bold text-neutral-900">Qty: {item.quantity}</Text>
                          {item.price && (
                            <Text className="text-sm text-neutral-500">${item.price.toFixed(2)}</Text>
                          )}
                        </View>
                      </View>

                      {/* Stock Status */}
                      <View className="flex-row items-center mt-2">
                        {item.inStock ? (
                          <>
                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            <Text className="text-sm text-emerald-600 ml-1">
                              In stock ({item.availableQuantity} available)
                            </Text>
                          </>
                        ) : item.availableQuantity > 0 ? (
                          <>
                            <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                            <Text className="text-sm text-amber-600 ml-1">
                              Low stock (only {item.availableQuantity} available, need {item.quantity})
                            </Text>
                          </>
                        ) : (
                          <>
                            <Ionicons name="close-circle" size={16} color="#EF4444" />
                            <Text className="text-sm text-red-600 ml-1">Out of stock</Text>
                          </>
                        )}
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </>
            )}

            {/* Create Button */}
            {showPreview && proposalItems.length > 0 && (
              <Pressable
                onPress={handleCreateProject}
                className="bg-indigo-600 rounded-2xl py-4 items-center mb-8"
                style={{ shadowColor: "#4F46E5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
              >
                <Text className="text-white text-lg font-bold">Create Project</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
