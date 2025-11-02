import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { parseInvoiceImage } from "../api/invoice-parser";
import { safeGoBack } from "../utils/navigation";
import { useInventoryStore } from "../state/inventoryStore";
import { matchCategory } from "../utils/categories";
import type { ParsedInvoice, InvoiceLineItem } from "../types/inventory";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function InvoiceUploadScreen({ navigation }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [parsedInvoice, setParsedInvoice] = useState<ParsedInvoice | null>(
    null
  );
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const addItems = useInventoryStore((s) => s.addItems);

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Camera permission is needed to take photos of invoices"
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setSelectedDocument(null);
      setParsedInvoice(null);
      setSelectedItems(new Set());
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setSelectedDocument(null);
      setParsedInvoice(null);
      setSelectedItems(new Set());
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedDocument({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || "image/jpeg",
        });
        setSelectedImage(null);
        setParsedInvoice(null);
        setSelectedItems(new Set());
      }
    } catch (error) {
      console.error("Document picker error:", error);
      Alert.alert("Error", "Failed to pick document. Please try again.");
    }
  };

  const handleParseInvoice = async () => {
    const sourceUri = selectedImage || selectedDocument?.uri;
    if (!sourceUri) {
      Alert.alert("No File Selected", "Please select an invoice image or document first");
      return;
    }

    setIsProcessing(true);
    setProcessingMessage("Reading invoice with AI...");

    try {
      // Pass the MIME type hint if we have a document
      const mimeTypeHint = selectedDocument?.type;
      const parsed = await parseInvoiceImage(sourceUri, mimeTypeHint);
      setParsedInvoice(parsed);

      // Select all items by default
      const allIndices = new Set(
        Array.from({ length: parsed.lineItems.length }, (_, i) => i)
      );
      setSelectedItems(allIndices);

      setProcessingMessage("");
      Alert.alert(
        "Invoice Parsed",
        `Found ${parsed.lineItems.length} line items from ${parsed.vendor || "invoice"}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Parse error:", error);
      Alert.alert(
        "Parse Error",
        error instanceof Error
          ? error.message
          : "Failed to parse invoice. Please try again."
      );
      setProcessingMessage("");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleItemSelection = (index: number) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedItems(newSelection);
  };

  const handleAddToInventory = () => {
    if (!parsedInvoice || selectedItems.size === 0) {
      Alert.alert("No Items Selected", "Please select items to add");
      return;
    }

    const itemsToAdd = Array.from(selectedItems).map((index) => {
      const lineItem = parsedInvoice.lineItems[index];
      return {
        name: lineItem.description,
        quantity: lineItem.quantity,
        price: lineItem.unitPrice,
        category: lineItem.category
          ? matchCategory(lineItem.category)
          : "Other",
        barcode: lineItem.sku,
        description: `From ${parsedInvoice.vendor || "invoice"} - Invoice #${parsedInvoice.invoiceNumber || "N/A"}`,
      };
    });

    addItems(itemsToAdd);

    Alert.alert(
      "Success",
      `Added ${itemsToAdd.length} items to inventory`,
      [
        {
          text: "OK",
          onPress: () => safeGoBack(navigation),
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
            Upload Invoice
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, gap: 20 }}
        >
          {/* Upload Options */}
          {!selectedImage && !selectedDocument && (
            <View className="gap-4">
              <Text className="text-white text-base mb-2">
                Select an invoice to parse
              </Text>

              <Pressable
                onPress={handleTakePhoto}
                className="bg-white/20 rounded-2xl p-6 items-center"
              >
                <Ionicons name="camera" size={48} color="white" />
                <Text className="text-white text-lg font-semibold mt-4">
                  Take Photo
                </Text>
                <Text className="text-white/80 text-sm mt-1">
                  Capture invoice with camera
                </Text>
              </Pressable>

              <Pressable
                onPress={handlePickImage}
                className="bg-white/20 rounded-2xl p-6 items-center"
              >
                <Ionicons name="image" size={48} color="white" />
                <Text className="text-white text-lg font-semibold mt-4">
                  Choose from Library
                </Text>
                <Text className="text-white/80 text-sm mt-1">
                  Select existing invoice image
                </Text>
              </Pressable>

              <Pressable
                onPress={handlePickDocument}
                className="bg-white/20 rounded-2xl p-6 items-center"
              >
                <Ionicons name="document-text" size={48} color="white" />
                <Text className="text-white text-lg font-semibold mt-4">
                  Upload Image File
                </Text>
                <Text className="text-white/80 text-sm mt-1">
                  Select image file from device
                </Text>
              </Pressable>
            </View>
          )}

          {/* Selected Image Preview */}
          {selectedImage && !parsedInvoice && (
            <View className="gap-4">
              <Image
                source={{ uri: selectedImage }}
                style={{
                  width: "100%",
                  height: 300,
                  borderRadius: 16,
                  backgroundColor: "white",
                }}
                resizeMode="contain"
              />

              <Pressable
                onPress={handleParseInvoice}
                disabled={isProcessing}
                className="bg-white rounded-xl p-4 items-center"
              >
                {isProcessing ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator color="#8b5cf6" />
                    <Text className="text-purple-600 font-semibold">
                      {processingMessage}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="scan" size={24} color="#8b5cf6" />
                    <Text className="text-purple-600 font-semibold mt-2">
                      Parse Invoice with AI
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  setSelectedImage(null);
                  setSelectedDocument(null);
                  setParsedInvoice(null);
                }}
                className="bg-white/20 rounded-xl p-3 items-center"
              >
                <Text className="text-white font-medium">Choose Different</Text>
              </Pressable>
            </View>
          )}

          {/* Selected Document Preview */}
          {selectedDocument && !parsedInvoice && (
            <View className="gap-4">
              <View className="bg-white/20 rounded-2xl p-6 items-center">
                <Ionicons name="document-text" size={64} color="white" />
                <Text className="text-white text-lg font-semibold mt-4">
                  {selectedDocument.name}
                </Text>
                <Text className="text-white/80 text-sm mt-1">
                  Image File
                </Text>
              </View>

              <Pressable
                onPress={handleParseInvoice}
                disabled={isProcessing}
                className="bg-white rounded-xl p-4 items-center"
              >
                {isProcessing ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator color="#8b5cf6" />
                    <Text className="text-purple-600 font-semibold">
                      {processingMessage}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="scan" size={24} color="#8b5cf6" />
                    <Text className="text-purple-600 font-semibold mt-2">
                      Parse Invoice with AI
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  setSelectedImage(null);
                  setSelectedDocument(null);
                  setParsedInvoice(null);
                }}
                className="bg-white/20 rounded-xl p-3 items-center"
              >
                <Text className="text-white font-medium">Choose Different</Text>
              </Pressable>
            </View>
          )}

          {/* Parsed Invoice Results */}
          {parsedInvoice && (
            <View className="gap-4">
              {/* Invoice Header Info */}
              <View className="bg-white/20 rounded-2xl p-4">
                {parsedInvoice.vendor && (
                  <Text className="text-white text-lg font-semibold">
                    {parsedInvoice.vendor}
                  </Text>
                )}
                {parsedInvoice.invoiceNumber && (
                  <Text className="text-white/90 text-sm">
                    Invoice #{parsedInvoice.invoiceNumber}
                  </Text>
                )}
                {parsedInvoice.date && (
                  <Text className="text-white/90 text-sm">
                    Date: {parsedInvoice.date}
                  </Text>
                )}
                {parsedInvoice.total && (
                  <Text className="text-white text-base font-semibold mt-2">
                    Total: ${parsedInvoice.total.toFixed(2)}
                  </Text>
                )}
              </View>

              {/* Line Items */}
              <Text className="text-white text-base font-semibold">
                Line Items ({parsedInvoice.lineItems.length})
              </Text>
              <Text className="text-white/80 text-sm -mt-3">
                Tap items to select/deselect for import
              </Text>

              {parsedInvoice.lineItems.map((item, index) => (
                <Pressable
                  key={index}
                  onPress={() => toggleItemSelection(index)}
                  className={`rounded-xl p-4 ${
                    selectedItems.has(index)
                      ? "bg-white"
                      : "bg-white/20 opacity-60"
                  }`}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text
                        className={`text-base font-semibold ${
                          selectedItems.has(index)
                            ? "text-purple-600"
                            : "text-white"
                        }`}
                      >
                        {item.description}
                      </Text>
                      {item.sku && (
                        <Text
                          className={`text-sm mt-1 ${
                            selectedItems.has(index)
                              ? "text-gray-600"
                              : "text-white/80"
                          }`}
                        >
                          SKU: {item.sku}
                        </Text>
                      )}
                      <Text
                        className={`text-sm mt-1 ${
                          selectedItems.has(index)
                            ? "text-gray-600"
                            : "text-white/80"
                        }`}
                      >
                        Qty: {item.quantity} × ${item.unitPrice.toFixed(2)} = $
                        {item.totalPrice.toFixed(2)}
                      </Text>
                    </View>
                    <Ionicons
                      name={
                        selectedItems.has(index)
                          ? "checkbox"
                          : "square-outline"
                      }
                      size={24}
                      color={selectedItems.has(index) ? "#8b5cf6" : "white"}
                    />
                  </View>
                </Pressable>
              ))}

              {/* Add to Inventory Button */}
              <Pressable
                onPress={handleAddToInventory}
                disabled={selectedItems.size === 0}
                className={`rounded-xl p-4 items-center ${
                  selectedItems.size === 0 ? "bg-white/30" : "bg-white"
                }`}
              >
                <Text
                  className={`font-semibold text-lg ${
                    selectedItems.size === 0
                      ? "text-white/60"
                      : "text-purple-600"
                  }`}
                >
                  Add {selectedItems.size} Items to Inventory
                </Text>
              </Pressable>

              {/* Start Over Button */}
              <Pressable
                onPress={() => {
                  setSelectedImage(null);
                  setSelectedDocument(null);
                  setParsedInvoice(null);
                  setSelectedItems(new Set());
                }}
                className="bg-white/20 rounded-xl p-3 items-center"
              >
                <Text className="text-white font-medium">Start Over</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
