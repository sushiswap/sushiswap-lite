import React from "react";
import { View } from "react-native";

import { StatusBar } from "expo-status-bar";

import { HEADER_HEIGHT } from "../../constants/dimension";
import useColors from "../../hooks/useColors";

const AppHeader = () => {
    const { background } = useColors();
    return (
        <View
            style={{
                width: "100%",
                height: HEADER_HEIGHT,
                backgroundColor: background
            }}>
            <StatusBar translucent={false} backgroundColor={background} />
        </View>
    );
};

export default AppHeader;
