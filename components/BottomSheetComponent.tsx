import React, { forwardRef, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

type BottomSheetComponentProps = {
  title?: string;
  children?: React.ReactNode;
  snapPoints?: (string | number)[];
};

const BottomSheetComponent = forwardRef<BottomSheet, BottomSheetComponentProps>(
  ({ title, children, snapPoints = ["25%", "50%", "90%"] }, ref) => {
    // Create a local ref to call close() if ref is not provided
    const localRef = useRef<BottomSheet>(null);
    const sheetRef = (ref as React.RefObject<BottomSheet>) || localRef;

    const handleClose = () => {
      sheetRef.current?.close();
    };

    return (
      <GestureHandlerRootView style={styles.container}>
        {/* Overlay to detect outside clicks */}

        <BottomSheet ref={sheetRef} index={-1} snapPoints={snapPoints}>
          <BottomSheetView style={styles.contentContainer}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeIcon}
                accessibilityLabel="Close bottom sheet"
              >
                <Ionicons name="close" size={24} color="#11181C" />
              </TouchableOpacity>
            </View>
            {children}
          </BottomSheetView>
        </BottomSheet>
      </GestureHandlerRootView>
    );
  }
);

BottomSheetComponent.displayName = "BottomSheetComponent";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  contentContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  header: {
    position: "absolute",
    top: -10,
    right: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
  },
  closeIcon: {
    marginLeft: 12,
    padding: 4,
  },
});

export default BottomSheetComponent;
