import React, { useContext } from "react";
import { View } from "react-native";

import { Spacing } from "../constants/dimension";
import { EthersContext } from "../context/EthersContext";
import useColors from "../hooks/useColors";
import FlexView from "./FlexView";
import Text from "./Text";

const Status = () => {
    const { textDark, textMedium, textLight, green } = useColors();
    const { chainId } = useContext(EthersContext);
    const connected = chainId === 1;
    const title = connected ? "Connected" : "Not connected";
    const color = connected ? green : textLight;
    return (
        <FlexView
            style={{
                position: "absolute",
                right: Spacing.content,
                bottom: Spacing.content,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: Spacing.small,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: textDark
            }}>
            <View style={{ backgroundColor: color, width: 6, height: 6, borderRadius: 3, marginRight: 12 }} />
            <Text style={{ fontSize: 16, color: textMedium, marginRight: 2 }}>{title}</Text>
            {/*<Icon type={"material-community"} name={"chevron-down"} color={textLight} size={22} />*/}
        </FlexView>
    );
};

export default Status;
