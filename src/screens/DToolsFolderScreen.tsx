import React, { useState, useEffect } from "react";
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
import {
  getDToolsFiles,
  scanAndProcessDToolsFiles,
  deleteDToolsFile,
  getProcessedFiles,
  clearProcessingHistory,
  DTOOLS_FOLDER_PATH,
} from "../services/dtoolsScanner";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function DToolsFolderScreen({ navigation }: Props) {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFiles();
    loadProcessedFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const dtoolsFiles = await getDToolsFiles();
      setFiles(dtoolsFiles);
    } catch (error) {
      console.error("Error loading files:", error);
      Alert.alert("Error", "Failed to load D-Tools files");
    } finally {
      setLoading(false);
    }
  };

  const loadProcessedFiles = async () => {
    try {
      const processed = await getProcessedFiles();
      setProcessedFiles(processed);
    } catch (error) {
      console.error("Error loading processed files:", error);
    }
  };

  const handleScanNow = async () => {
    setScanning(true);

    try {
      const results = await scanAndProcessDToolsFiles();

      if (results.filesProcessed === 0) {
        Alert.alert(
          "No New Files",
          "All files in the folder have already been processed"
        );
      } else {
        Alert.alert(
          "Scan Complete",
          `Files Processed: ${results.filesProcessed}\nItems Added: ${results.totalItemsAdded}\nProjects Created: ${results.totalProjectsCreated}`
        );
      }

      await loadFiles();
      await loadProcessedFiles();
    } catch (error) {
      console.error("Scan error:", error);
      Alert.alert(
        "Scan Error",
        error instanceof Error ? error.message : "Failed to scan D-Tools files"
      );
    } finally {
      setScanning(false);
    }
  };

  const handleDeleteFile = async (filename: string) => {
    Alert.alert(
      "Delete File",
      `Are you sure you want to delete ${filename}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDToolsFile(filename);
              await loadFiles();
              Alert.alert("Success", "File deleted");
            } catch (error) {
              Alert.alert("Error", "Failed to delete file");
            }
          },
        },
      ]
    );
  };

  const handleClearHistory = async () => {
    Alert.alert(
      "Clear Processing History",
      "This will mark all files as unprocessed. Next scan will re-import everything.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await clearProcessingHistory();
              await loadProcessedFiles();
              Alert.alert("Success", "Processing history cleared");
            } catch (error) {
              Alert.alert("Error", "Failed to clear history");
            }
          },
        },
      ]
    );
  };

  const handleShareFolderPath = async () => {
    Alert.alert(
      "D-Tools Folder Location",
      `Export your D-Tools BOMs (CSV/Excel format) and place them in this folder:\n\n${DTOOLS_FOLDER_PATH}\n\nThe app will automatically process any new files when you tap "Scan Now".`,
      [{ text: "OK" }]
    );
  };

  const pendingFiles = files.filter((f) => !processedFiles.has(f));
  const completedFiles = files.filter((f) => processedFiles.has(f));

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-neutral-50">
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#1F2937" />
          </Pressable>
          <Text className="text-2xl font-bold text-neutral-900">
            D-Tools Folder
          </Text>
          <Pressable onPress={handleShareFolderPath}>
            <Ionicons name="information-circle" size={28} color="#4F46E5" />
          </Pressable>
        </View>

        {/* Stats */}
        <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm text-neutral-500">Total Files</Text>
            <Text className="text-lg font-bold text-neutral-900">
              {files.length}
            </Text>
          </View>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm text-neutral-500">Processed</Text>
            <Text className="text-lg font-bold text-emerald-600">
              {completedFiles.length}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-neutral-500">Pending</Text>
            <Text className="text-lg font-bold text-amber-600">
              {pendingFiles.length}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mb-4">
          <Pressable
            onPress={handleScanNow}
            disabled={scanning || pendingFiles.length === 0}
            className={`flex-1 rounded-xl py-3 ${
              scanning || pendingFiles.length === 0
                ? "bg-neutral-300"
                : "bg-emerald-600"
            }`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center justify-center">
              {scanning ? (
                <ActivityIndicator color="white" />
              ) : (
                <Ionicons name="scan" size={20} color="white" />
              )}
              <Text className="text-white font-semibold ml-2">
                {scanning ? "Scanning..." : "Scan Now"}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleClearHistory}
            className="flex-1 bg-white rounded-xl py-3 border border-neutral-300"
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="refresh" size={20} color="#6B7280" />
              <Text className="text-neutral-700 font-semibold ml-2">
                Clear History
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Files List */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="text-neutral-500 mt-4">Loading files...</Text>
          </View>
        ) : files.length === 0 ? (
          <View className="items-center justify-center py-20 px-6">
            <Ionicons name="folder-open" size={64} color="#D1D5DB" />
            <Text className="text-lg font-medium text-neutral-400 mt-4">
              No D-Tools Files
            </Text>
            <Text className="text-sm text-neutral-400 mt-2 text-center">
              Export BOMs from D-Tools SI and add them to the folder
            </Text>
            <Pressable
              onPress={handleShareFolderPath}
              className="mt-4 bg-indigo-100 rounded-full px-4 py-2"
            >
              <Text className="text-indigo-700 font-medium">
                Show Folder Path
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Pending Files */}
            {pendingFiles.length > 0 && (
              <View className="mb-6">
                <Text className="text-sm font-semibold text-neutral-700 mb-3">
                  Pending ({pendingFiles.length})
                </Text>
                {pendingFiles.map((file) => (
                  <View
                    key={file}
                    className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <View className="flex-1 flex-row items-center">
                      <Ionicons name="document" size={24} color="#F59E0B" />
                      <Text
                        className="text-base text-neutral-900 ml-3 flex-1"
                        numberOfLines={1}
                      >
                        {file}
                      </Text>
                    </View>
                    <Pressable onPress={() => handleDeleteFile(file)}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Completed Files */}
            {completedFiles.length > 0 && (
              <View className="mb-6">
                <Text className="text-sm font-semibold text-neutral-700 mb-3">
                  Processed ({completedFiles.length})
                </Text>
                {completedFiles.map((file) => (
                  <View
                    key={file}
                    className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <View className="flex-1 flex-row items-center">
                      <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      <Text
                        className="text-base text-neutral-600 ml-3 flex-1"
                        numberOfLines={1}
                      >
                        {file}
                      </Text>
                    </View>
                    <Pressable onPress={() => handleDeleteFile(file)}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
