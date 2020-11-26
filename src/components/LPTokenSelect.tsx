import React, { FC, useCallback } from "react";
import { FlatList, View, ViewStyle } from "react-native";

import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import { LPTokensState } from "../hooks/useLPTokensState";
import LPToken from "../types/LPToken";
import { formatBalance } from "../utils";
import CloseIcon from "./CloseIcon";
import Expandable from "./Expandable";
import FlexView from "./FlexView";
import { ITEM_SEPARATOR_HEIGHT } from "./ItemSeparator";
import Loading from "./Loading";
import Selectable from "./Selectable";
import SelectIcon from "./SelectIcon";
import Text from "./Text";
import TokenLogo from "./TokenLogo";

export type LPTokenSelectFilter = "balance" | "amountDeposited" | "";

export interface LPTokenSelectProps {
    state: LPTokensState;
    title: string;
    emptyText: string;
    Item: FC<LPTokenItemProps>;
    style?: ViewStyle;
}

export interface LPTokenItemProps {
    token: LPToken;
    selected: boolean;
    onSelectToken: (token: LPToken) => void;
}

const LPTokenSelect: FC<LPTokenSelectProps> = props => {
    const onUnselectToken = () => props.state.setSelectedLPToken();
    return (
        <View style={props.style}>
            <Expandable
                title={props.title}
                expanded={!props.state.selectedLPToken}
                onExpand={() => props.state.setSelectedLPToken()}>
                <LPTokenList state={props.state} emptyText={props.emptyText} Item={props.Item} />
            </Expandable>
            {props.state.selectedLPToken && (
                <props.Item token={props.state.selectedLPToken} selected={true} onSelectToken={onUnselectToken} />
            )}
        </View>
    );
};

// tslint:disable-next-line:max-func-body-length
const LPTokenList = ({
    state,
    emptyText,
    Item
}: {
    state: LPTokensState;
    emptyText: string;
    Item: FC<LPTokenItemProps>;
}) => {
    const renderItem = useCallback(
        ({ item }) => {
            return <Item key={item.symbol} token={item} selected={false} onSelectToken={state.setSelectedLPToken} />;
        },
        [state.setSelectedLPToken]
    );
    const data = state.lpTokens.sort((p1, p2) => {
        const m1 = p1.multiplier || 0;
        const m2 = p2.multiplier || 0;
        return m1 === m2 ? (p2.apy || 0) - (p1.apy || 0) : m2 - m1;
    });
    return state.loading ? (
        <Loading />
    ) : data.length === 0 ? (
        <EmptyList text={emptyText} />
    ) : (
        <FlatList keyExtractor={item => item.symbol} data={data} renderItem={renderItem} />
    );
};

const EmptyList = ({ text }: { text: string }) => {
    return (
        <View style={{ margin: Spacing.normal }}>
            <Text disabled={true} style={{ textAlign: "center", width: "100%" }}>
                {text}
            </Text>
        </View>
    );
};

export const LPTokenItem: FC<LPTokenItemProps> = props => {
    const { textMedium } = useColors();
    const balance = formatBalance(props.token.balance, props.token.decimals, 6);
    const onPress = useCallback(() => {
        props.onSelectToken(props.token);
    }, [props.onSelectToken, props.token]);
    return (
        <Selectable
            selected={props.selected}
            onPress={onPress}
            containerStyle={{ marginBottom: ITEM_SEPARATOR_HEIGHT }}>
            <FlexView style={{ alignItems: "center" }}>
                <TokenLogo token={props.token.tokenA} small={true} replaceWETH={true} />
                <TokenLogo token={props.token.tokenB} small={true} replaceWETH={true} style={{ marginLeft: 4 }} />
                <Text medium={true} caption={true} style={{ marginLeft: Spacing.tiny }}>
                    {props.token.tokenA.symbol}-{props.token.tokenB.symbol}
                </Text>
                <View style={{ flex: 1, marginLeft: Spacing.tiny }}>
                    <Text caption={true} light={true} style={{ textAlign: "right", color: textMedium }}>
                        {balance}
                    </Text>
                </View>
                {props.selected ? <CloseIcon /> : <SelectIcon />}
            </FlexView>
        </Selectable>
    );
};

export default LPTokenSelect;
