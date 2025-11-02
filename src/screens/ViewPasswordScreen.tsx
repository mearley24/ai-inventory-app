import React from "react";
import { View, Text, Pressable, ScrollView, Alert, Clipboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePasswordVaultStore } from "../state/passwordVaultStore";
import { PasswordEntry } from "../types/password";
import { safeGoBack } from "../utils/navigation";
import Animated, { FadeIn } from "react-native-reanimated";

export default function ViewPasswordScreen({ navigation, route }: any) {
  const { password } = route.params as { password: PasswordEntry };
  const [showPassword, setShowPassword] = React.useState(false);
  const [revealedPassword, setRevealedPassword] = React.useState<string>("");

  const getPassword = usePasswordVaultStore((s) => s.getPassword);
  const deletePassword = usePasswordVaultStore((s) => s.deletePassword);

  const handleRevealPassword = async () => {
    if (!showPassword) {
      const decrypted = await getPassword(password.id);
      if (decrypted) {
        setRevealedPassword(decrypted);
        setShowPassword(true);
      } else {
        Alert.alert("Error", "Failed to decrypt password");
      }
    } else {
      setShowPassword(false);
      setRevealedPassword("");
    }
  };

  const handleCopyPassword = async () => {
    const decrypted = await getPassword(password.id);
    if (decrypted) {
      Clipboard.setString(decrypted);
      Alert.alert("Copied", "Password copied to clipboard");
    } else {
      Alert.alert("Error", "Failed to decrypt password");
    }
  };

  const handleCopyUsername = () => {
    if (password.username) {
      Clipboard.setString(password.username);
      Alert.alert("Copied", "Username copied to clipboard");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Password",
      `Are you sure you want to delete "${password.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deletePassword(password.id);
            safeGoBack(navigation);
          },
        },
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Client System":
        return "desktop";
      case "Network":
        return "wifi";
      case "Control4":
        return "home";
      case "Security System":
        return "shield-checkmark";
      case "Audio/Video":
        return "musical-notes";
      case "Smart Home":
        return "bulb";
      case "Cloud Service":
        return "cloud";
      case "Admin":
        return "key";
      default:
        return "lock-closed";
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-neutral-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable onPress={() => safeGoBack(navigation)}>
          <Ionicons name="arrow-back" size={28} color="#1F2937" />
        </Pressable>
        <Text className="text-xl font-bold text-neutral-900">Password Details</Text>
        <Pressable onPress={handleDelete}>
          <Ionicons name="trash" size={24} color="#EF4444" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn} className="pb-6">
          {/* Icon and Title */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-full bg-indigo-100 items-center justify-center mb-4">
              <Ionicons name={getCategoryIcon(password.category)} size={40} color="#4F46E5" />
            </View>
            <Text className="text-2xl font-bold text-neutral-900 text-center">
              {password.title}
            </Text>
            <View className="bg-neutral-100 rounded-full px-3 py-1 mt-2">
              <Text className="text-sm font-medium text-neutral-600">{password.category}</Text>
            </View>
          </View>

          {/* Username */}
          {password.username && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">Username / Email</Text>
              <View className="bg-white rounded-xl p-4 flex-row items-center justify-between">
                <Text className="text-base text-neutral-900 flex-1">{password.username}</Text>
                <Pressable onPress={handleCopyUsername} className="ml-2">
                  <Ionicons name="copy-outline" size={20} color="#4F46E5" />
                </Pressable>
              </View>
            </View>
          )}

          {/* Password */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-neutral-700 mb-2">Password</Text>
            <View className="bg-white rounded-xl p-4 flex-row items-center justify-between">
              <Text className="text-base text-neutral-900 flex-1 font-mono">
                {showPassword ? revealedPassword : "••••••••••••"}
              </Text>
              <View className="flex-row gap-2">
                <Pressable onPress={handleRevealPassword}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#4F46E5"
                  />
                </Pressable>
                <Pressable onPress={handleCopyPassword}>
                  <Ionicons name="copy-outline" size={20} color="#4F46E5" />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Website */}
          {password.website && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">Website</Text>
              <View className="bg-white rounded-xl p-4">
                <Text className="text-base text-indigo-600">{password.website}</Text>
              </View>
            </View>
          )}

          {/* Notes */}
          {password.notes && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">Notes</Text>
              <View className="bg-white rounded-xl p-4">
                <Text className="text-base text-neutral-900">{password.notes}</Text>
              </View>
            </View>
          )}

          {/* Metadata */}
          <View className="bg-neutral-100 rounded-xl p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-neutral-600 ml-2">
                Created: {new Date(password.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View className="flex-row items-center mb-2">
              <Ionicons name="create-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-neutral-600 ml-2">
                Updated: {new Date(password.updatedAt).toLocaleDateString()}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="eye-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-neutral-600 ml-2">
                Accessed {password.accessCount} times
              </Text>
            </View>
          </View>

          {/* Security Notice */}
          <View className="bg-amber-50 rounded-xl p-4 flex-row">
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text className="text-sm text-amber-800 ml-2 flex-1">
              Never share your passwords via email or messaging. Use the secure sharing feature instead.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
