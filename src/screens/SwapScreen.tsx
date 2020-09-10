import React, { useCallback, useContext, useState } from "react";
import { ActivityIndicator, FlatList, Image, TouchableHighlight, View } from "react-native";
import { Icon } from "react-native-elements";
import { Hoverable } from "react-native-web-hover";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import Button from "../components/Button";
import Container from "../components/Container";
import Content from "../components/Content";
import FlexView from "../components/FlexView";
import Input from "../components/Input";
import Text from "../components/Text";
import { Spacing } from "../constants/dimension";
import { ETH } from "../constants/tokens";
import { EthersContext } from "../context/EthersContext";
import { GlobalContext } from "../context/GlobalContext";
import { SwapContext } from "../context/SwapContext";
import useColors from "../hooks/useColors";
import useSDK, { UNISWAP_ROUTER } from "../hooks/useSDK";
import Token from "../model/Token";
import { formatBalance, parseBalance } from "../utils";

const SwapScreen = () => {
    const { provider, signer } = useContext(EthersContext);
    const { setTokens, tradeHistory } = useContext(GlobalContext);
    const [loading, setLoading] = useState(true);
    useAsyncEffect(async () => {
        if (provider && signer) {
            setLoading(true);
            await setTokens(await fetchTokens(provider, signer));
            setLoading(false);
        }
    }, [provider, signer, tradeHistory]);
    return (
        <Container>
            <Content>
                <View style={{ alignItems: "center", marginBottom: Spacing.huge }}>
                    <Column>
                        <Text h4={true} style={{ textAlign: "center" }}>
                            🍣 Swap Tokens
                        </Text>
                    </Column>
                    <TokenColumn from={true} loading={loading} />
                    <TokenColumn from={false} loading={loading} />
                    <TokenInput />
                    <TradeInfo />
                    <Controls />
                </View>
            </Content>
        </Container>
    );
};

const TokenColumn = (props: { from: boolean; loading: boolean }) => {
    const context = useContext(SwapContext);
    const [symbol, setSymbol, token] = props.from
        ? [context.fromSymbol, context.setFromSymbol, context.fromToken]
        : [context.toSymbol, context.setToSymbol, context.toToken];
    const [expanded, setExpanded] = useState(!props.from || symbol === "ETH");
    const onSelectToken = useCallback(t => {
        setSymbol(t.symbol);
        setExpanded(false);
    }, []);
    const onUnselectToken = useCallback(() => {
        setSymbol("");
        setExpanded(true);
    }, []);
    if (!props.from && context.fromSymbol === "") {
        return <Column />;
    }
    return (
        <Column>
            <Subtitle
                text={props.from ? "1. Which token do you want to SELL?" : "2. Which token do you want to BUY?"}
            />
            {token && !expanded ? (
                <TokenItem token={token} selected={true} onSelectToken={onUnselectToken} />
            ) : (
                <TokenList from={props.from} loading={props.loading} onSelectToken={onSelectToken} />
            )}
        </Column>
    );
};

const TokenList = (props: { from: boolean; loading: boolean; onSelectToken: (token: Token) => void }) => {
    const { tokens } = useContext(GlobalContext);
    const context = useContext(SwapContext);
    const renderItem = useCallback(({ item }) => {
        return <TokenItem token={item} selected={false} onSelectToken={props.onSelectToken} />;
    }, []);
    const data = props.loading
        ? []
        : props.from
        ? tokens.filter(token => token.balance && !token.balance.isZero())
        : tokens.filter(token => token.symbol !== context.fromSymbol);
    return props.loading ? (
        <ActivityIndicator size={"large"} style={{ marginTop: Spacing.large }} />
    ) : (
        <FlatList data={data} renderItem={renderItem} ItemSeparatorComponent={Border} />
    );
};

