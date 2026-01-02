import React from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DockRoute = "home" | "profile" | "help" | "settings";

type Props = {
  active: DockRoute;
  onNavigate: (route: DockRoute) => void;
};

const { width: SCREEN_W } = Dimensions.get("window");
const ISLAND_W = Math.min(SCREEN_W - 18, 620); // almost full width

const ROUTES: { key: DockRoute; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "home", icon: "home-outline" },
  { key: "profile", icon: "person-outline" },
  { key: "help", icon: "help-circle-outline" },
  { key: "settings", icon: "settings-outline" },
];

export function IslandDock({ active, onNavigate }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(10, insets.bottom + 10) }]}
    >
      <View style={styles.shellShadow}>
        <View style={styles.shell}>
          {/* subtle top highlight like iOS */}
          <View style={styles.shellHighlight} />

          <View style={styles.row}>
            {ROUTES.map((r) => {
              const isActive = r.key === active;

              return (
                <Pressable
                  key={r.key}
                  onPress={() => onNavigate(r.key)}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.item,
                    pressed && styles.itemPressed,
                    isActive && styles.itemActive,
                  ]}
                >
                  <Ionicons
                    name={r.icon}
                    size={22}
                    color={isActive ? "#0F172A" : "#64748B"}
                  />

                  {/* tiny indicator */}
                  <View
                    style={[
                      styles.dot,
                      isActive ? styles.dotOn : styles.dotOff,
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },

  // soft floating shadow
  shellShadow: {
    width: ISLAND_W,
    borderRadius: 26,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 16,
  },

  // “glass / premium” but consistent with your app (white + borders)
  shell: {
    width: "100%",
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  shellHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.95)",
  },

  row: {
    height: 66,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    // subtle inner surface, fits your palette
    backgroundColor: "#F8FAFC",
  },

  item: {
    flex: 1,
    height: 52,
    marginHorizontal: 6,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  itemActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  itemPressed: {
    opacity: Platform.OS === "ios" ? 0.9 : 0.95,
    transform: [{ scale: 0.99 }],
  },

  dot: {
    position: "absolute",
    bottom: 8,
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  dotOn: { backgroundColor: "#0F172A" },
  dotOff: { backgroundColor: "transparent" },
});
