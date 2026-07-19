import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
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

    const [datePart, timePart] = [
        date.split(",")[0],
        date.split(" ")[1]?.trim()
    ];

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
            style={{
                width: "100%",
                backgroundColor: "#1c1c1c6f",
                borderRadius: 12,
                margin: 1,
                overflow: "hidden"
            }}
        >
            <View
                style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 8,
                    paddingVertical: 10
                }}
            >
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5
                    }}
                >
                    {isSelecting && (
                        <TouchableOpacity
                            style={{
                                width: 15,
                                height: 15,
                                borderColor: "white",
                                borderRadius: 18,
                                borderWidth: 2,
                                margin: 5,
                                backgroundColor: isSelected
                                    ? "white"
                                    : "transparent"
                            }}
                        />
                    )}
                    <Text style={{ color: "white", fontSize: 13 }}>
                        {item.name}
                    </Text>
                </View>
                <Text style={{ color: "white", fontSize: 10 }}>{timePart}</Text>
            </View>

            <View
                style={{
                    flexDirection: "row",
                    flex: 1,
                    paddingHorizontal: 8,
                    paddingVertical: 10,
                    alignItems: "center",
                    justifyContent: "space-between"
                }}
            >
                <Text style={{ color: "white", fontSize: 8 }}>{datePart}</Text>
                <Text style={{ color: "white", fontSize: 9 }}>
                    {formatFileSize(item.size)}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export default RenderItem;