const TokenItem = (props: { token: Token; selected: boolean; onSelectToken: (token: Token) => void }) => {
    const { background, backgroundHovered, textMedium } = useColors();
    const onPress = useCallback(() => {
        props.onSelectToken(props.token);
    }, []);
    return (
        <Hoverable>
            {({ hovered }) => (
                <TouchableHighlight onPress={onPress}>
                    <View style={{ backgroundColor: hovered ? backgroundHovered : background }}>
                        <FlexView style={{ alignItems: "center", margin: Spacing.small }}>
                            <Image
                                source={{ uri: props.token.logoURI }}
                                style={{ width: 24, height: 24, backgroundColor: "white", borderRadius: 12 }}
                            />
                            <Text light={true} style={{ marginLeft: Spacing.small, fontSize: 20, color: textMedium }}>
                                {props.token.symbol}
                            </Text>
                            <Text light={true} style={{ flex: 1, textAlign: "right", fontSize: 20, color: textMedium }}>
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

const SelectIcon = () => {
    const { darkMode } = useContext(GlobalContext);
    const { primary, secondary } = useColors();
    return (
        <Icon
            type={"material-community"}
            name={"chevron-right"}
            color={darkMode ? secondary : primary}
            style={{ marginLeft: Spacing.small }}
        />
    );
};

const CloseIcon = () => {
    const { textLight } = useColors();
    return <Icon type={"material-community"} name={"close"} color={textLight} style={{ marginLeft: Spacing.small }} />;
};

const Border = () => {
    const { border } = useColors();
    return <View style={{ height: 1, width: "100%", backgroundColor: border }} />;
};

const TokenInput = () => {
    const { fromSymbol, toSymbol, fromAmount, setFromAmount, fromToken } = useContext(SwapContext);
    if (fromSymbol === "" || toSymbol === "") {
        return <Column />;
    }
    return (
        <Column>
            <Subtitle text={"3. How much " + (fromToken?.symbol || "tokens") + " do you want to SELL?"} />
            <View style={{ marginHorizontal: Spacing.small }}>
                <Input value={fromAmount} onChangeText={setFromAmount} placeholder={"0.0"} />
                {fromToken?.balance?.gt(0) && <MaxButton token={fromToken} setAmount={setFromAmount} />}
            </View>
        </Column>
    );
};

const MaxButton = (props: { token: Token; setAmount }) => {
    const onPressMax = useCallback(() => {
        if (props.token) {
            let balance = props.token.balance;
            if (props.token.symbol === "ETH") {
                // Subtract 0.01 ETH for gas fee
                balance = balance.sub(ethers.BigNumber.from(10).pow(16));
            }
            props.setAmount(formatBalance(balance, props.token.decimals));
        }
    }, [props]);
    return (
        <View style={{ position: "absolute", right: 0, top: 8 }}>
            <Button type={"clear"} size={"small"} title={"MAX"} fontWeight={"bold"} onPress={onPressMax} />
        </View>
    );
};

const Subtitle = ({ text }) => {
    return (
        <Text fontWeight={"bold"} medium={true} style={{ marginBottom: Spacing.normal, fontSize: 20 }}>
            {text}
        </Text>
    );
};

const TradeInfo = () => {
    const context = useContext(SwapContext);
    const { calculateFee } = useSDK();
    const amount = context.trade?.outputAmount?.toSignificant(8);
    const price = context.trade?.executionPrice?.toSignificant(8);
    const impact = context.trade?.priceImpact?.toSignificant(2);
    const fee = context.fromToken
        ? formatBalance(
              calculateFee(parseBalance(context.fromAmount, context.fromToken.decimals)),
              context.fromToken.decimals,
              8
          )
        : "";
    if (context.fromSymbol === "" || context.toSymbol === "" || isEmptyValue(context.fromAmount) || !amount) {
        return <Column />;
    }
    return (
        <Column noMargin={true}>
            <ArrowDown />
            <Text style={{ fontSize: 30, textAlign: "center", marginBottom: Spacing.normal }}>
                {amount} {context.toSymbol}
            </Text>
            <Row label={"Price"} text={price ? price + " " + context.toSymbol + " / " + context.fromSymbol : "..."} />
            <Row label={"Price Impact"} text={impact ? impact + "%" : "..."} />
            <Row label={"Fee (0.30%)"} text={fee ? fee + " " + context.fromSymbol : "..."} />
        </Column>
    );
};

const ArrowDown = () => {
    const { textLight } = useColors();
    return (
        <Icon
            type={"material-community"}
            name={"arrow-down"}
            color={textLight}
            style={{ marginVertical: Spacing.small }}
        />
    );
};

const ArrowRight = () => {
    const { textLight } = useColors();
    return (
        <Icon
            type={"material-community"}
            name={"arrow-right"}
            color={textLight}
            style={{ marginHorizontal: Spacing.small }}
        />
    );
};

const Controls = () => {
    const context = useContext(SwapContext);
    const [error, setError] = useState("");
    useAsyncEffect(() => setError(""), [context.fromSymbol, context.toSymbol, context.fromAmount]);
    if (context.toSymbol === "" || isEmptyValue(context.fromAmount) || !context.fromToken) {
        return <Column />;
    }
    return (
        <Column>
            {context.unsupported ? (
                <UnsupportedButton />
            ) : context.loading || !context.trade ? (
                <ActivityIndicator size={"large"} />
            ) : parseBalance(context.fromAmount, context.fromToken.decimals).gt(context.fromToken.balance) ? (
                <InsufficientBalanceButton />
            ) : context.fromSymbol === "ETH" || context.fromTokenAllowed ? (
                <SwapButton onError={setError} />
            ) : (
                <FlexView style={{ flex: 1, alignItems: "center" }}>
                    <ApproveButton onError={setError} />
                    <ArrowRight />
                    <SwapButton onError={setError} disabled={true} />
                </FlexView>
            )}
            <Text note={true} style={{ color: "red", margin: Spacing.tiny }}>
                {error}
            </Text>
        </Column>
    );
};

const UnsupportedButton = ({}) => {
    const { fromSymbol, toSymbol } = useContext(SwapContext);
    return <Button size={"large"} title={fromSymbol + "-" + toSymbol + " Not Supported"} disabled={true} />;
};

const InsufficientBalanceButton = ({}) => {
    const { fromSymbol } = useContext(SwapContext);
    return <Button size={"large"} title={"Insufficient " + fromSymbol + " Balance"} disabled={true} />;
};

const ApproveButton = ({ onError }) => {
    const { fromSymbol, fromToken, setFromTokenAllowed } = useContext(SwapContext);
    const { approveToken } = useContext(EthersContext);
    const [loading, setLoading] = useState(false);
    const onPress = useCallback(async () => {
        if (fromToken) {
            onError("");
            setLoading(true);
            try {
                const tx = await approveToken(fromToken.address, UNISWAP_ROUTER);
                await tx.wait();
                setFromTokenAllowed(true);
            } catch (e) {
                // tslint:disable-next-line:no-console
                console.error(e);
                onError(e.message.split("(")[0]);
            } finally {
                setLoading(false);
            }
        }
    }, [fromToken]);
    return (
        <View style={{ flex: 1 }}>
            <Button size={"large"} title={"Approve " + fromSymbol} onPress={onPress} loading={loading} />
        </View>
    );
};

// tslint:disable-next-line:max-func-body-length
const SwapButton = ({ onError, disabled = false }) => {
    const { swap } = useSDK();
    const { setFromSymbol, setToSymbol, fromToken, toToken, fromAmount } = useContext(SwapContext);
    const { addToTradeHistory } = useContext(GlobalContext);
    const { signer } = useContext(EthersContext);
    const [loading, setLoading] = useState(false);
    const title = "Swap";
    const onPress = useCallback(async () => {
        if (fromToken && toToken && fromAmount && signer) {
            onError("");
            setLoading(true);
            try {
                const amount = parseBalance(fromAmount, fromToken.decimals);
                const result = await swap(fromToken, toToken, amount);
                if (result) {
                    await result.tx.wait();
                    await addToTradeHistory(await signer.getAddress(), result.trade);
                    setFromSymbol("");
                    setToSymbol("");
                }
            } catch (e) {
                // tslint:disable-next-line:no-console
                console.error(e);
                onError(e.message.split("(")[0]);
            } finally {
                setLoading(false);
            }
        }
    }, [fromToken, toToken, fromAmount, signer]);
    return (
        <View style={{ flex: 1 }}>
            <Button size={"large"} title={title} disabled={disabled} loading={loading} onPress={onPress} />
        </View>
    );
};

const Row = ({ label, text }) => {
    return (
        <FlexView style={{ justifyContent: "space-between", marginTop: Spacing.tiny, marginHorizontal: Spacing.small }}>
            <Text fontWeight={"bold"} style={{ fontSize: 14 }}>
                {label}
            </Text>
            <Text style={{ fontSize: 14 }}>{text}</Text>
        </FlexView>
    );
};

const Column = props => <View {...props} style={{ width: 440, marginTop: props.noMargin ? 0 : Spacing.large }} />;

const isEmptyValue = (text: string) =>
    ethers.BigNumber.isBigNumber(text) ? ethers.BigNumber.from(text).isZero() : text === "" || text === "0";

const fetchTokens = async (provider: ethers.providers.JsonRpcProvider, signer: ethers.providers.JsonRpcSigner) => {
    const response = await fetch("/tokens.json");
    const json = await response.json();
    const tokens = json.tokens;

    const account = await signer.getAddress();
    const balance = await provider.getBalance(account);
    const balances = await provider.send("alchemy_getTokenBalances", [account, tokens.map(token => token.address)]);
    return [
        {
            ...ETH,
            balance
        },
        ...tokens.map((token, i) => ({
            ...token,
            balance: ethers.BigNumber.from(balances.tokenBalances[i].tokenBalance || 0)
        }))
    ].sort((t1, t2) => {
        return (t2.balance.isZero() ? 0 : 1) - (t1.balance.isZero() ? 0 : 1);
    });
};

export default SwapScreen;
