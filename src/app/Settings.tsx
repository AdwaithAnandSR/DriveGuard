import { SafeAreaView } from "react-native-safe-area-context";
import { Text, StyleSheet, Switch, ScrollView, Pressable } from "react-native";
import { MenuView } from "@expo/ui/community/menu";

import SettingRow from "../components/SettingsRow";
import { useStore } from "../utils/store";

const STORAGE_LIMITS = {
    "100": 100,
    "250": 250,
    "500": 500,
    "1g": 1024,
    "3g": 3072,
    "5g": 5120,
    "10g": 10240
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

const STORAGE_OPTIONS = [
    { id: "100", title: "100 MB" },
    { id: "250", title: "250 MB" },
    { id: "500", title: "500 MB" },
    { id: "1g", title: "1 GB" },
    { id: "3g", title: "3 GB" },
    { id: "5g", title: "5 GB" },
    { id: "10g", title: "10 GB" }
];

export default function SettingsScreen() {
    const autoDelete = useStore(state => state.autoDelete);
    const setAutoDelete = useStore(state => state.setAutoDelete);

    const autoOptimize = useStore(state => state.autoOptimize);
    const setAutoOptimize = useStore(state => state.setAutoOptimize);

    const videoQuality = useStore(state => state.videoQuality);
    const setVideoQuality = useStore(state => state.setVideoQuality);

    const maxStorageUsageMB = useStore(state => state.maxStorageUsageMB);
    const setMaxStorageUsageMB = useStore(state => state.setMaxStorageUsageMB);

    const maxVideoSizeInMB = useStore(state => state.maxVideoSizeInMB);
    const setMaxVideoSizeInMB = useStore(state => state.setMaxVideoSizeInMB);

    const limitDuration = useStore(state => state.limitDuration);
    const setLimitDuration = useStore(state => state.setLimitDuration);

    const storageLabel =
        maxStorageUsageMB >= 1024
            ? `${maxStorageUsageMB / 1024} GB`
            : `${maxStorageUsageMB} MB`;

    const videoLimitLabel =
        maxVideoSizeInMB >= 1024
            ? `${maxVideoSizeInMB / 1024} GB`
            : `${maxVideoSizeInMB} MB`;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Settings</Text>

            <SettingRow
                title="Auto Delete"
                description="Automatically delete older videos when the storage limit is exceeded."
                right={
                    <Switch value={autoDelete} onValueChange={setAutoDelete} />
                }
            />

            <SettingRow
                title="Auto Optimize"
                description="When enabled, the dashcam automatically lowers video quality if your device temperature exceeds 40°C to prevent overheating and system shutdowns."
                right={
                    <Switch
                        value={autoOptimize}
                        onValueChange={setAutoOptimize}
                    />
                }
            />

            <SettingRow
                title="Storage Limit"
                description="Maximum storage used by recordings."
                right={
                    <MenuView
                        actions={STORAGE_OPTIONS}
                        onPressAction={({ nativeEvent }) =>
                            setMaxStorageUsageMB(
                                STORAGE_LIMITS[
                                    nativeEvent.event as keyof typeof STORAGE_LIMITS
                                ]
                            )
                        }
                    >
                        <Pressable style={styles.right}>
                            <Text style={styles.value}>{storageLabel}</Text>
                        </Pressable>
                    </MenuView>
                }
            />

            <SettingRow
                title="Video Limit"
                description="Maximum storage used by one video."
                right={
                    <MenuView
                        actions={STORAGE_OPTIONS}
                        onPressAction={({ nativeEvent }) =>
                            setMaxVideoSizeInMB(
                                STORAGE_LIMITS[
                                    nativeEvent.event as keyof typeof STORAGE_LIMITS
                                ]
                            )
                        }
                    >
                        <Pressable style={styles.right}>
                            <Text style={styles.value}>{videoLimitLabel}</Text>
                        </Pressable>
                    </MenuView>
                }
            />

            <SettingRow
                title="Duration Limit"
                description="Maximum duration used by recordings."
                right={
                    <MenuView
                        actions={DURATION_OPTIONS}
                        onPressAction={({ nativeEvent }) =>
                            setLimitDuration(Number(nativeEvent.event))
                        }
                    >
                        <Pressable style={styles.right}>
                            <Text style={styles.value}>
                                {limitDuration} min
                            </Text>
                        </Pressable>
                    </MenuView>
                }
            />

            <SettingRow
                title="Video Quality"
                description="Higher quality uses more storage."
                right={
                    <MenuView
                        actions={QUALITY_OPTIONS}
                        onPressAction={({ nativeEvent }) =>
                            setVideoQuality(nativeEvent.event as VideoQuality)
                        }
                    >
                        <Pressable style={styles.right}>
                            <Text style={styles.value}>{videoQuality}</Text>
                        </Pressable>
                    </MenuView>
                }
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: "#000",
        paddingHorizontal: 18,
        paddingTop: 30
    },
    title: {
        color: "#fff",
        fontSize: 28,
        fontWeight: "700",
        marginVertical: 20
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
