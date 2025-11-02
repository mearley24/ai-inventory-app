import React from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTimeTrackerStore } from "../state/timeTrackerStore";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

const PROJECT_COLORS = [
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899",
];

export default function TimeTrackerScreen({ navigation }: any) {
  const [showAddProject, setShowAddProject] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState("");
  const [elapsedTime, setElapsedTime] = React.useState(0);

  const projects = useTimeTrackerStore((s) => s.projects);
  const activeTimer = useTimeTrackerStore((s) => s.activeTimer);
  const startTimer = useTimeTrackerStore((s) => s.startTimer);
  const stopTimer = useTimeTrackerStore((s) => s.stopTimer);
  const addProject = useTimeTrackerStore((s) => s.addProject);
  const deleteProject = useTimeTrackerStore((s) => s.deleteProject);

  // Update elapsed time for active timer
  React.useEffect(() => {
    if (!activeTimer) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - activeTimer.startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      addProject({
        name: newProjectName.trim(),
        color: PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)],
      });
      setNewProjectName("");
      setShowAddProject(false);
    }
  };

  const activeProject = projects.find((p) => p.id === activeTimer?.projectId);

  return (
    <View className="flex-1 bg-neutral-50">
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-3">
          <Text className="text-3xl font-bold text-neutral-900 mb-1">Time Tracker</Text>
          <Text className="text-base text-neutral-500">{projects.length} projects</Text>
        </View>

        {/* Active Timer Card */}
        {activeTimer && activeProject ? (
          <View className="mx-6 mb-6">
            <LinearGradient
              colors={["#4F46E5", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 24,
                padding: 24,
                shadowColor: "#4F46E5",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: "#10B981" }}
                  />
                  <Text className="text-white/80 text-sm font-medium">TRACKING</Text>
                </View>
                <Pressable onPress={stopTimer}>
                  <View className="bg-white/20 rounded-full px-4 py-2">
                    <Text className="text-white font-semibold">Stop</Text>
                  </View>
                </Pressable>
              </View>

              <Text className="text-white text-2xl font-bold mb-2">
                {activeProject.name}
              </Text>

              <Text className="text-white text-5xl font-bold" style={{ fontVariant: ["tabular-nums"] }}>
                {formatTime(elapsedTime)}
              </Text>
            </LinearGradient>
          </View>
        ) : (
          <View className="mx-6 mb-6 bg-neutral-100 rounded-2xl p-6 items-center">
            <Ionicons name="timer-outline" size={48} color="#9CA3AF" />
            <Text className="text-neutral-500 mt-2">No active timer</Text>
          </View>
        )}

        {/* Projects List */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between px-6 mb-4">
            <Text className="text-xl font-bold text-neutral-900">Projects</Text>
            <Pressable onPress={() => setShowAddProject(true)}>
              <Ionicons name="add-circle" size={28} color="#4F46E5" />
            </Pressable>
          </View>

          {showAddProject && (
            <Animated.View
              entering={FadeInDown.springify()}
              className="mx-6 mb-4 bg-white rounded-2xl p-4"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <TextInput
                className="text-base text-neutral-900 mb-3"
                placeholder="Project name"
                placeholderTextColor="#9CA3AF"
                value={newProjectName}
                onChangeText={setNewProjectName}
                autoFocus
              />
              <View className="flex-row gap-2">
                <Pressable
                  onPress={handleAddProject}
                  className="flex-1 bg-indigo-600 rounded-xl py-2 items-center"
                >
                  <Text className="text-white font-semibold">Add</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowAddProject(false);
                    setNewProjectName("");
                  }}
                  className="flex-1 bg-neutral-100 rounded-xl py-2 items-center"
                >
                  <Text className="text-neutral-700 font-semibold">Cancel</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
            {projects.length === 0 ? (
              <View className="items-center justify-center py-20">
                <Ionicons name="folder-outline" size={64} color="#D1D5DB" />
                <Text className="text-lg font-medium text-neutral-400 mt-4">
                  No projects yet
                </Text>
                <Text className="text-sm text-neutral-400 mt-1">
                  Create a project to start tracking time
                </Text>
              </View>
            ) : (
              projects.map((project, index) => {
                const isActive = activeTimer?.projectId === project.id;
                return (
                  <Animated.View
                    key={project.id}
                    entering={FadeInDown.delay(index * 50).springify()}
                  >
                    <Pressable
                      onPress={() => {
                        if (isActive) {
                          stopTimer();
                        } else {
                          startTimer(project.id);
                        }
                      }}
                      className={`bg-white rounded-2xl p-4 mb-3 ${
                        isActive ? "border-2 border-indigo-500" : ""
                      }`}
                      style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.06,
                        shadowRadius: 8,
                        elevation: 2,
                      }}
                    >
                      <View className="flex-row items-center">
                        {/* Color Indicator */}
                        <View
                          className="w-12 h-12 rounded-full items-center justify-center mr-4"
                          style={{ backgroundColor: project.color + "20" }}
                        >
                          <Ionicons
                            name={isActive ? "pause" : "play"}
                            size={20}
                            color={project.color}
                          />
                        </View>

                        {/* Content */}
                        <View className="flex-1">
                          <Text className="text-lg font-semibold text-neutral-900 mb-1">
                            {project.name}
                          </Text>
                          <Text className="text-base text-neutral-500" style={{ fontVariant: ["tabular-nums"] }}>
                            {formatTime(project.totalTime + (isActive ? elapsedTime : 0))}
                          </Text>
                        </View>

                        {/* Delete Button */}
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            deleteProject(project.id);
                          }}
                          className="w-10 h-10 items-center justify-center"
                        >
                          <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </Pressable>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })
            )}
            <View className="h-20" />
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}
