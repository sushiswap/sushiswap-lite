import React, { FC, useCallback, useMemo } from "react";
import { FlatList, Platform, TextStyle, View } from "react-native";

import BackgroundImage from "../components/BackgroundImage";
import Border from "../components/Border";
import Container from "../components/Container";
import Content from "../components/Content";
import FlexView from "../components/FlexView";
import Heading from "../components/Heading";
import Loading from "../components/Loading";
import Text from "../components/Text";
import Title from "../components/Title";
import TokenAmount from "../components/TokenAmount";
import TokenLogo from "../components/TokenLogo";
import TokenName from "../components/TokenName";
import TokenSymbol from "../components/TokenSymbol";
import WebFooter from "../components/web/WebFooter";
import { IS_DESKTOP, Spacing } from "../constants/dimension";
import useHomeState, { HomeState } from "../hooks/useHomeState";
import useLinker from "../hooks/useLinker";
import LPTokenWithValue from "../types/LPTokenWithValue";
import TokenWithValue from "../types/TokenWithValue";
import { formatUSD } from "../utils";
import Screen from "./Screen";

interface TokenItemProps {
    token: TokenWithValue;
    disabled?: boolean;
}

interface LPTokenItemProps {
    token: LPTokenWithValue;
    disabled?: boolean;
}

const HomeScreen = () => {
    const state = useHomeState();
    const totalValue = sum(state.tokens) + sum(state.lpTokens) + sum(state.pools);
    return (
        <Screen>
            <Container>
                <BackgroundImage />
                <Content style={{ paddingBottom: Spacing.huge }}>
                    <FlexView style={{ alignItems: "flex-end", marginRight: Spacing.tiny }}>
                        <Title text={"Total Value"} style={{ flex: 1 }} />
                        <Title
                            text={formatUSD(totalValue)}
                            fontWeight={"light"}
                            style={{
                                fontSize: IS_DESKTOP ? 36 : 24
                            }}
                        />
                    </FlexView>
                    <Home state={state} />
                </Content>
                {Platform.OS === "web" && <WebFooter />}
            </Container>
        </Screen>
    );
};

const Home = ({ state }: { state: HomeState }) => {
    return (
        <View style={{ marginTop: Spacing.large }}>
            <MyTokens state={state} />
            <View style={{ height: Spacing.large + (IS_DESKTOP ? Spacing.normal : 0) }} />
            <MyLPTokens state={state} />
            <View style={{ height: Spacing.large + (IS_DESKTOP ? Spacing.normal : 0) }} />
            <Pools state={state} />
        </View>
    );
};

const MyTokens = ({ state }: { state: HomeState }) => {
    const goToSwap = useLinker("/swap", "Swap");
    return (
        <View>
            <Heading text={"Tokens"} buttonText={"Swap"} onPressButton={goToSwap} />
            <TokenList loading={state.loadingTokens} tokens={state.tokens} TokenItem={TokenItem} />
        </View>
    );
};

const MyLPTokens = ({ state }: { state: HomeState }) => {
    const goToRemoveLiquidity = useLinker("/liquidity/remove", "RemoveLiquidity");
    return (
        <View>
            <Heading text={"Liquidity"} buttonText={"Manage"} onPressButton={goToRemoveLiquidity} />
            {/* @ts-ignore */}
            <TokenList loading={state.loadingLPTokens} tokens={state.lpTokens} TokenItem={LPTokenItem} />
        </View>
    );
};

const Pools = ({ state }: { state: HomeState }) => {
    return (
        <View>
            <Heading text={"Farming"} />
            {/* @ts-ignore */}
            <TokenList loading={state.loadingPools} tokens={state.pools} TokenItem={LPTokenItem} />
        </View>
    );
};

const TokenList = (props: {
    loading: boolean;
    tokens?: TokenWithValue[] | LPTokenWithValue[];
    TokenItem: FC<TokenItemProps | LPTokenItemProps>;
}) => {
    const renderItem = useCallback(({ item }) => {
        return <props.TokenItem key={item.address} token={item} />;
    }, []);
    const data = useMemo(
        () =>
            (props.tokens || [])
                // @ts-ignore
                .filter(token => !(token.amountDeposited ? token.amountDeposited.isZero() : token.balance.isZero()))
                .sort((t1, t2) => (t2.valueUSD || 0) - (t1.valueUSD || 0)),
        [props.tokens]
    );
    return props.loading ? (
        <Loading />
    ) : data.length === 0 ? (
        <EmptyList />
    ) : (
        <FlatList
            keyExtractor={item => item.address}
            data={data}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <Border small={true} />}
        />
    );
};

const EmptyList = () => {
    return (
        <View style={{ margin: Spacing.normal }}>
            <Text disabled={true} style={{ textAlign: "center", width: "100%" }}>
                {"You don't have any matching asset."}
            </Text>
        </View>
    );
};

const TokenItem = (props: TokenItemProps) => {
    return (
        <FlexView style={{ alignItems: "center", paddingHorizontal: Spacing.tiny, paddingVertical: 4 }}>
            <TokenLogo token={props.token} disabled={props.disabled} />
            <TokenName token={props.token} disabled={props.disabled} />
            <View style={{ flex: 1, alignItems: "flex-end" }}>
                <TokenPrice token={props.token} disabled={props.disabled} />
                <FlexView>
                    <TokenAmount token={props.token} disabled={props.disabled} />
                    {IS_DESKTOP && <TokenSymbol token={props.token} disabled={props.disabled} />}
                </FlexView>
            </View>
        </FlexView>
    );
};

const LPTokenItem = (props: LPTokenItemProps) => {
    return (
        <FlexView style={{ alignItems: "center", paddingHorizontal: Spacing.tiny, paddingVertical: 4 }}>
            <TokenLogo token={props.token.tokenA} small={true} replaceWETH={true} />
            <TokenLogo token={props.token.tokenB} small={true} replaceWETH={true} style={{ marginLeft: 4 }} />
            <Text medium={true} caption={true} style={{ marginLeft: Spacing.tiny }}>
                {props.token.tokenA.symbol}-{props.token.tokenB.symbol}
            </Text>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
                <TokenPrice token={props.token} disabled={props.disabled} />
                <FlexView>
                    <TokenAmount token={props.token} amount={props.token.amountDeposited} disabled={props.disabled} />
                </FlexView>
            </View>
        </FlexView>
    );
};

const TokenPrice = (props: { token: TokenWithValue; disabled?: boolean; style?: TextStyle }) => {
    return (
        <Text note={true} fontWeight={"light"} disabled={props.disabled} style={props.style}>
            {formatUSD(props.token.valueUSD || 0, 4)}
        </Text>
    );
};

const sum = tokens => (tokens ? tokens.reduce((previous, current) => previous + (current.valueUSD || 0), 0) : 0);

export default HomeScreen;
