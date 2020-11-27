import React from "react";
import { View } from "react-native";

import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";

const Border = props => {
    const { border } = useColors();
    return (
        <View
            style={{
                height: 1,
                width: "100%",
                backgroundColor: border,
                marginTop: props.small ? Spacing.tiny : Spacing.small,
                marginBottom: props.small ? Spacing.tiny : Spacing.small + Spacing.tiny
            }}
        />
    );
};

export default Border;
