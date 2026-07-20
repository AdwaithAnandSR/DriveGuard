import { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";

interface SettingRowProps {
    title: string;
    description: string;
    right: ReactNode;
}

export default function SettingRow({
    title,
    description,
    right
}: SettingRowProps) {
    return (
        <View style={styles.item}>
            <View style={styles.left}>
                <View style={styles.textContainer}>
                    <Text style={styles.label}>{title}</Text>
                    <Text style={styles.description}>{description}</Text>
                </View>
            </View>

            {right}
        </View>
    );
}

const styles = StyleSheet.create({
    item: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#121212",
        borderRadius: 16,
        padding: 10,
        marginBottom: 12,
        minHeight: 80
    },
    left: {
        flex: 1,
        paddingRight: 16
    },
    textContainer: {
        flex: 1,
        marginLeft: 14,
        justifyContent: "center"
    },
    label: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600"
    },
    description: {
        color: "#8d8d8d",
        fontSize: 12
    }
});
