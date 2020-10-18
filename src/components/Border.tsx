import React from "react";
import { View } from "react-native";

import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";

const Border = () => {
    const { border } = useColors();
    return (
        <View
            style={{
                height: 1,
                width: "100%",
                backgroundColor: border,
                marginTop: Spacing.small,
                marginBottom: Spacing.small + Spacing.tiny
            }}
        />
    );
};

export default Border;
