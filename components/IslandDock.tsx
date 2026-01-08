import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";

type NavItem = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: "home", icon: "home-outline", route: "/" },
  { key: "properties", icon: "business-outline", route: "/property" }, // replaced "help"
  { key: "settings", icon: "settings-outline", route: "/settings" },
  { key: "profile", icon: "person-outline", route: "/profile" },
];

export function BottomIslandNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.wrap}>
      <View style={styles.island}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.route;

          return (
            <Pressable
              key={item.key}
              onPress={() => router.push(item.route)}
              style={[styles.iconBtn, active && styles.iconBtnActive]}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={active ? "#111" : "#9CA3AF"}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "box-none",
  },

  island: {
    width: "92%",
    height: 64,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#EEF2F7",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },

    elevation: 8,
  },

  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  iconBtnActive: {
    backgroundColor: "#F3F4F6",
  },
});
