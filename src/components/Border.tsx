import React from "react";
import { View } from "react-native";

import useColors from "../hooks/useColors";

const Border = () => {
    const { border } = useColors();
    return <View style={{ height: 1, width: "100%", backgroundColor: border }} />;
};

export default Border;
