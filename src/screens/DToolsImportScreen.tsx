import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from "expo-document-picker";
import { useInventoryStore } from "../state/inventoryStore";
import { useTimeTrackerStore } from "../state/timeTrackerStore";
import { parseDToolsFile, DToolsImportResult } from "../services/dtoolsParser";
import { safeGoBack } from "../utils/navigation";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function DToolsImportScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DToolsImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("");

  const addItems = useInventoryStore((s) => s.addItems);
  const addProject = useTimeTrackerStore((s) => s.addProject);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setSelectedFile(file.name);

      // Check if it's a PDF
      if (file.mimeType === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        Alert.alert(
          "PDF Not Supported",
          "D-Tools PDF files are not yet supported. Please export as Excel (.xlsx) or CSV from D-Tools instead."
        );
        return;
      }

      setLoading(true);
      setResult(null);

      try {
        const importResult = await parseDToolsFile(file.uri);
        setResult(importResult);

        if (importResult.errors.length > 0 && importResult.items.length === 0) {
          Alert.alert(
            "Import Failed",
            `Could not parse D-Tools file:\n\n${importResult.errors.slice(0, 3).join("\n")}`
          );
        }
      } catch (error) {
        Alert.alert(
          "Error",
          error instanceof Error ? error.message : "Failed to parse file"
        );
      } finally {
        setLoading(false);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to select file"
      );
    }
  };

  const handleImport = () => {
    if (!result) return;

    Alert.alert(
      "Import D-Tools Data",
      `Import:\n• ${result.items.length} inventory items\n• ${result.projects.length} projects\n\nContinue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import",
          onPress: () => {
            // Import items
            addItems(result.items);

            // Import projects
            result.projects.forEach((project) => {
              addProject(project);
            });

            Alert.alert(
              "Success!",
              `Imported:\n✅ ${result.items.length} items\n✅ ${result.projects.length} projects`,
              [{ text: "OK", onPress: () => safeGoBack(navigation) }]
            );
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
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable
            onPress={() => safeGoBack(navigation)}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <Text className="text-white text-xl font-semibold">
            D-Tools Import
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
                  Import from D-Tools
                </Text>
                <Text className="text-white/90 text-sm leading-5 mb-2">
                  Import Bill of Materials (BOM) exports from D-Tools System Integrator (SI).
                </Text>
                <Text className="text-white/80 text-xs leading-4">
                  • Supports CSV and Excel (.xlsx, .xls) formats{"\n"}
                  • Automatically creates projects from locations/rooms{"\n"}
                  • Maps D-Tools categories to inventory categories{"\n"}
                  • Imports quantities, pricing, and descriptions
                </Text>
              </View>
            </View>
          </View>

          {/* File Selection */}
          <View className="bg-white/20 rounded-2xl p-4 mb-4">
            <Text className="text-white text-sm font-semibold mb-3">
              Step 1: Select D-Tools Export File
            </Text>
            <Pressable
              onPress={handlePickFile}
              className="bg-white rounded-xl px-4 py-4 flex-row items-center justify-center"
            >
              <Ionicons name="document-attach" size={24} color="#8b5cf6" />
              <Text className="text-purple-600 font-semibold ml-2">
                Choose File
              </Text>
            </Pressable>
            {selectedFile && (
              <View className="mt-3 flex-row items-center">
                <Ionicons name="document" size={16} color="white" />
                <Text className="text-white/90 text-sm ml-2" numberOfLines={1}>
                  {selectedFile}
                </Text>
              </View>
            )}
          </View>

          {/* Loading */}
          {loading && (
            <View className="bg-white/20 rounded-2xl p-6 items-center mb-4">
              <ActivityIndicator size="large" color="white" />
              <Text className="text-white text-base font-semibold mt-4">
                Parsing D-Tools file...
              </Text>
            </View>
          )}

          {/* Results */}
          {result && !loading && (
            <>
              <View className="bg-white/20 rounded-2xl p-4 mb-4">
                <Text className="text-white text-sm font-semibold mb-3">
                  Step 2: Review Import
                </Text>
                <View className="space-y-2">
                  <View className="flex-row items-center justify-between py-2">
                    <View className="flex-row items-center">
                      <Ionicons name="cube" size={20} color="white" />
                      <Text className="text-white/90 text-base ml-2">
                        Inventory Items
                      </Text>
                    </View>
                    <Text className="text-white font-bold text-lg">
                      {result.items.length}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between py-2">
                    <View className="flex-row items-center">
                      <Ionicons name="briefcase" size={20} color="white" />
                      <Text className="text-white/90 text-base ml-2">
                        Projects
                      </Text>
                    </View>
                    <Text className="text-white font-bold text-lg">
                      {result.projects.length}
                    </Text>
                  </View>
                  {result.errors.length > 0 && (
                    <View className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center">
                        <Ionicons name="warning" size={20} color="#FCD34D" />
                        <Text className="text-amber-200 text-base ml-2">
                          Warnings
                        </Text>
                      </View>
                      <Text className="text-amber-200 font-bold text-lg">
                        {result.errors.length}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Errors/Warnings */}
              {result.errors.length > 0 && (
                <View className="bg-amber-100/20 rounded-2xl p-4 mb-4">
                  <Text className="text-amber-200 text-sm font-semibold mb-2">
                    Warnings ({result.errors.length})
                  </Text>
                  <ScrollView className="max-h-32">
                    {result.errors.slice(0, 10).map((error, index) => (
                      <Text key={index} className="text-amber-100 text-xs mb-1">
                        • {error}
                      </Text>
                    ))}
                    {result.errors.length > 10 && (
                      <Text className="text-amber-100 text-xs italic mt-1">
                        ...and {result.errors.length - 10} more
                      </Text>
                    )}
                  </ScrollView>
                </View>
              )}

              {/* Import Button */}
              {result.items.length > 0 && (
                <Pressable
                  onPress={handleImport}
                  className="bg-white rounded-2xl p-4 items-center"
                >
                  <Ionicons name="cloud-download" size={32} color="#8b5cf6" />
                  <Text className="text-purple-600 text-lg font-semibold mt-2">
                    Import to Inventory
                  </Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    Add {result.items.length} items and {result.projects.length} projects
                  </Text>
                </Pressable>
              )}
            </>
          )}

          {/* Sample Format */}
          <View className="bg-white/10 rounded-2xl p-4 mt-4">
            <Text className="text-white text-sm font-semibold mb-2">
              Expected D-Tools Format
            </Text>
            <Text className="text-white/70 text-xs leading-5">
              Your D-Tools export should include these columns:{"\n"}
              • Item/Product Name{"\n"}
              • Quantity{"\n"}
              • Category (optional){"\n"}
              • Unit Price (optional){"\n"}
              • Location/Room (for project creation){"\n"}
              • Manufacturer, Model (optional)
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
