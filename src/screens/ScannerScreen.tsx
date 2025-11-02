import React from "react";
import { View, Text, Pressable, Platform, Alert, FlatList, Modal } from "react-native";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useInventoryStore } from "../state/inventoryStore";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { InventoryItem } from "../types/inventory";

export default function ScannerScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = React.useState(false);
  const [scannedData, setScannedData] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showItemPicker, setShowItemPicker] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<InventoryItem[]>([]);

  const getItemByBarcode = useInventoryStore((s) => s.getItemByBarcode);
  const items = useInventoryStore((s) => s.items);
  const addItem = useInventoryStore((s) => s.addItem);
  const updateItem = useInventoryStore((s) => s.updateItem);

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned || isProcessing) return;

    setScanned(true);
    setScannedData(data);
    setIsProcessing(true);

    // Check if item already exists with this barcode
    const existingItem = getItemByBarcode(data);

    if (existingItem) {
      // Item exists with this barcode, show it
      setIsProcessing(false);
      setTimeout(() => {
        navigation.navigate("EditItem", { item: existingItem });
        setScanned(false);
        setScannedData("");
      }, 500);
    } else {
      // Check if scanned barcode matches any SKU/model numbers in existing items
      // This handles cases where items were imported with model numbers but no barcode set yet
      const scannedLower = data.toLowerCase().trim();
      const matchingItems = items.filter((item) => {
        // Check if the scanned barcode appears in the item's existing barcode field (partial match)
        if (item.barcode?.toLowerCase().includes(scannedLower)) {
          return true;
        }

        // Check if the scanned barcode appears in the item's name (could be model number)
        if (item.name.toLowerCase().includes(scannedLower)) {
          return true;
        }

        // Check if the scanned barcode appears in the description (could be SKU/part number)
        if (item.description?.toLowerCase().includes(scannedLower)) {
          return true;
        }

        // Also check reverse: if item's barcode (which might be a model number from D-Tools)
        // partially matches the scanned barcode
        if (item.barcode && scannedLower.includes(item.barcode.toLowerCase())) {
          return true;
        }

        return false;
      });

      if (matchingItems.length > 0) {
        // Found potential matches - let user choose
        setSearchResults(matchingItems);
        setShowItemPicker(true);
        setIsProcessing(false);
      } else {
        // No matches, use AI to identify new product
        try {
          const productInfo = await identifyProduct(data);
          setIsProcessing(false);

          // Navigate to add item with pre-filled data
          setTimeout(() => {
            navigation.navigate("AddItem", {
              barcode: data,
              suggestedName: productInfo.name,
              suggestedCategory: productInfo.category,
            });
            setScanned(false);
            setScannedData("");
          }, 500);
        } catch (error) {
          setIsProcessing(false);
          // Navigate to add item with just barcode
          setTimeout(() => {
            navigation.navigate("AddItem", { barcode: data });
            setScanned(false);
            setScannedData("");
          }, 500);
        }
      }
    }
  };

  const handleSelectItem = (item: InventoryItem) => {
    // Associate this barcode with the selected item
    Alert.alert(
      "Link Barcode",
      `Link barcode ${scannedData} to ${item.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            setShowItemPicker(false);
            setSearchResults([]);
            setScanned(false);
            setScannedData("");
          },
        },
        {
          text: "Link",
          onPress: () => {
            updateItem(item.id, { barcode: scannedData });
            setShowItemPicker(false);
            setSearchResults([]);
            setTimeout(() => {
              navigation.navigate("EditItem", { item: { ...item, barcode: scannedData } });
              setScanned(false);
              setScannedData("");
            }, 300);
          },
        },
      ]
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
        style={{ flex: 1 }}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
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
            <Text className="text-2xl font-bold text-white">Scan Barcode</Text>
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
            Position barcode within the frame
          </Text>
        </View>

        {/* Bottom Instructions */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          className="pb-10 pt-6 px-6"
        >
          <Text className="text-white text-sm text-center opacity-80">
            Supports QR codes, UPC, EAN, Code 39, Code 128, and more
          </Text>
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
                  AI Processing
                </Text>
                <Text className="text-base text-neutral-500 text-center">
                  Identifying product from barcode...
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
          setScanned(false);
          setScannedData("");
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
                    setScanned(false);
                    setScannedData("");
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
