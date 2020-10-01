import React, { FC, useCallback, useContext, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, TouchableHighlight, View } from "react-native";
import { Hoverable } from "react-native-web-hover";

import { Spacing } from "../constants/dimension";
import { EthersContext } from "../context/EthersContext";
import useColors from "../hooks/useColors";
import Token from "../types/Token";
import { formatBalance } from "../utils";
import Border from "./Border";
import CloseIcon from "./CloseIcon";
import Column from "./Column";
import FlexView from "./FlexView";
import SelectIcon from "./SelectIcon";
import Subtitle from "./Subtitle";
import Text from "./Text";

interface TokenSelectProps {
    title: string;
    hidden: boolean;
    symbol: string;
    onChangeSymbol: (symbol: string) => void;
    filterTokens: (token: Token) => boolean;
}

const TokenSelect: FC<TokenSelectProps> = props => {
    const { tokens } = useContext(EthersContext);
    const token = tokens.find(t => t.symbol === props.symbol);
    const onSelectToken = useCallback(
        t => {
            props.onChangeSymbol(t.symbol);
        },
        [props.onChangeSymbol]
    );
    const onUnselectToken = useCallback(() => {
        props.onChangeSymbol("");
    }, [props.onChangeSymbol]);
    if (/*!props.from && props.oppositeSymbol === ""*/ props.hidden) {
        return <Column noTopMargin={true} />;
    }
    return (
        <Column>
            <Subtitle text={props.title} />
            {token ? (
                <TokenItem token={token} selected={true} onSelectToken={onUnselectToken} />
            ) : (
                <TokenList filterTokens={props.filterTokens} onSelectToken={onSelectToken} />
            )}
        </Column>
    );
};

// tslint:disable-next-line:max-func-body-length
const TokenList = (props: { filterTokens: (token: Token) => boolean; onSelectToken: (token: Token) => void }) => {
    const { loadingTokens, tokens } = useContext(EthersContext);
    const renderItem = useCallback(
        ({ item }) => {
            return <TokenItem key={item.address} token={item} selected={false} onSelectToken={props.onSelectToken} />;
        },
        [props.onSelectToken]
    );
    const data = useMemo(
        () =>
            tokens
                .filter(props.filterTokens)
                .sort(
                    (t1, t2) =>
                        (t2.balance.isZero() ? 0 : 10000000000) -
                        (t1.balance.isZero() ? 0 : 10000000000) +
                        t1.symbol.localeCompare(t2.symbol)
                ),
        [tokens]
    );
    return loadingTokens ? (
        <ActivityIndicator size={"large"} style={{ marginTop: Spacing.large }} />
    ) : data.length === 0 ? (
        <EmptyList />
    ) : (
        <FlatList
            keyExtractor={item => JSON.stringify(item)}
            data={data}
            renderItem={renderItem}
            ItemSeparatorComponent={Border}
        />
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

const TokenItem = (props: { token: Token; selected: boolean; onSelectToken: (token: Token) => void }) => {
    const { background, backgroundHovered, textMedium } = useColors();
    const [isEmpty, setIsEmpty] = useState(false);
    const onPress = useCallback(() => {
        props.onSelectToken(props.token);
    }, [props.onSelectToken, props.token]);
    const source = isEmpty ? require("../../assets/empty-token.png") : { uri: props.token.logoURI };
    return (
        <Hoverable>
            {({ hovered }) => (
                <TouchableHighlight onPress={onPress}>
                    <View style={{ backgroundColor: hovered ? backgroundHovered : background }}>
                        <FlexView style={{ alignItems: "center", margin: Spacing.small }}>
                            <Image
                                source={source}
                                onError={() => setIsEmpty(true)}
                                style={{ width: 24, height: 24, backgroundColor: "white", borderRadius: 12 }}
                            />
                            <Text light={true} style={{ marginLeft: Spacing.small, fontSize: 22, color: textMedium }}>
                                {props.token.symbol}
                            </Text>
                            <Text light={true} style={{ flex: 1, textAlign: "right", fontSize: 22, color: textMedium }}>
                                {formatBalance(props.token.balance, props.token.decimals, 8)}
                            </Text>
                            {props.selected ? <CloseIcon /> : <SelectIcon />}
                        </FlexView>
                    </View>
                </TouchableHighlight>
            )}
        </Hoverable>
    );
};

export default TokenSelect;
