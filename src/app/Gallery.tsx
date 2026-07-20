import React, { useCallback, useMemo, useState, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FlashList, ListRenderItem } from "@shopify/flash-list";

import { CamUtils } from "../utils/camera.ts";
import { useStore } from "../utils/store";
import RenderItem, { VideoItem } from "../components/GalleryItem.tsx";

const getFiles = CamUtils.getFiles;

const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No videos found</Text>
    </View>
);

const Gallery = ({ fullview, toggleFullView }) => {
    const files = useStore(state => state.files);
    const setFiles = useStore(state => state.setFiles);
    const deleteFile = useStore(state => state.deleteFile);

    const [multiSelectList, setMultiSelectList] = useState<string[]>([]);
    const isSelecting = multiSelectList.length > 0;

    const toggleSelectItem = (uri: string) => {
        setMultiSelectList(prev => {
            const exists = prev.includes(uri);
            const updated = exists
                ? prev.filter(item => item !== uri)
                : [...prev, uri];

            return updated;
        });
    };

    const onDelete = async () => {
        await Promise.all(
            multiSelectList.map(async path => {
                await CamUtils.deleteFile(path);
                deleteFile(path);
            })
        );

        setMultiSelectList([]);
    };
    const selectedSet = new Set(multiSelectList);

    const keyExtractor = (item: VideoItem) => item.path;

    useEffect(() => {
        (async () => {
            setFiles(await CamUtils.getFiles());
        })();
    }, []);

    const renderItem: ListRenderItem<VideoItem> = ({ item }) => (
        <RenderItem
            item={item}
            isSelecting={isSelecting}
            toggleSelectItem={toggleSelectItem}
            isSelected={selectedSet.has(item.path)}
        />
    );

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
                renderItem={renderItem}
                estimatedItemSize={130}
                ListEmptyComponent={ListEmptyComponent}
                contentContainerStyle={{ paddingTop: 40 }}
                drawDistance={300}
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
