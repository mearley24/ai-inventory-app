import React from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../state/authStore";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function RegisterScreen({ navigation }: any) {
  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const signUp = useAuthStore((s) => s.signUp);

  const handleRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password.trim() || !companyName.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      await signUp(email.trim(), password, displayName.trim(), companyName.trim());
      // Navigation will be handled by App.tsx based on auth state
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Unable to create account");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView edges={["top"]} className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="px-6 pt-4 pb-6">
            <Pressable onPress={() => navigation.goBack()} className="mb-4">
              <Ionicons name="arrow-back" size={28} color="#1F2937" />
            </Pressable>

            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <Text className="text-4xl font-bold text-neutral-900 mb-2">
                Create Account
              </Text>
              <Text className="text-lg text-neutral-500">
                Set up your company inventory system
              </Text>
            </Animated.View>
          </View>

          {/* Form */}
          <View className="flex-1 px-6">
            <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-4">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">Your Name</Text>
              <View className="bg-white rounded-xl flex-row items-center px-4 py-3 shadow-sm">
                <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-neutral-900"
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(250).springify()} className="mb-4">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">Company Name</Text>
              <View className="bg-white rounded-xl flex-row items-center px-4 py-3 shadow-sm">
                <Ionicons name="business-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-neutral-900"
                  placeholder="Your Company"
                  placeholderTextColor="#9CA3AF"
                  value={companyName}
                  onChangeText={setCompanyName}
                  autoCapitalize="words"
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-4">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">Email</Text>
              <View className="bg-white rounded-xl flex-row items-center px-4 py-3 shadow-sm">
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-neutral-900"
                  placeholder="your@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(350).springify()} className="mb-4">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">Password</Text>
              <View className="bg-white rounded-xl flex-row items-center px-4 py-3 shadow-sm">
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-neutral-900"
                  placeholder="At least 6 characters"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#9CA3AF"
                  />
                </Pressable>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).springify()} className="mb-6">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">Confirm Password</Text>
              <View className="bg-white rounded-xl flex-row items-center px-4 py-3 shadow-sm">
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-neutral-900"
                  placeholder="Re-enter password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(450).springify()} className="mb-6">
              <Pressable
                onPress={handleRegister}
                disabled={loading}
                className="rounded-xl overflow-hidden"
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                <LinearGradient
                  colors={["#4F46E5", "#7C3AED"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: 16,
                    alignItems: "center",
                    shadowColor: "#4F46E5",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                >
                  <Text className="text-white text-lg font-bold">
                    {loading ? "Creating Account..." : "Create Account"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500).springify()}>
              <View className="flex-row items-center justify-center">
                <Text className="text-neutral-500">Already have an account? </Text>
                <Pressable onPress={() => navigation.goBack()}>
                  <Text className="text-indigo-600 font-semibold">Sign In</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>

          <View className="h-6" />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
