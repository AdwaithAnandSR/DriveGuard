import React from "react";
import { Text, TouchableOpacity, View, StyleSheet} from "react-native";
import { router } from "expo-router";

import { formatFileSize } from "../utils/file.ts";

export interface VideoItem {
    path: string;
    name: string;
    createdAt: number;
    size: number;
}

interface RenderItemProps {
    item: VideoItem;
    isSelecting: boolean;
    isSelected: boolean;
    toggleSelectItem: (uri: string) => void;
}

const RenderItem = ({
    item,
    isSelecting,
    isSelected,
    toggleSelectItem
}: RenderItemProps) => {
    const date = new Date(item.createdAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata"
    });

    const [datePart, timePart] = date.split(", ");

    return (
        <TouchableOpacity
            onLongPress={() => toggleSelectItem(item.path)}
            onPress={() => {
                if (isSelecting) toggleSelectItem(item.path);
                else
                    router.push({
                        pathname: "/VideoPlayer",
                        params: { uri: item.path }
                    });
            }}
            style={styles.container}
        >
            <View style={styles.row_1}>
                <View style={styles.row_2}>
                    {isSelecting && (
                        <TouchableOpacity
                            style={[
                                styles.selectingBtn,
                                {
                                    backgroundColor: isSelected
                                        ? "white"
                                        : "transparent"
                                }
                            ]}
                        />
                    )}
                    <Text style={styles.name}>{item.name}</Text>
                </View>
                <Text style={styles.time}>{timePart}</Text>
            </View>

            <View style={styles.bottomRow}>
                <Text style={styles.date}>{datePart}</Text>
                <Text style={styles.size}>{formatFileSize(item.size)}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
        backgroundColor: "#1c1c1c6f",
        borderRadius: 12,
        margin: 1,
        overflow: "hidden"
    },
    row_1: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 8,
        paddingVertical: 10
    },
    row_2: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5
    },
    selectingBtn: {
        width: 15,
        height: 15,
        borderColor: "white",
        borderRadius: 18,
        borderWidth: 2,
        margin: 5
    },
    name: {
        color: "white",
        fontSize: 13
    },
    time: {
        color: "white",
        fontSize: 10
    },
    bottomRow: {
        flexDirection: "row",
        flex: 1,
        paddingHorizontal: 8,
        paddingVertical: 10,
        alignItems: "center",
        justifyContent: "space-between"
    },
    date: {
        color: "white",
        fontSize: 8
    },
    size: {
        color: "white",
        fontSize: 8
    }
});

export default RenderItem;
