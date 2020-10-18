import React, { FC, useCallback, useContext, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, View, ViewStyle } from "react-native";

import { Spacing } from "../constants/dimension";
import { EthersContext } from "../context/EthersContext";
import useColors from "../hooks/useColors";
import Token from "../types/Token";
import { formatBalance } from "../utils";
import Expandable from "./Expandable";
import FlexView from "./FlexView";
import { ITEM_SEPARATOR_HEIGHT } from "./ItemSeparator";
import Selectable from "./Selectable";
import Text from "./Text";

interface TokenSelectProps {
    title: string;
    symbol: string;
    onChangeSymbol: (symbol: string) => void;
    disabled?: (token: Token) => boolean;
    hidden?: (token: Token) => boolean;
    style?: ViewStyle;
}

const TokenSelect: FC<TokenSelectProps> = props => {
    const { tokens } = useContext(EthersContext);
    const token = useMemo(() => tokens.find(t => t.symbol === props.symbol), [tokens, props.symbol]);
    const onSelectToken = t => {
        props.onChangeSymbol(t.symbol);
    };
    const onUnselectToken = () => {
        props.onChangeSymbol("");
    };
    return (
        <View style={props.style}>
            <Expandable title={props.title} expanded={!props.symbol} onExpand={() => props.onChangeSymbol("")}>
                <TokenList disabled={props.disabled} hidden={props.hidden} onSelectToken={onSelectToken} />
            </Expandable>
            {token && <TokenItem token={token} selected={true} onSelectToken={onUnselectToken} selectable={true} />}
        </View>
    );
};

// tslint:disable-next-line:max-func-body-length
const TokenList = (props: {
    onSelectToken: (token: Token) => void;
    disabled?: (token: Token) => boolean;
    hidden?: (token: Token) => boolean;
}) => {
    const { loadingTokens, tokens } = useContext(EthersContext);
    const renderItem = useCallback(
        ({ item }) => {
            return (
                <TokenItem
                    key={item.address}
                    token={item}
                    selected={false}
                    onSelectToken={props.onSelectToken}
                    disabled={props.disabled?.(item)}
                />
            );
        },
        [props.onSelectToken, props.disabled]
    );
    const data = useMemo(
        () =>
            tokens
                .filter(token => (props.hidden ? !props.hidden(token) : true))
                .sort(
                    (t1, t2) =>
                        (t2.balance.isZero() ? 0 : 10000000000) -
                        (t1.balance.isZero() ? 0 : 10000000000) +
                        t1.symbol.localeCompare(t2.symbol)
                ),
        [tokens]
    );
    return loadingTokens ? (
        <ActivityIndicator size={"large"} style={{ marginVertical: Spacing.large }} />
    ) : data.length === 0 ? (
        <EmptyList />
    ) : (
        <FlatList keyExtractor={item => item.address} data={data} renderItem={renderItem} />
    );
};

const EmptyList = () => {
    return (
        <View style={{ margin: Spacing.normal }}>
            <Text light={true} style={{ textAlign: "center", width: "100%" }}>
                {"You don't have any token with balance.\nTransfer tokens to your address first."}
            </Text>
        </View>
    );
};

const TokenItem = (props: {
    token: Token;
    selected: boolean;
    onSelectToken: (token: Token) => void;
    disabled?: boolean;
    selectable?: boolean;
}) => {
    const { backgroundLight } = useColors();
    const onPress = useCallback(() => {
        props.onSelectToken(props.token);
    }, [props.onSelectToken, props.token]);
    return (
        <Selectable
            selected={props.selected}
            onPress={onPress}
            disabled={props.disabled || props.selectable}
            style={{
                backgroundColor: props.disabled ? backgroundLight : undefined,
                marginBottom: ITEM_SEPARATOR_HEIGHT
            }}>
            <FlexView style={{ alignItems: "center" }}>
                <TokenLogo uri={props.token.logoURI} disabled={props.disabled} />
                <TokenName token={props.token} disabled={props.disabled} />
                <TokenBalance token={props.token} disabled={props.disabled} />
                <Text medium={true} caption={true} disabled={props.disabled}>
                    {" " + props.token.symbol}
                </Text>
            </FlexView>
        </Selectable>
    );
};

const TokenLogo = ({ uri, disabled }) => {
    const [error, setError] = useState(false);
    const placeholder = require("../../assets/empty-token.png");
    return (
        <View style={{ width: 27, height: 27, backgroundColor: disabled ? "black" : "white", borderRadius: 13.5 }}>
            <Image
                source={error ? placeholder : { uri }}
                onError={() => setError(true)}
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 12,
                    opacity: disabled ? 0.25 : 1
                }}
            />
        </View>
    );
};

const TokenName = ({ token, disabled }) => (
    <Text
        caption={true}
        numberOfLines={1}
        ellipsizeMode={"tail"}
        style={{ marginLeft: Spacing.small, width: 180 }}
        disabled={disabled}>
        {token.name}
    </Text>
);

const TokenBalance = ({ token, disabled }) => (
    <Text caption={true} style={{ flex: 1, textAlign: "right" }} disabled={disabled}>
        {formatBalance(token.balance, token.decimals, 8)}
    </Text>
);

export default TokenSelect;
