import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";

import { formatFileSize } from "../utils/file.ts";

export interface VideoItem {
    uri: string;
    creationTime: number;
    thumbnail: string;
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
    const date = new Date(item.creationTime).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata"
    });

    const [datePart, timePart] = [
        date.split(",")[0],
        date.split(" ")[1]?.trim()
    ];

    return (
        <TouchableOpacity
            onLongPress={() => toggleSelectItem(item.uri)}
            onPress={() => {
                if (isSelecting) toggleSelectItem(item.uri);
                else
                    router.push({
                        pathname: "/VideoPlayer",
                        params: { uri: item.uri }
                    });
            }}
            style={{
                flex: 1 / 3,
                aspectRatio: 1,
                backgroundColor: "#1c1c1c6f",
                borderRadius: 22,
                margin: 1,
                overflow: "hidden"
            }}
        >
            <View
                style={{
                    position: "absolute",
                    top: 0,
                    flexDirection: "row",
                    width: "100%",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingHorizontal: 8,
                    zIndex: 999,
                    backgroundColor: "#1c1c1cbe",
                    height: "15%"
                }}
            >
                <TouchableOpacity
                    style={{
                        width: 15,
                        height: 15,
                        borderColor: isSelecting ? "white" : "transparent",
                        borderRadius: 18,
                        borderWidth: 2,
                        margin: 5,
                        backgroundColor: isSelected ? "white" : "transparent"
                    }}
                />
                <Text style={{ color: "white", fontSize: 8 }}>
                    {formatFileSize(item.size)}
                </Text>
            </View>

            <Image
                source={item.thumbnail}
                style={{ flex: 1, borderRadius: 22 }}
                contentFit="cover"
                recyclingKey={item.uri}
            />
            <View
                style={{
                    position: "absolute",
                    bottom: "0%",
                    flexDirection: "row",
                    width: "100%",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingHorizontal: 8,
                    backgroundColor: "#1c1c1cbe",
                    height: "20%"
                }}
            >
                <Text style={{ color: "white", fontSize: 10 }}>{datePart}</Text>
                <Text style={{ color: "white", fontSize: 8 }}>{timePart}</Text>
            </View>
        </TouchableOpacity>
    );
};

export default RenderItem;
