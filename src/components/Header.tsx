import { StyleSheet, Text, View } from "react-native";
import { Host, Icon } from "@expo/ui";
import { router } from "expo-router";
import Settings from "@expo/material-symbols/settings.xml";

import { useStore } from "../utils/store.ts";

const handleRoute = () => {
    router.push("/Settings");
};

export default function Header() {
    const fullview = useStore(state => state.fullview);
    if (fullview) return null;

    return (
        <View
            style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingRight: 25
            }}
        >
            <Text style={styles.header}>Drive Guard</Text>
            <Host matchContents>
                <Icon
                    onPress={handleRoute}
                    name={Settings}
                    size={30}
                    color={"white"}
                />
            </Host>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        fontSize: 42,
        fontWeight: "bold",
        paddingHorizontal: "2%",
        paddingVertical: "8%",
        color: "white"
    }
});
