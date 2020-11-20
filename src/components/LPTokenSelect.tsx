import React, { FC, useCallback } from "react";
import { FlatList, View, ViewStyle } from "react-native";

import { ethers } from "ethers";
import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import { LPTokensState } from "../hooks/useLPTokensState";
import LPToken from "../types/LPToken";
import { formatBalance, pow10 } from "../utils";
import CheckBox from "./CheckBox";
import Expandable from "./Expandable";
import FlexView from "./FlexView";
import { ITEM_SEPARATOR_HEIGHT } from "./ItemSeparator";
import Loading from "./Loading";
import Selectable from "./Selectable";
import Text from "./Text";
import TokenLogo from "./TokenLogo";

export type LPTokenSelectFilter = "balance" | "amountDeposited" | "";

export interface LPTokenSelectProps {
    state: LPTokensState;
    title: string;
    emptyText: string;
    showFilter?: boolean;
    filter?: LPTokenSelectFilter;
    onFilterChanged?: (filter: LPTokenSelectFilter) => void;
    Item: FC<LPTokenItemProps>;
    style?: ViewStyle;
}

export interface LPTokenItemProps {
    token: LPToken;
    selected: boolean;
    filter?: LPTokenSelectFilter;
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
                <LPTokenList state={props.state} filter={props.filter} emptyText={props.emptyText} Item={props.Item} />
            </Expandable>
            {props.state.selectedLPToken && (
                <LPTokenItem token={props.state.selectedLPToken} selected={true} onSelectToken={onUnselectToken} />
            )}
        </View>
    );
};

const Filter = ({ filter, onFilterChanged }) => {
    const handler = (f: string) => () => onFilterChanged(f);
    return (
        <FlexView style={{ width: "100%", justifyContent: "flex-end" }}>
            <CheckBox checked={filter === "balance"} onPress={handler("balance")} title={"with balance"} />
            <CheckBox
                checked={filter === "amountDeposited"}
                onPress={handler("amountDeposited")}
                title={"with deposit"}
            />
            <CheckBox checked={!filter} onPress={handler("")} title={"all"} />
        </FlexView>
    );
};

// tslint:disable-next-line:max-func-body-length
const LPTokenList = ({
    state,
    emptyText,
    filter,
    Item
}: {
    state: LPTokensState;
    emptyText: string;
    filter?: LPTokenSelectFilter;
    Item: FC<LPTokenItemProps>;
}) => {
    const renderItem = useCallback(
        ({ item }) => {
            return (
                <Item
                    key={item.address}
                    token={item}
                    selected={false}
                    filter={filter}
                    onSelectToken={state.setSelectedLPToken}
                />
            );
        },
        [filter, state.setSelectedLPToken]
    );
    let data = state.lpTokens.sort((t1, t2) => {
        return (t2.totalDeposited || ethers.constants.Zero)
            .sub(t1.totalDeposited || ethers.constants.Zero)
            .div(pow10(14))
            .toNumber();
    });
    if (filter === "amountDeposited") {
        data = data.filter(token => token.amountDeposited?.gt(0));
    } else if (filter === "balance") {
        data = data.filter(token => token.balance.gt(0));
    }
    return state.loading ? (
        <Loading />
    ) : data.length === 0 ? (
        <EmptyList text={emptyText} />
    ) : (
        <FlatList keyExtractor={item => item.address} data={data} renderItem={renderItem} />
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
    const balance = formatBalance(props.token.balance, props.token.decimals, 8);
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
                    {/*<Text note={true} style={{ textAlign: "right", color: textLight }}>*/}
                    {/*    My Balance*/}
                    {/*</Text>*/}
                    <Text caption={true} light={true} style={{ textAlign: "right", color: textMedium }}>
                        {balance}
                    </Text>
                </View>
            </FlexView>
        </Selectable>
    );
};

export default LPTokenSelect;
