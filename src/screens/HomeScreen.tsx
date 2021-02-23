import React, { FC, useCallback, useContext, useMemo } from "react";
import { FlatList, Platform, TouchableHighlight, View } from "react-native";
import { Icon } from "react-native-elements";

import { ethers } from "ethers";
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
import TokenPrice from "../components/TokenPrice";
import TokenSymbol from "../components/TokenSymbol";
import TokenValue from "../components/TokenValue";
import WebFooter from "../components/web/WebFooter";
import { IS_DESKTOP, Spacing } from "../constants/dimension";
import { EthersContext } from "../context/EthersContext";
import useColors from "../hooks/useColors";
import useHomeState, { HomeState } from "../hooks/useHomeState";
import useLinker from "../hooks/useLinker";
import useTranslation from "../hooks/useTranslation";
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
    const t = useTranslation();
    const state = useHomeState();
    const { loadingTokens } = useContext(EthersContext);
    const loading = loadingTokens || state.loadingLPTokens || state.loadingPools;
    const totalValue = sum(state.tokens) + sum(state.lpTokens) + sum(state.pools);
    return (
        <Screen>
            <Container>
                <BackgroundImage />
                <Content style={{ paddingBottom: Spacing.huge }}>
                    <Title text={t("total-value")} style={{ flex: 1, marginTop: Spacing.normal }} />
                    <Title
                        text={loading ? t("fetching") : formatUSD(totalValue, 4)}
                        fontWeight={"light"}
                        disabled={loading}
                        style={{ fontSize: IS_DESKTOP ? 32 : 24 }}
                    />
                    <Home state={state} />
                </Content>
                {Platform.OS === "web" && <WebFooter />}
            </Container>
        </Screen>
    );
};

const Home = ({ state }: { state: HomeState }) => {
    return (
        <View style={{ marginTop: IS_DESKTOP ? Spacing.large : Spacing.normal }}>
            <MyTokens state={state} />
            <View style={{ height: Spacing.large }} />
            <MyLPTokens state={state} />
            <View style={{ height: Spacing.large }} />
            <Pools state={state} />
        </View>
    );
};

const MyTokens = ({ state }: { state: HomeState }) => {
    const t = useTranslation();
    const { loadingTokens, tokens } = useContext(EthersContext);
    const goToSwap = useLinker("/swap", "Swap");
    return (
        <View>
            <Heading text={t("tokens")} buttonText={t("manage")} onPressButton={goToSwap} />
            <TokenList loading={loadingTokens} tokens={tokens} TokenItem={TokenItem} />
        </View>
    );
};

const MyLPTokens = ({ state }: { state: HomeState }) => {
    const t = useTranslation();
    const goToRemoveLiquidity = useLinker("/liquidity/remove", "RemoveLiquidity");
    return (
        <View>
            <Heading text={t("liquidity")} buttonText={t("manage")} onPressButton={goToRemoveLiquidity} />
            {/* @ts-ignore */}
            <TokenList loading={state.loadingLPTokens} tokens={state.lpTokens} TokenItem={LPTokenItem} />
        </View>
    );
};

const Pools = ({ state }: { state: HomeState }) => {
    const t = useTranslation();
    const goToFarming = useLinker("/farming", "Farming");
    return (
        <View>
            <Heading text={t("farms")} buttonText={t("manage")} onPressButton={goToFarming} />
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
    const t = useTranslation();
    return (
        <View style={{ margin: Spacing.normal }}>
            <Text disabled={true} style={{ textAlign: "center", width: "100%" }}>
                {t("you-dont-have-assets")}
            </Text>
        </View>
    );
};

const TokenItem = (props: TokenItemProps) => {
    return (
        <FlexView style={{ alignItems: "center", paddingHorizontal: Spacing.tiny, paddingVertical: 4 }}>
            <TokenLogo token={props.token} disabled={props.disabled} />
            <View>
                <TokenPrice token={props.token} disabled={props.disabled} style={{ marginLeft: Spacing.small }} />
                <TokenName token={props.token} disabled={props.disabled} />
            </View>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
                <TokenValue token={props.token} disabled={props.disabled} />
                <FlexView>
                    <TokenAmount token={props.token} disabled={props.disabled} />
                    {IS_DESKTOP && <TokenSymbol token={props.token} disabled={props.disabled} />}
                </FlexView>
            </View>
            <ExternalIcon path={"/tokens/" + props.token.address} />
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
                <TokenValue token={props.token} disabled={props.disabled} />
                <FlexView>
                    <TokenAmount token={props.token} amount={props.token.amountDeposited} disabled={props.disabled} />
                </FlexView>
            </View>
            <ExternalIcon path={"/pairs/" + props.token.address} />
        </FlexView>
    );
};

const ExternalIcon = ({ path }) => {
    const { textDark, disabled } = useColors();
    const onPress = () => window.open("https://sushiswapanalytics.com/" + path.toLowerCase(), "_blank");
    const isETH = path.endsWith(ethers.constants.AddressZero);
    return (
        <TouchableHighlight onPress={onPress} disabled={isETH}>
            <Icon
                type={"evilicon"}
                name={"external-link"}
                color={isETH ? disabled : textDark}
                style={{ marginLeft: Spacing.tiny }}
            />
        </TouchableHighlight>
    );
};

const sum = tokens => (tokens ? tokens.reduce((previous, current) => previous + (current.valueUSD || 0), 0) : 0);

export default HomeScreen;
