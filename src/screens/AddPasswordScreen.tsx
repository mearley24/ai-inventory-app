import React from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePasswordVaultStore } from "../state/passwordVaultStore";
import { useAuthStore } from "../state/authStore";
import { PasswordCategory } from "../types/password";
import { generateSecurePassword } from "../utils/encryption";
import Animated, { FadeIn } from "react-native-reanimated";

const CATEGORIES: PasswordCategory[] = [
  "Client System",
  "Network",
  "Control4",
  "Security System",
  "Audio/Video",
  "Smart Home",
  "Cloud Service",
  "Admin",
  "Other",
];

export default function AddPasswordScreen({ navigation }: any) {
  const [title, setTitle] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [website, setWebsite] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [category, setCategory] = React.useState<PasswordCategory>("Client System");
  const [saving, setSaving] = React.useState(false);

  const addPassword = usePasswordVaultStore((s) => s.addPassword);
  const user = useAuthStore((s) => s.user);
  const company = useAuthStore((s) => s.company);

  const handleGeneratePassword = () => {
    const generated = generateSecurePassword(16);
    setPassword(generated);
    setShowPassword(true);
    Alert.alert("Password Generated", "A secure password has been generated for you");
  };

  const handleSave = async () => {
    if (!title.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter at least a title and password");
      return;
    }

    if (!user || !company) {
      Alert.alert("Error", "You must be logged in to add passwords");
      return;
    }

    try {
      setSaving(true);
      await addPassword({
        companyId: company.id,
        title: title.trim(),
        username: username.trim() || undefined,
        plainPassword: password,
        website: website.trim() || undefined,
        notes: notes.trim() || undefined,
        category,
        tags: [],
        createdBy: user.uid,
        sharedWith: [],
        allowedRoles: [user.role],
      });

      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save password");
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#1F2937" />
          </Pressable>
          <Text className="text-xl font-bold text-neutral-900">Add Password</Text>
          <Pressable onPress={handleSave} disabled={saving}>
            <Text className="text-lg font-semibold text-indigo-600">
              {saving ? "Saving..." : "Save"}
            </Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn} className="pb-6">
            {/* Security Notice */}
            <View className="bg-indigo-50 rounded-2xl p-4 mb-6 flex-row">
              <Ionicons name="shield-checkmark" size={24} color="#4F46E5" />
              <View className="flex-1 ml-3">
                <Text className="text-indigo-900 font-semibold mb-1">Encrypted & Secure</Text>
                <Text className="text-indigo-700 text-sm">
                  Passwords are encrypted and can be shared without revealing them
                </Text>
              </View>
            </View>

            {/* Title */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">
                Title *
              </Text>
              <TextInput
                className="bg-white rounded-xl px-4 py-3 text-base text-neutral-900"
                placeholder="e.g., Client Router Login"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
            </View>

            {/* Category */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">
                Category
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      className={`px-4 py-2 rounded-full ${
                        category === cat ? "bg-indigo-600" : "bg-white"
                      }`}
                      style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
                    >
                      <Text
                        className={`font-medium text-sm ${
                          category === cat ? "text-white" : "text-neutral-700"
                        }`}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Username */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">
                Username / Email
              </Text>
              <TextInput
                className="bg-white rounded-xl px-4 py-3 text-base text-neutral-900"
                placeholder="username or email"
                placeholderTextColor="#9CA3AF"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
            </View>

            {/* Password */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">
                Password *
              </Text>
              <View className="flex-row gap-2 mb-2">
                <View className="flex-1 bg-white rounded-xl flex-row items-center px-4 py-3 shadow-sm">
                  <TextInput
                    className="flex-1 text-base text-neutral-900"
                    placeholder="Enter password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </Pressable>
                </View>
                <Pressable
                  onPress={handleGeneratePassword}
                  className="bg-indigo-600 rounded-xl px-4 items-center justify-center"
                  style={{
                    shadowColor: "#4F46E5",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Ionicons name="key" size={20} color="white" />
                </Pressable>
              </View>
            </View>

            {/* Website */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">
                Website / URL
              </Text>
              <TextInput
                className="bg-white rounded-xl px-4 py-3 text-base text-neutral-900"
                placeholder="https://example.com"
                placeholderTextColor="#9CA3AF"
                value={website}
                onChangeText={setWebsite}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
            </View>

            {/* Notes */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">
                Notes
              </Text>
              <TextInput
                className="bg-white rounded-xl px-4 py-3 text-base text-neutral-900"
                placeholder="Additional notes or instructions..."
                placeholderTextColor="#9CA3AF"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                  minHeight: 100,
                }}
              />
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
