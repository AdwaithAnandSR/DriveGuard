import React, { useCallback, useMemo, useState, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FlashList, ListRenderItem } from "@shopify/flash-list";

import { list, deleteSelected } from "../utils/file.ts";
import RenderItem, { VideoItem } from "../components/GalleryItem.tsx";
import { CamUtils } from "../utils/camera.ts";

const Gallery = ({ fullview, toggleFullView }) => {
    const [files, setFiles] = useState<VideoItem[]>(list() ?? []);
    const [isSelecting, setSelecting] = useState(false);
    const [multiSelectList, setMultiSelectList] = useState<string[]>([]);

    const toggleSelectItem = (uri: string) => {
        setMultiSelectList(prev => {
            const exists = prev.includes(uri);
            const updated = exists
                ? prev.filter(item => item !== uri)
                : [...prev, uri];

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

    const selectedSet = new Set(multiSelectList);

    const renderItem: ListRenderItem<VideoItem> = ({ item }) => (
        <RenderItem
            item={item}
            isSelecting={isSelecting}
            toggleSelectItem={toggleSelectItem}
            isSelected={selectedSet.has(item.uri)}
        />
    );

    const keyExtractor = (item: VideoItem) => item.uri;

    useEffect(() => {
        (async () => {
            await console.log(CamUtils.startRecording());
        })();
    }, []);

    return (
        <View style={styles.container}>
            {isSelecting && (
                <View style={styles.deleteBar}>
                    <TouchableOpacity onPress={onDelete}>
                        <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlashList
                data={files}
                keyExtractor={keyExtractor}
                numColumns={3}
                renderItem={renderItem}
                estimatedItemSize={130}
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
    deleteBar: {
        flexDirection: "row",
        justifyContent: "flex-end",
        paddingHorizontal: 12,
        paddingTop: 40
    },
    deleteText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fd6767"
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

export default Gallery;
