import { StyleSheet, View } from "react-native";

import TopRow from "../components/CamOptionsTopRow.tsx";
import TopLeftColumn from "../components/CamOptionsTopLeftColumn.tsx";
import BottomRow from "../components/CamOptionsBottomRow.tsx";

import { useStore } from "../utils/store.ts";

export default function CameraOptions({ camPermission, micPermission }) {
    const fullview = useStore(state => state.fullview);

    return (
        <View style={[styles.container, { flex: fullview ? 1 : 0.8 }]}>
            <View style={{ flex: 1 }}>
                <TopRow />
                <TopLeftColumn />
            </View>
            <BottomRow />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        justifyContent: "space-between"
    }
});
