import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FlatList, View, ViewStyle } from "react-native";

import { ethers } from "ethers";
import { Spacing } from "../constants/dimension";
import { EthersContext } from "../context/EthersContext";
import useDelayedEffect from "../hooks/useDelayedEffect";
import Token from "../types/Token";
import Expandable from "./Expandable";
import FlexView from "./FlexView";
import { ITEM_SEPARATOR_HEIGHT } from "./ItemSeparator";
import Loading from "./Loading";
import Selectable from "./Selectable";
import Text from "./Text";
import TokenAmount from "./TokenAmount";
import TokenLogo from "./TokenLogo";
import TokenName from "./TokenName";
import TokenSearch from "./TokenSearch";
import TokenSymbol from "./TokenSymbol";

export interface TokenSelectProps {
    title: string;
    symbol: string;
    onChangeSymbol: (symbol: string) => void;
    disabled?: (token: Token) => boolean;
    hidden?: (token: Token) => boolean;
    style?: ViewStyle;
}

const TokenSelect: FC<TokenSelectProps> = props => {
    const { tokens, addCustomToken } = useContext(EthersContext);
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const token = useMemo(() => tokens.find(t => t.symbol === props.symbol), [tokens, props.symbol]);
    const onSelectToken = t => props.onChangeSymbol(t.symbol);
    const onUnselectToken = () => props.onChangeSymbol("");
    const onAddToken = async (t: Token) => {
        await addCustomToken(t);
        setSearch("");
        setQuery("");
    };
    const hidden = (t: Token) => {
        let hide = props.hidden?.(t) || false;
        if (!hide && query.length > 0 && !ethers.utils.isAddress(query)) {
            hide = !t.symbol.toLowerCase().includes(query) && !t.name.toLowerCase().includes(query);
        }
        return hide;
    };
    useEffect(() => setSearch(""), [props.symbol]);
    useDelayedEffect(() => setQuery(search.trim().toLowerCase()), 300, [search]);
    return (
        <View style={props.style}>
            <Expandable title={props.title} expanded={!props.symbol} onExpand={() => props.onChangeSymbol("")}>
                <TokenSearch text={search} onChangeText={setSearch} tokens={tokens} onAddToken={onAddToken} />
                <TokenList disabled={props.disabled} hidden={hidden} onSelectToken={onSelectToken} />
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
        [tokens, props.hidden]
    );
    return loadingTokens ? (
        <Loading />
    ) : data.length === 0 ? (
        <EmptyList />
    ) : (
        <FlatList keyExtractor={item => item.address} data={data} renderItem={renderItem} />
    );
};

const EmptyList = () => {
    return (
        <View style={{ margin: Spacing.normal }}>
            <Text disabled={true} style={{ textAlign: "center", width: "100%" }}>
                {"You don't have any matching tokens."}
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
    const onPress = useCallback(() => {
        props.onSelectToken(props.token);
    }, [props.onSelectToken, props.token]);
    return (
        <Selectable
            selected={props.selected}
            onPress={onPress}
            disabled={props.disabled || props.selectable}
            containerStyle={{
                marginBottom: ITEM_SEPARATOR_HEIGHT
            }}>
            <FlexView style={{ alignItems: "center" }}>
                <TokenLogo token={props.token} disabled={props.disabled} />
                <TokenName token={props.token} disabled={props.disabled} />
                <TokenAmount token={props.token} disabled={props.disabled} style={{ flex: 1, textAlign: "right" }} />
                <TokenSymbol token={props.token} disabled={props.disabled} />
            </FlexView>
        </Selectable>
    );
};

export default TokenSelect;
