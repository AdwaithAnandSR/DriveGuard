import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, Switch, Pressable } from "react-native";
import { MenuView } from "@expo/ui/community/menu";
import { Host } from "@expo/ui";

import { useStore } from "../utils/store";

const STORAGE_LIMITS = {
    "100": 100 * 1024 * 1024,
    "250": 250 * 1024 * 1024,
    "500": 500 * 1024 * 1024,
    "1g": 1024 * 1024 * 1024,
    "3g": 3 * 1024 * 1024 * 1024,
    "5g": 5 * 1024 * 1024 * 1024,
    "10g": 10 * 1024 * 1024 * 1024
} as const;

const QUALITY_OPTIONS = [
    { id: "2160p", title: "2160p (4K)" },
    { id: "1080p", title: "1080p (Full HD)" },
    { id: "720p", title: "720p (HD)" },
    { id: "480p", title: "480p (SD)" }
];

const DURATION_OPTIONS = [
    { id: "5", title: "5 min" },
    { id: "10", title: "10 min" },
    { id: "15", title: "15 min" },
    { id: "30", title: "30 min" },
    { id: "45", title: "45 min" },
    { id: "60", title: "60 min" }
];

const QUALITY_MAP = {
    "2160p": "2160p",
    "1080p": "1080p",
    "720p": "720p",
    "480p": "480p"
} as const;

export default function SettingsScreen() {
    const {
        autoDelete,
        videoQuality,
        limitBytes,
        setAutoDelete,
        setLimitBytes,
        setVideoQuality,
        limitDuration,
        setLimitDuration
    } = useStore();

    const storageLabel =
        limitBytes >= 1024 * 1024 * 1024
            ? `${limitBytes / 1024 / 1024 / 1024} GB`
            : `${limitBytes / 1024 / 1024} MB`;

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Settings</Text>

            {/* Auto Delete */}
            <View style={styles.item}>
                <View style={styles.left}>
                    <View style={styles.textContainer}>
                        <Text style={styles.label}>Auto Delete</Text>

                        <Text adjustsFontSizeToFit style={styles.description}>
                            Automatically delete older videos when the storage
                            limit is exceeded.
                        </Text>
                    </View>
                </View>

                <Switch value={autoDelete} onValueChange={setAutoDelete} />
            </View>

            {/* Storage Limit */}
            <View style={styles.item}>
                <View style={styles.left}>
                    <View style={styles.textContainer}>
                        <Text style={styles.label}>Storage Limit</Text>
                        <Text style={styles.description}>
                            Maximum storage used by recordings.
                        </Text>
                    </View>
                </View>

                <MenuView
                    actions={[
                        { id: "100", title: "100 MB" },
                        { id: "250", title: "250 MB" },
                        { id: "500", title: "500 MB" },
                        { id: "1g", title: "1 GB" },
                        { id: "3g", title: "3 GB" },
                        { id: "5g", title: "5 GB" },
                        { id: "10g", title: "10 GB" }
                    ]}
                    onPressAction={({ nativeEvent }) => {
                        setLimitBytes(
                            STORAGE_LIMITS[
                                nativeEvent.event as keyof typeof STORAGE_LIMITS
                            ]
                        );
                    }}
                >
                    <Pressable style={styles.right}>
                        <Text style={styles.value}>{storageLabel}</Text>
                    </Pressable>
                </MenuView>
            </View>

            {/* Duration Limit */}
            <View style={styles.item}>
                <View style={styles.left}>
                    <View style={styles.textContainer}>
                        <Text style={styles.label}>Duration Limit</Text>
                        <Text style={styles.description}>
                            Maximum duration used by recordings.
                        </Text>
                    </View>
                </View>

                <MenuView
                    actions={DURATION_OPTIONS}
                    onPressAction={({ nativeEvent }) =>
                        setLimitDuration(Number(nativeEvent.event))
                    }
                >
                    <Pressable style={styles.right}>
                        <Text style={styles.value}>{limitDuration}</Text>
                    </Pressable>
                </MenuView>
            </View>

            {/* Video Quality */}
            <View style={styles.item}>
                <View style={styles.left}>
                    <View style={styles.textContainer}>
                        <Text style={styles.label}>Video Quality</Text>

                        <Text style={styles.description}>
                            Higher quality uses more storage.
                        </Text>
                    </View>
                </View>

                <MenuView
                    actions={QUALITY_OPTIONS}
                    onPressAction={({ nativeEvent }) => {
                        setVideoQuality(
                            QUALITY_MAP[
                                nativeEvent.event as keyof typeof QUALITY_MAP
                            ]
                        );
                    }}
                >
                    <Pressable style={styles.right}>
                        <Text style={styles.value}>{videoQuality}</Text>
                    </Pressable>
                </MenuView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        paddingHorizontal: 18
    },
    title: {
        color: "#fff",
        fontSize: 28,
        fontWeight: "700",
        marginVertical: 20
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#121212",
        borderRadius: 16,
        padding: 10,
        marginBottom: 12,
        height: 70
    },
    left: {
        flex: 1,
        paddingRight: 16
    },
    textContainer: {
        flex: 1,
        marginLeft: 14
    },
    label: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600"
    },
    description: {
        color: "#8d8d8d",
        fontSize: 12
    },
    right: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end"
    },

    value: {
        color: "#fff",
        fontSize: 15,
        marginRight: 4
    }
});
