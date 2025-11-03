import React from "react";
import { View, Text, Pressable, ScrollView, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as XLSX from "xlsx";
import { useInventoryStore } from "../state/inventoryStore";
import { matchCategory } from "../utils/categories";
import { safeGoBack } from "../utils/navigation";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

export default function ImportScreen({ navigation }: any) {
  const [importing, setImporting] = React.useState(false);
  const [processingMessage, setProcessingMessage] = React.useState("");
  const [importResult, setImportResult] = React.useState<{ success: number; failed: number; merged: number } | null>(null);
  const [resetQuantities, setResetQuantities] = React.useState(true);
  const [supplierName, setSupplierName] = React.useState("");
  const [showSupplierPrompt, setShowSupplierPrompt] = React.useState(false);
  const addItems = useInventoryStore((s) => s.addItems);
  const items = useInventoryStore((s) => s.items);
  const updateItem = useInventoryStore((s) => s.updateItem);
  const deleteItem = useInventoryStore((s) => s.deleteItem);
  const autoMergeAllDuplicates = useInventoryStore((s) => s.autoMergeAllDuplicates);

  const parseExcelOrCSV = async (uri: string, mimeType?: string) => {
    const isExcel = mimeType?.includes("spreadsheet") ||
                    uri.endsWith(".xlsx") ||
                    uri.endsWith(".xls");

    if (isExcel) {
      // Handle Excel files
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const workbook = XLSX.read(base64, { type: "base64" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];

      return parseDataArray(jsonData);
    } else {
      // Handle CSV files
      const content = await FileSystem.readAsStringAsync(uri);
      return parseCSV(content);
    }
  };

  const parseDataArray = (data: string[][]) => {
    if (data.length === 0) return [];

    const headers = data[0].map((h) => String(h).trim().toLowerCase());
    const items = [];

    for (let i = 1; i < data.length; i++) {
      const values = data[i];
      if (!values || values.length < 2) continue;

      const item: any = {
        name: "",
        quantity: 0,
        category: "Other",
      };

      headers.forEach((header, index) => {
        const value = values[index];
        if (!value) return;

        const stringValue = String(value).trim();

        if (header.includes("name") || header.includes("item") || header.includes("product") || header.includes("description")) {
          if (!item.name) {
            item.name = stringValue;
          } else if (header.includes("description") || header.includes("desc")) {
            item.description = stringValue;
          }
        } else if (header.includes("price") || header.includes("cost") || header.includes("retail")) {
          item.price = parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;
        } else if (header.includes("quantity") || header.includes("qty") || header.includes("stock") || header.includes("count")) {
          item.quantity = parseInt(String(value)) || 0;
        } else if (header.includes("category") || header.includes("type") || header.includes("class")) {
          item.category = matchCategory(stringValue);
        } else if (header.includes("barcode") || header.includes("sku") || header.includes("upc") || header.includes("code")) {
          item.barcode = stringValue;
        }
      });

      if (item.name) {
        items.push(item);
      }
    }

    return items;
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const items = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      if (values.length < 2) continue;

      const item: any = {
        name: "",
        quantity: 0,
        category: "Other",
      };

      headers.forEach((header, index) => {
        const value = values[index];
        if (!value) return;

        if (header.includes("name") || header.includes("item") || header.includes("product")) {
          item.name = value;
        } else if (header.includes("price") || header.includes("cost")) {
          item.price = parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
        } else if (header.includes("quantity") || header.includes("qty") || header.includes("stock")) {
          item.quantity = parseInt(value) || 0;
        } else if (header.includes("category") || header.includes("type")) {
          item.category = matchCategory(value);
        } else if (header.includes("description") || header.includes("desc")) {
          item.description = value;
        } else if (header.includes("barcode") || header.includes("sku") || header.includes("upc")) {
          item.barcode = value;
        }
      });

      if (item.name) {
        items.push(item);
      }
    }

    return items;
  };

  const autoMergeAndImport = async (parsedItems: any[]) => {
    let successCount = 0;
    let mergedCount = 0;

    for (const newItem of parsedItems) {
      const normalizedName = newItem.name.toLowerCase().trim();

      // Find existing item with same name
      const existingItem = items.find(
        (item) => item.name.toLowerCase().trim() === normalizedName
      );

      if (existingItem) {
        // Merge: Update existing item
        const updates: any = {};

        // Update price if provided
        if (newItem.price) {
          updates.price = newItem.price;
        }

        // Update barcode if provided
        if (newItem.barcode && !existingItem.barcode) {
          updates.barcode = newItem.barcode;
        }

        // Update description if provided
        if (newItem.description && !existingItem.description) {
          updates.description = newItem.description;
        }

        // Handle quantity based on resetQuantities checkbox
        if (resetQuantities) {
          updates.quantity = 0;
        }

        // Update category if better match
        if (newItem.category && newItem.category !== "Other") {
          updates.category = newItem.category;
        }

        await updateItem(existingItem.id, updates);
        mergedCount++;
      } else {
        // New item: Add to inventory
        const itemToAdd = {
          ...newItem,
          quantity: resetQuantities ? 0 : (newItem.quantity || 0),
          supplier: supplierName, // Add supplier field
        };
        await addItems([itemToAdd]);
        successCount++;
      }
    }

    return { successCount, mergedCount };
  };

  const handleImport = async () => {
    // First, ask for supplier name
    if (!supplierName.trim()) {
      setShowSupplierPrompt(true);
      return;
    }

    try {
      setImporting(true);
      setImportResult(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setImporting(false);
        return;
      }

      const file = result.assets[0];

      // Add a small delay to let the UI update
      setProcessingMessage("Reading file...");
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Parse Excel or CSV
      setProcessingMessage("Parsing data...");
      const parsedItems = await parseExcelOrCSV(file.uri, file.mimeType);

      if (parsedItems.length === 0) {
        Alert.alert("No Items Found", "Could not find any valid items in the file. Make sure your file has columns like: Name, Price, Quantity, Category");
        setImporting(false);
        setProcessingMessage("");
        return;
      }

      // Show alert if importing many items
      if (parsedItems.length > 100) {
        setImporting(false);
        setProcessingMessage("");
        Alert.alert(
          "Large Import",
          `You are about to import ${parsedItems.length} items. This may take a moment. Duplicates will be auto-merged.`,
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Continue",
              onPress: async () => {
                setImporting(true);
                setProcessingMessage("Auto-merging and importing...");
                const { successCount, mergedCount } = await autoMergeAndImport(parsedItems);

                // Run final cleanup to catch any remaining duplicates
                setProcessingMessage("Final cleanup...");
                await autoMergeAllDuplicates();

                setImportResult({ success: successCount, failed: 0, merged: mergedCount });
                setImporting(false);
                setProcessingMessage("");
              },
            },
          ]
        );
      } else {
        // Auto-merge and import
        setProcessingMessage("Auto-merging and importing...");
        const { successCount, mergedCount } = await autoMergeAndImport(parsedItems);

        // Run final cleanup to catch any remaining duplicates
        setProcessingMessage("Final cleanup...");
        await autoMergeAllDuplicates();

        setImportResult({ success: successCount, failed: 0, merged: mergedCount });
        setImporting(false);
        setProcessingMessage("");
      }
    } catch (error) {
      console.error("Import error:", error);
      Alert.alert("Import Failed", "There was an error importing your file. Please make sure it is a valid CSV or Excel file.");
      setImporting(false);
      setProcessingMessage("");
    }
  };

  return (
    <View className="flex-1 bg-neutral-50">
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable onPress={() => safeGoBack(navigation)}>
            <Ionicons name="arrow-back" size={28} color="#1F2937" />
          </Pressable>
          <Text className="text-xl font-bold text-neutral-900">Import Items</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn} className="pb-6">
            {/* Current Inventory Stats */}
            <View className="bg-white rounded-2xl p-6 mb-6" style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <Text className="text-base font-semibold text-neutral-700 mb-2">
                Current Inventory
              </Text>
              <Text className="text-4xl font-bold text-indigo-600">
                {items.length}
              </Text>
              <Text className="text-sm text-neutral-500 mt-1">items in database</Text>
            </View>

            {/* Import Success Message */}
            {importResult && (
              <Animated.View entering={FadeInDown.springify()}>
                <View className="bg-emerald-50 rounded-2xl p-6 mb-6 border-2 border-emerald-200">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                    <Text className="text-xl font-bold text-emerald-900 ml-3">
                      Import Successful!
                    </Text>
                  </View>
                  <Text className="text-base text-emerald-700">
                    {importResult.success} new items added
                  </Text>
                  {importResult.merged > 0 && (
                    <Text className="text-base text-emerald-700">
                      {importResult.merged} items merged with existing
                    </Text>
                  )}
                </View>
              </Animated.View>
            )}

            {/* Supplier Name Input - Required */}
            <View className="bg-white rounded-2xl p-4 mb-4" style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
              borderWidth: showSupplierPrompt && !supplierName ? 2 : 0,
              borderColor: "#EF4444",
            }}>
              <Text className="text-base font-semibold text-neutral-900 mb-2">
                Supplier Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-neutral-50 rounded-xl px-4 py-3 text-base text-neutral-900"
                placeholder="e.g., SnapAV, Adorama, B&H Photo, etc."
                placeholderTextColor="#9CA3AF"
                value={supplierName}
                onChangeText={(text) => {
                  setSupplierName(text);
                  setShowSupplierPrompt(false);
                }}
              />
              {showSupplierPrompt && !supplierName && (
                <Text className="text-sm text-red-500 mt-2">
                  Please enter a supplier name before importing
                </Text>
              )}
              {supplierName && (
                <Text className="text-sm text-neutral-500 mt-2">
                  Items will be tagged with &quot;{supplierName}&quot; for easy filtering
                </Text>
              )}
            </View>

            {/* Reset Quantities Checkbox */}
            <Pressable
              onPress={() => setResetQuantities(!resetQuantities)}
              className="bg-white rounded-2xl p-4 mb-4 flex-row items-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Ionicons
                name={resetQuantities ? "checkbox" : "square-outline"}
                size={28}
                color={resetQuantities ? "#4F46E5" : "#9CA3AF"}
              />
              <View className="flex-1 ml-3">
                <Text className="text-base font-semibold text-neutral-900">
                  Reset all quantities to 0
                </Text>
                <Text className="text-sm text-neutral-500 mt-1">
                  Recommended for price lists. Uncheck to use quantities from file.
                </Text>
              </View>
            </Pressable>

            {/* Import Button */}
            <Pressable
              onPress={handleImport}
              disabled={importing}
              className="bg-indigo-600 rounded-2xl p-6 mb-6 items-center"
              style={{
                shadowColor: "#4F46E5",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
                opacity: importing ? 0.6 : 1,
              }}
            >
              <Ionicons name="cloud-upload" size={48} color="white" />
              <Text className="text-white text-xl font-bold mt-3">
                {importing ? processingMessage || "Importing..." : "Select File"}
              </Text>
              <Text className="text-white/80 text-sm mt-1">
                {importing ? "Please wait..." : "CSV or Excel (.xls, .xlsx)"}
              </Text>
            </Pressable>

            {/* Instructions */}
            <View className="bg-white rounded-2xl p-6" style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View className="flex-row items-center mb-4">
                <Ionicons name="information-circle" size={24} color="#4F46E5" />
                <Text className="text-lg font-bold text-neutral-900 ml-2">
                  How to Import
                </Text>
              </View>

              <View className="space-y-3">
                <View className="flex-row">
                  <Text className="text-indigo-600 font-bold mr-2">1.</Text>
                  <Text className="flex-1 text-neutral-700">
                    Prepare your file (CSV or Excel) with columns: Name, Price, Quantity, Category
                  </Text>
                </View>

                <View className="flex-row">
                  <Text className="text-indigo-600 font-bold mr-2">2.</Text>
                  <Text className="flex-1 text-neutral-700">
                    Make sure the first row contains column headers
                  </Text>
                </View>

                <View className="flex-row">
                  <Text className="text-indigo-600 font-bold mr-2">3.</Text>
                  <Text className="flex-1 text-neutral-700">
                    Tap &quot;Select File&quot; and choose your file
                  </Text>
                </View>

                <View className="flex-row">
                  <Text className="text-indigo-600 font-bold mr-2">4.</Text>
                  <Text className="flex-1 text-neutral-700">
                    Items will be automatically imported to your inventory
                  </Text>
                </View>
              </View>

              <View className="mt-6 pt-6 border-t border-neutral-200">
                <Text className="text-sm font-semibold text-neutral-700 mb-2">
                  Supported Column Names:
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {["Name", "Price", "Quantity", "Category", "Description", "Barcode"].map((col) => (
                    <View key={col} className="bg-neutral-100 rounded-full px-3 py-1">
                      <Text className="text-xs font-medium text-neutral-600">{col}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
