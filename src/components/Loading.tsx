import React from "react";
import { ActivityIndicator } from "react-native";

import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";

const Loading = () => {
    const { primary } = useColors();
    return <ActivityIndicator size={"large"} color={primary} style={{ marginVertical: Spacing.large }} />;
};

export default Loading;
