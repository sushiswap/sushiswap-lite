import React from "react";
import { View } from "react-native";

import { Spacing } from "../constants/dimension";
import Notice from "./Notice";

const DeprecatedNotice = () => {
    const text =
        "Please note, as part of SushiSwap's ongoing feature enhancements, this interface will be deprecated on Monday March 1, 2021. Please begin visiting https://www.sushiswap.fi";
    return (
        <View style={{ marginVertical: Spacing.tiny }}>
            <Notice text={text} color={"orange"} />
        </View>
    );
};

export default DeprecatedNotice;
