import React from "react";
import { View, Text, Pressable, Platform, Alert, FlatList, Modal } from "react-native";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Ionicons } from "@expo/vector-icons";
import { useInventoryStore } from "../state/inventoryStore";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { InventoryItem } from "../types/inventory";

export default function ScannerScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [scanned, setScanned] = React.useState(false);
  const [scannedData, setScannedData] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showItemPicker, setShowItemPicker] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<InventoryItem[]>([]);
  const [extractedSKU, setExtractedSKU] = React.useState<string>("");
  const [matchedItem, setMatchedItem] = React.useState<InventoryItem | null>(null);
  const [mode, setMode] = React.useState<"capture" | "scan">("capture"); // capture SKU first, then scan barcode
  const lastScannedRef = React.useRef<string>("");
  const lastScanTimeRef = React.useRef<number>(0);
  const cameraRef = React.useRef<CameraView>(null);

  const getItemByBarcode = useInventoryStore((s) => s.getItemByBarcode);
  const items = useInventoryStore((s) => s.items);
  const addItem = useInventoryStore((s) => s.addItem);
  const updateItem = useInventoryStore((s) => s.updateItem);

  // Reset scanner when screen comes into focus
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setScanned(false);
      setScannedData("");
      setIsProcessing(false);
      setShowItemPicker(false);
      setSearchResults([]);
      setExtractedSKU("");
      setMatchedItem(null);
      setMode("capture");
      lastScannedRef.current = "";
      lastScanTimeRef.current = 0;
    });

    return unsubscribe;
  }, [navigation]);

  const resetScanner = () => {
    setScanned(false);
    setScannedData("");
    setIsProcessing(false);
    setExtractedSKU("");
    setMatchedItem(null);
    setMode("capture");
    lastScannedRef.current = "";
  };

  const extractSKUFromImage = async (imageUri: string): Promise<string | null> => {
    try {
      // Read image as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const OpenAI = (await import("openai")).default;
      const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error("OpenAI API key not found");
      }

      const openai = new OpenAI({ apiKey });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an OCR assistant. Extract the SKU, model number, or part number from product labels. Look for alphanumeric codes that appear to be product identifiers. Return ONLY the SKU/model number text, nothing else. If multiple numbers are visible, return the one that looks like a product model or SKU (not serial numbers, barcodes, or dates).",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the SKU or model number from this product label:",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 100,
      });

      const extractedText = response.choices[0].message.content?.trim();
      return extractedText || null;
    } catch (error) {
      console.error("SKU extraction error:", error);
      return null;
    }
  };

  const handleCaptureSKU = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      // Take a picture to extract SKU
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.8,
      });

      if (!photo) {
        throw new Error("Failed to capture image");
      }

      // Extract SKU from the image
      const sku = await extractSKUFromImage(photo.uri);

      if (!sku) {
        setIsProcessing(false);
        Alert.alert("No SKU Found", "Could not detect a SKU or model number in the image. Try again or skip to scan barcode.", [
          { text: "Retry", onPress: () => resetScanner() },
          {
            text: "Skip to Barcode",
            onPress: () => {
              setMode("scan");
              setIsProcessing(false);
            }
          },
        ]);
        return;
      }

      setExtractedSKU(sku);

      // Search for items matching the SKU
      const skuLower = sku.toLowerCase().trim();
      const matchingItems = items.filter((item) => {
        // Check if item's stored barcode/model (from D-Tools) matches SKU
        if (item.barcode?.toLowerCase() === skuLower) return true;
        if (item.barcode?.toLowerCase().includes(skuLower)) return true;
        if (skuLower.includes(item.barcode?.toLowerCase() || "")) return true;
        // Check if item name contains the SKU
        if (item.name.toLowerCase().includes(skuLower)) return true;
        // Check if description contains the SKU
        if (item.description?.toLowerCase().includes(skuLower)) return true;
        return false;
      });

      if (matchingItems.length === 1) {
        // Perfect match! Store it and switch to scan mode
        setMatchedItem(matchingItems[0]);
        setMode("scan");
        setIsProcessing(false);
        Alert.alert(
          "Item Found!",
          `Found: ${matchingItems[0].name}\nSKU: ${sku}\n\nNow scan the barcode to link it to this item.`,
          [{ text: "Ready to Scan" }]
        );
      } else if (matchingItems.length > 1) {
        // Multiple matches - let user choose
        setSearchResults(matchingItems);
        setShowItemPicker(true);
        setIsProcessing(false);
      } else {
        // No match - will create new item after barcode scan
        setIsProcessing(false);
        Alert.alert(
          "New Item",
          `SKU detected: ${sku}\n\nThis item is not in inventory yet. Scan the barcode to create a new item.`,
          [{
            text: "Ready to Scan",
            onPress: () => setMode("scan")
          }]
        );
      }
    } catch (error) {
      console.error("Capture SKU error:", error);
      setIsProcessing(false);
      Alert.alert("Error", "Failed to capture or process image. Please try again.");
    }
  };

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    // Only process barcodes when in "scan" mode
    if (mode !== "scan") return;
    if (scanned || isProcessing) return;

    // Prevent scanning the same barcode within 3 seconds
    const now = Date.now();
    if (lastScannedRef.current === data && now - lastScanTimeRef.current < 3000) {
      return;
    }

    lastScannedRef.current = data;
    lastScanTimeRef.current = now;

    setScanned(true);
    setScannedData(data);
    setIsProcessing(true);

    try {
      // Check if item already exists with this exact barcode
      const existingItem = getItemByBarcode(data);

      if (existingItem) {
        // Item exists with this barcode, show it
        setIsProcessing(false);
        setTimeout(() => {
          navigation.navigate("EditItem", { item: existingItem });
          resetScanner();
        }, 500);
        return;
      }

      // If we have a matched item from SKU detection, link the barcode to it
      if (matchedItem) {
        updateItem(matchedItem.id, { barcode: data });
        setIsProcessing(false);

        Alert.alert(
          "Barcode Linked!",
          `Successfully linked barcode to:\n${matchedItem.name}\nSKU: ${extractedSKU}`,
          [
            {
              text: "View Item",
              onPress: () => {
                navigation.navigate("EditItem", { item: { ...matchedItem, barcode: data } });
                resetScanner();
              },
            },
            {
              text: "Scan Another",
              onPress: () => resetScanner(),
            },
          ]
        );
        return;
      }

      // No matched item - create new one
      const productInfo = await identifyProduct(data);
      setIsProcessing(false);

      // Navigate to add item with SKU and barcode
      setTimeout(() => {
        navigation.navigate("AddItem", {
          barcode: data,
          suggestedName: extractedSKU ? `${extractedSKU} - ${productInfo.name}` : productInfo.name,
          suggestedCategory: productInfo.category,
        });
        resetScanner();
      }, 500);
    } catch (error) {
      console.error("Barcode scan error:", error);
      setIsProcessing(false);

      // Fallback: navigate to add item with SKU info
      setTimeout(() => {
        navigation.navigate("AddItem", {
          barcode: data,
          suggestedName: extractedSKU || undefined,
        });
        resetScanner();
      }, 500);
    }
  };

  const handleSelectItem = (item: InventoryItem) => {
    // User selected which item matches the SKU
    setMatchedItem(item);
    setShowItemPicker(false);
    setSearchResults([]);
    setMode("scan");

    Alert.alert(
      "Item Selected",
      `Selected: ${item.name}\n\nNow scan the barcode to link it to this item.`,
      [{ text: "Ready to Scan" }]
    );
  };

  const handleCreateNew = () => {
    setShowItemPicker(false);
    setSearchResults([]);
    navigation.navigate("AddItem", { barcode: scannedData });
    setScanned(false);
    setScannedData("");
  };

  const identifyProduct = async (barcode: string) => {
    // Use AI to identify product from barcode
    const OpenAI = (await import("openai")).default;
    const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OpenAI API key not found");
    }

    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a product identification assistant. Given a barcode number, suggest a likely product name and category. Return only JSON with 'name' and 'category' fields. If you cannot identify the product, return generic values based on the barcode format.",
        },
        {
          role: "user",
          content: `Identify this barcode: ${barcode}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      name: result.name || "Unknown Product",
      category: result.category || "General",
    };
  };

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50">
        <Text className="text-neutral-500">Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 px-6">
        <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
        <Text className="text-xl font-bold text-neutral-900 mt-4 text-center">
          Camera Permission Required
        </Text>
        <Text className="text-base text-neutral-500 mt-2 text-center">
          We need camera access to scan barcodes
        </Text>
        <Pressable
          onPress={requestPermission}
          className="mt-6 bg-indigo-600 rounded-xl px-6 py-3"
        >
          <Text className="text-white font-semibold text-base">Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
        onBarcodeScanned={mode === "scan" && !scanned ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: [
            "qr",
            "ean13",
            "ean8",
            "upc_a",
            "upc_e",
            "code39",
            "code128",
            "pdf417",
          ],
        }}
      />

      {/* Overlay UI */}
      <View className="absolute top-0 left-0 right-0 bottom-0 z-10">
        {/* Top Bar */}
        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "transparent"]}
          className="pt-16 pb-6 px-6"
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-white">
                {mode === "capture" ? "Capture SKU" : "Scan Barcode"}
              </Text>
              {mode === "scan" && matchedItem && (
                <Text className="text-sm text-white/80 mt-1">
                  For: {matchedItem.name}
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 items-center justify-center bg-white/20 rounded-full"
            >
              <Ionicons name="close" size={24} color="white" />
            </Pressable>
          </View>
        </LinearGradient>

        {/* Scanning Frame */}
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="w-full aspect-square max-w-sm border-4 border-white rounded-3xl"
            style={{ borderWidth: 3 }}
          >
            {/* Corner decorations */}
            <View className="absolute top-0 left-0 w-16 h-16 border-l-4 border-t-4 border-indigo-400 rounded-tl-3xl" />
            <View className="absolute top-0 right-0 w-16 h-16 border-r-4 border-t-4 border-indigo-400 rounded-tr-3xl" />
            <View className="absolute bottom-0 left-0 w-16 h-16 border-l-4 border-b-4 border-indigo-400 rounded-bl-3xl" />
            <View className="absolute bottom-0 right-0 w-16 h-16 border-r-4 border-b-4 border-indigo-400 rounded-br-3xl" />
          </View>

          <Text className="text-white text-base mt-6 text-center">
            {mode === "capture"
              ? "Position the product label in the frame"
              : "Position barcode within the frame"}
          </Text>
        </View>

        {/* Bottom Instructions / Capture Button */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          className="pb-10 pt-6 px-6"
        >
          {mode === "capture" ? (
            <Pressable
              onPress={handleCaptureSKU}
              disabled={isProcessing}
              className="bg-indigo-600 rounded-full py-4 px-8 items-center"
              style={{
                shadowColor: "#4F46E5",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <View className="flex-row items-center">
                <Ionicons name="camera" size={24} color="white" />
                <Text className="text-white text-lg font-bold ml-2">
                  Capture SKU
                </Text>
              </View>
            </Pressable>
          ) : (
            <View>
              <Text className="text-white text-sm text-center opacity-80 mb-2">
                {matchedItem
                  ? `Linking to: ${matchedItem.name}`
                  : "Scan barcode to continue"}
              </Text>
              <Pressable
                onPress={resetScanner}
                className="bg-white/20 rounded-full py-2 px-4 items-center"
              >
                <Text className="text-white text-sm font-semibold">
                  Start Over
                </Text>
              </Pressable>
            </View>
          )}
        </LinearGradient>

        {/* Processing Overlay */}
        {isProcessing && (
          <Animated.View
            entering={FadeIn}
            className="absolute top-0 left-0 right-0 bottom-0 bg-black/70 items-center justify-center"
          >
            <Animated.View entering={SlideInDown.springify()}>
              <View className="bg-white rounded-3xl p-8 mx-6 items-center">
                <View className="w-16 h-16 rounded-full bg-indigo-100 items-center justify-center mb-4">
                  <Ionicons name="sparkles" size={32} color="#4F46E5" />
                </View>
                <Text className="text-xl font-bold text-neutral-900 mb-2">
                  {mode === "capture" ? "Extracting SKU..." : "AI Processing"}
                </Text>
                <Text className="text-base text-neutral-500 text-center">
                  {mode === "capture"
                    ? "Reading product label with AI..."
                    : "Identifying product from barcode..."}
                </Text>
              </View>
            </Animated.View>
          </Animated.View>
        )}
      </View>

      {/* Item Picker Modal */}
      <Modal
        visible={showItemPicker}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowItemPicker(false);
          setSearchResults([]);
          resetScanner();
        }}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-20">
            <View className="flex-1 bg-white rounded-t-3xl">
              {/* Header */}
              <View className="px-6 pt-6 pb-4 border-b border-neutral-200">
                <Text className="text-2xl font-bold text-neutral-900 mb-2">
                  Link Barcode
                </Text>
                <Text className="text-sm text-neutral-600">
                  Found {searchResults.length} matching {searchResults.length === 1 ? "item" : "items"}. Select one to link barcode &ldquo;{scannedData}&rdquo;
                </Text>
              </View>

              {/* Item List */}
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleSelectItem(item)}
                    className="bg-neutral-50 rounded-xl p-4 mb-3"
                  >
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 rounded-full bg-indigo-100 items-center justify-center mr-4">
                        <Ionicons name="cube" size={24} color="#4F46E5" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-neutral-900">
                          {item.name}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <View className="bg-neutral-200 rounded-full px-2 py-1 mr-2">
                            <Text className="text-xs font-medium text-neutral-700">
                              {item.category}
                            </Text>
                          </View>
                          <Text className="text-sm text-neutral-500">
                            Qty: {item.quantity}
                          </Text>
                        </View>
                        {item.barcode && (
                          <View className="mt-2 flex-row items-center">
                            <Ionicons name="barcode-outline" size={14} color="#9CA3AF" />
                            <Text className="text-xs text-neutral-500 ml-1">
                              Model/SKU: {item.barcode}
                            </Text>
                          </View>
                        )}
                        {item.description && (
                          <Text className="text-xs text-neutral-500 mt-1" numberOfLines={1}>
                            {item.description}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="link" size={24} color="#4F46E5" />
                    </View>
                  </Pressable>
                )}
              />

              {/* Action Buttons */}
              <View className="px-6 pb-6 pt-4 border-t border-neutral-200">
                <Pressable
                  onPress={handleCreateNew}
                  className="bg-indigo-600 rounded-xl py-4 items-center mb-3"
                >
                  <Text className="text-white font-semibold text-base">
                    Create New Item
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowItemPicker(false);
                    setSearchResults([]);
                    resetScanner();
                  }}
                  className="bg-neutral-200 rounded-xl py-4 items-center"
                >
                  <Text className="text-neutral-700 font-semibold text-base">
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
