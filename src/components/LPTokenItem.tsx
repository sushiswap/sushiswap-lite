import React, { FC, useCallback } from "react";
import { Image, TouchableHighlight, View } from "react-native";
import { Hoverable } from "react-native-web-hover";

import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import { formatBalance } from "../utils";
import CloseIcon from "./CloseIcon";
import FlexView from "./FlexView";
import { LPTokenItemProps } from "./LPTokenSelect";
import SelectIcon from "./SelectIcon";
import Text from "./Text";

const LPTokenItem: FC<LPTokenItemProps> = props => {
    const { background, backgroundHovered, textMedium } = useColors();
    const balance = formatBalance(props.token.balance, props.token.decimals, 18);
    const onPress = useCallback(() => {
        props.onSelectToken(props.token);
    }, [props.onSelectToken, props.token]);
    return (
        <Hoverable>
            {({ hovered }) => (
                <TouchableHighlight onPress={onPress}>
                    <View style={{ backgroundColor: hovered ? backgroundHovered : background }}>
                        <FlexView style={{ alignItems: "center", margin: Spacing.small }}>
                            <View>
                                <LogoSymbol token={props.token.tokenA} />
                                <LogoSymbol token={props.token.tokenB} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text note={true} style={{ textAlign: "right" }}>
                                    My Balance
                                </Text>
                                <Text light={true} style={{ textAlign: "right", fontSize: 22, color: textMedium }}>
                                    {balance}
                                </Text>
                            </View>
                            {props.selected ? <CloseIcon /> : <SelectIcon />}
                        </FlexView>
                    </View>
                </TouchableHighlight>
            )}
        </Hoverable>
    );
};

const LogoSymbol = ({ token }) => {
    const { textMedium } = useColors();
    return (
        <FlexView style={{ alignItems: "center", marginBottom: Spacing.tiny }}>
            <Image
                source={{ uri: token.logoURI }}
                style={{ width: 24, height: 24, backgroundColor: "white", borderRadius: 12 }}
            />
            <Text light={true} style={{ fontSize: 22, color: textMedium, marginLeft: Spacing.small }}>
                {token.symbol}
            </Text>
        </FlexView>
    );
};

export default LPTokenItem;
