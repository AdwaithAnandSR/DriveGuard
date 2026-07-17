import { useState, useEffect } from "react";
import {
    Button,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    FlatList
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";

import { list, deleteSelected } from "../utils/file.ts";

const RenderItem = ({ item, isSelecting, isSelected, toggleSelectItem }) => {
    const date = new Date(item.creationTime).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata"
    });

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
                padding: 2,
                backgroundColor: "#1717176f",
                borderRadius: 22
            }}
        >
            <TouchableOpacity
                style={{
                    width: 18,
                    height: 18,
                    borderColor: isSelecting ? "white" : "transparent",
                    borderRadius: 18,
                    borderWidth: 2,
                    margin: 5,
                    backgroundColor: isSelected ? "white" : "transparent"
                }}
            />

            <Image
                source={item.thumbnail}
                style={{ flex: 1, borderRadius: 22 }}
                contentFit="cover"
            />
            <View
                style={{
                    position: "absolute",
                    bottom: "8%",
                    flexDirection: "row",
                    width: "100%",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    paddingHorizontal: 8
                }}
            >
                <Text
                    style={{
                        color: "white",
                        fontSize: 10,
                        selfAlign: "center"
                    }}
                >
                    {date.split(",")[0]}
                </Text>
                <Text
                    style={{
                        color: "white",
                        fontSize: 8,
                        selfAlign: "center"
                    }}
                >
                    {date.split(" ")[1].trim()}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const CamView = ({ fullview, toggleFullView }) => {
    const [files, setFiles] = useState(list() ?? []);
    const [isSelecting, setSelecting] = useState(false);
    const [multiSelectList, setMultiSelectList] = useState<string[]>([]);

    const toggleSelectItem = (uri: string) => {
        setMultiSelectList(prev => {
            const exists = prev.includes(uri);

            let updated;

            if (exists) {
                updated = prev.filter(item => item !== uri);
            } else {
                updated = [...prev, uri];
            }

            setSelecting(updated.length > 0);

            return updated;
        });
    };

    const onDelete = async () => {
        await deleteSelected(multiSelectList);
        setFiles(prev =>
            prev.filter(item => !multiSelectList.includes(item.uri))
        );
        setMultiSelectList([]);
        setSelecting(false);
    };

    return (
        <View style={styles.container}>
            {isSelecting && (
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "flex-end",
                        paddingHorizontal: 12,
                        paddingTop: 40
                    }}
                >
                    <TouchableOpacity onPress={onDelete}>
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: "#fd6767"
                            }}
                        >
                            Delete
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
            <FlatList
                data={files}
                keyExtractor={item => item.uri}
                numColumns={3}
                renderItem={({ item }) => (
                    <RenderItem
                        item={item}
                        isSelecting={isSelecting}
                        toggleSelectItem={toggleSelectItem}
                        isSelected={multiSelectList.includes(item.uri)}
                    />
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No videos found</Text>
                    </View>
                )}
                contentContainerStyle={{ paddingTop: 40 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: "1%",
        backgroundColor: "black"
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 40
    },
    emptyText: {
        fontSize: 16,
        color: "#888"
    }
});

export default CamView;
