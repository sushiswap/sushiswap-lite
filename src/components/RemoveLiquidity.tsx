import React, { useCallback } from "react";
import { ActivityIndicator, FlatList, TouchableHighlight, View } from "react-native";
import { Hoverable } from "react-native-web-hover";

import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import { RemoveLiquidityState } from "../hooks/useRemoveLiquidityState";
import LPToken from "../types/LPToken";
import { formatBalance } from "../utils";
import Border from "./Border";
import CloseIcon from "./CloseIcon";
import Column from "./Column";
import FlexView from "./FlexView";
import SelectIcon from "./SelectIcon";
import Subtitle from "./Subtitle";
import Text from "./Text";

const RemoveLiquidity = ({ state }: { state: RemoveLiquidityState }) => {
    const onUnselectToken = useCallback(() => {
        state.setSelectedLPToken(undefined);
    }, [state.setSelectedLPToken]);
    return (
        <>
            <Column>
                <Text h4={true} style={{ textAlign: "center" }}>
                    🎉 Remove Liquidity
                </Text>
            </Column>
            <Column>
                <Subtitle text={"1. Select the pool to remove liquidity from"} />
                {state.selectedLPToken ? (
                    <LPTokenItem token={state.selectedLPToken} selected={true} onSelectToken={onUnselectToken} />
                ) : (
                    <LPTokenList state={state} />
                )}
            </Column>
        </>
    );
};

const LPTokenList = ({ state }: { state: RemoveLiquidityState }) => {
    const onSelectToken = useCallback(
        token => {
            state.setSelectedLPToken(token);
        },
        [state.setSelectedLPToken]
    );
    const renderItem = useCallback(({ item }) => {
        return <LPTokenItem key={item.address} token={item} selected={false} onSelectToken={onSelectToken} />;
    }, []);
    return state.loading || !state.lpTokens ? (
        <ActivityIndicator size={"large"} style={{ marginTop: Spacing.large }} />
    ) : state.lpTokens.length === 0 ? (
        <EmptyList />
    ) : (
        <FlatList data={state.lpTokens} renderItem={renderItem} ItemSeparatorComponent={Border} />
    );
};

const EmptyList = () => {
    return (
        <View style={{ margin: Spacing.normal }}>
            <Text light={true} style={{ textAlign: "center", width: "100%" }}>
                {"You don't have any liquidity."}
            </Text>
        </View>
    );
};

const LPTokenItem = (props: { token: LPToken; selected: boolean; onSelectToken: (token: LPToken) => void }) => {
    const { background, backgroundHovered, textMedium } = useColors();
    const onPress = useCallback(() => {
        props.onSelectToken(props.token);
    }, [props.onSelectToken, props.token]);
    return (
        <Hoverable>
            {({ hovered }) => (
                <TouchableHighlight onPress={onPress}>
                    <View style={{ backgroundColor: hovered ? backgroundHovered : background }}>
                        <FlexView style={{ alignItems: "center", margin: Spacing.small }}>
                            <Text light={true} style={{ fontSize: 20, color: textMedium }}>
                                {props.token.tokenA.symbol}-{props.token.tokenB.symbol}
                            </Text>
                            <Text light={true} style={{ flex: 1, textAlign: "right", fontSize: 20, color: textMedium }}>
                                {formatBalance(props.token.balance, props.token.decimals, 18)}
                            </Text>
                            {props.selected ? <CloseIcon /> : <SelectIcon />}
                        </FlexView>
                    </View>
                </TouchableHighlight>
            )}
        </Hoverable>
    );
};

export default RemoveLiquidity;
