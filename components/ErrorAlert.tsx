import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export function ErrorAlert({
  message,
  onClose,
  duration = 100, // 20 seconds
}: {
  message: string;
  onClose?: () => void;
  duration?: number;
}) {
  const slideAnim = useRef(new Animated.Value(100)).current; // Start off-screen

  useEffect(() => {
    // Slide in
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss after duration
    if (onClose) {
      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onClose());
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, onClose, duration, slideAnim]);

  if (!message) return null;
  return (
    <Animated.View
      style={[
        styles.toast,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <Ionicons
        name="alert-circle"
        size={20}
        color="#DC2626"
        style={styles.icon}
      />
      <Text style={styles.text}>{message}</Text>
      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={18} color="#64748B" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 150,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 9999,
    minWidth: width * 0.7,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    flex: 1,
    color: "#991B1B",
    fontSize: 14,
    fontWeight: "500",
  },
  closeBtn: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 8,
    backgroundColor: "#FFF",
  },
});
