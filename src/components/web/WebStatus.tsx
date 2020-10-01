import React, { useContext } from "react";
import { View } from "react-native";

import { Spacing } from "../../constants/dimension";
import { EthersContext } from "../../context/EthersContext";
import useColors from "../../hooks/useColors";
import useStyles from "../../hooks/useStyles";
import FlexView from "../FlexView";
import Text from "../Text";

const WebStatus = () => {
    const { textMedium, textLight, green } = useColors();
    const { shadow } = useStyles();
    const { chainId, address } = useContext(EthersContext);
    const connected = chainId === 1 && address;
    const title = connected
        ? address!.substring(0, 6) + "..." + address!.substring(address!.length - 4, address!.length)
        : "Not connected";
    const color = connected ? green : textLight;
    return (
        <FlexView
            // @ts-ignore
            style={{
                position: "fixed",
                right: Spacing.content,
                bottom: Spacing.normal,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: Spacing.small,
                borderRadius: 16,
                ...shadow
            }}>
            <View style={{ backgroundColor: color, width: 6, height: 6, borderRadius: 3, marginRight: 12 }} />
            <Text style={{ fontSize: 16, color: textMedium, marginRight: 2 }}>{title}</Text>
            {/*<Icon type={"material-community"} name={"chevron-down"} color={textLight} size={22} />*/}
        </FlexView>
    );
};

export default WebStatus;
