import React from "react";
import { View } from "react-native";

import { Spacing } from "../constants/dimension";
import Notice from "./Notice";

const DeprecatedNotice = () => {
    const text =
        "Please note, as part of SushiSwap's ongoing feature enhancements, this interface will be deprecated on Monday Jan 30, 2021. Please begin visiting https://www.sushiswap.fi";
    return (
        <View style={{ marginVertical: Spacing.tiny }}>
            <Notice text={text} color={"red"} />
        </View>
    );
};

export default DeprecatedNotice;
