import React, { useCallback, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Icon } from "react-native-elements";

import useAsyncEffect from "use-async-effect";
import ApproveButton from "../components/ApproveButton";
import Button from "../components/Button";
import Column from "../components/Column";
import Container from "../components/Container";
import Content from "../components/Content";
import ErrorMessage from "../components/ErrorMessage";
import FlexView from "../components/FlexView";
import InsufficientBalanceButton from "../components/InsufficientBalanceButton";
import Text from "../components/Text";
import TokenInput from "../components/TokenInput";
import TokenSelect from "../components/TokenSelect";
import UnsupportedButton from "../components/UnsupportedButton";
import { Spacing } from "../constants/dimension";
import { ETH } from "../constants/tokens";
import useColors from "../hooks/useColors";
import useSDK from "../hooks/useSDK";
import useSwapState, { SwapState } from "../hooks/useSwapState";
import MetamaskError from "../types/MetamaskError";
import { formatBalance, isEmptyValue, parseBalance } from "../utils";
import Screen from "./Screen";

const SwapScreen = () => {
    return (
        <Screen>
            <Container>
                <Content>
                    <View style={{ alignItems: "center", marginBottom: Spacing.large }}>
                        <Column>
                            <Text h4={true} style={{ textAlign: "center" }}>
                                🍣 Swap Tokens
                            </Text>
                        </Column>
                        <Swap />
                    </View>
                </Content>
            </Container>
        </Screen>
    );
};

const Swap = () => {
    const state = useSwapState();
    return (
        <>
            <TokenSelect
                title={"1. Which token do you want to SELL?"}
                hidden={false}
                symbol={state.fromSymbol}
                onChangeSymbol={state.setFromSymbol}
                filterTokens={token => token.balance && !token.balance.isZero()}
            />
            <TokenSelect
                title={"2. Which token do you want to BUY?"}
                hidden={state.fromSymbol === ""}
                symbol={state.toSymbol}
                onChangeSymbol={state.setToSymbol}
                filterTokens={token => token.symbol !== state.fromSymbol}
            />
            <TokenInput
                title={"3. How much " + (state.fromSymbol || "tokens") + " do you want to SELL?"}
                token={state.fromToken}
                hidden={!state.fromToken}
                amount={state.fromAmount}
                onAmountChanged={state.setFromAmount}
            />
            <TradeInfo state={state} />
            <Controls state={state} />
        </>
    );
};

const TradeInfo = ({ state }: { state: SwapState }) => {
    if (
        !isEmptyValue(state.fromAmount) &&
        ((state.fromSymbol === "ETH" && state.toSymbol === "WETH") ||
            (state.fromSymbol === "WETH" && state.toSymbol === "ETH"))
    ) {
        return <WrapInfo state={state} />;
    }
    const amount = state.trade?.outputAmount?.toSignificant(8);
    if (state.fromSymbol === "" || state.toSymbol === "" || isEmptyValue(state.fromAmount) || !amount) {
        return <Column noTopMargin={true} />;
    }
    return <SwapInfo state={state} />;
};

const WrapInfo = ({ state }: { state: SwapState }) => {
    return (
        <Column noTopMargin={true}>
            <ArrowDown />
            <Text style={{ fontSize: 30, textAlign: "center" }}>
                {state.fromAmount} {state.toSymbol}
            </Text>
        </Column>
    );
};

const SwapInfo = ({ state }: { state: SwapState }) => {
    const { calculateFee } = useSDK();
    const amount = state.trade?.outputAmount?.toSignificant(8);
    const price = state.trade?.executionPrice?.toSignificant(8);
    const impact = state.trade?.priceImpact?.toSignificant(2);
    const fee = state.fromToken
        ? formatBalance(
              calculateFee(parseBalance(state.fromAmount, state.fromToken.decimals)),
              state.fromToken.decimals,
              8
          )
        : "";
    return (
        <Column noTopMargin={true}>
            <ArrowDown />
            <Text style={{ fontSize: 30, textAlign: "center", marginBottom: Spacing.normal }}>
                {amount} {state.toSymbol}
            </Text>
            <Row label={"Price"} text={price ? price + " " + state.toSymbol + "  = 1 " + state.fromSymbol : "..."} />
            <Row label={"Price Impact"} text={impact ? impact + "%" : "..."} />
            <Row label={"Fee (0.30%)"} text={fee ? fee + " " + state.fromSymbol : "..."} />
        </Column>
    );
};

const ArrowDown = () => {
    const { textLight } = useColors();
    return <Icon type={"material-community"} name={"arrow-down"} color={textLight} style={{ margin: Spacing.tiny }} />;
};

// tslint:disable-next-line:max-func-body-length
const Controls = ({ state }: { state: SwapState }) => {
    const [error, setError] = useState<MetamaskError>({});
    useAsyncEffect(() => setError({}), [state.fromSymbol, state.toSymbol, state.fromAmount]);
    if (state.toSymbol === "" || isEmptyValue(state.fromAmount) || !state.fromToken) {
        return <Column noTopMargin={true} />;
    }
    const approveRequired = state.fromSymbol !== "ETH" && !state.fromTokenAllowed;
    return (
        <Column>
            {parseBalance(state.fromAmount, state.fromToken.decimals).gt(state.fromToken.balance) ? (
                <InsufficientBalanceButton state={state} />
            ) : state.fromSymbol === "WETH" && state.toSymbol === "ETH" ? (
                <UnwrapButton state={state} onError={setError} />
            ) : state.fromSymbol === "ETH" && state.toSymbol === "WETH" ? (
                <WrapButton state={state} onError={setError} />
            ) : state.unsupported ? (
                <UnsupportedButton state={state} />
            ) : state.loading || state.loadingAllowance || !state.trade ? (
                <ActivityIndicator size={"large"} />
            ) : (
                <>
                    {approveRequired && (
                        <>
                            <ApproveButton
                                token={state.fromToken}
                                onSuccess={() => state.setFromTokenAllowed(true)}
                                onError={setError}
                            />
                            <ArrowDown />
                        </>
                    )}
                    <SwapButton state={state} onError={setError} disabled={approveRequired} />
                </>
            )}
            {error.message && error.code !== 4001 && <ErrorMessage error={error} />}
        </Column>
    );
};

const SwapButton = ({ state, onError, disabled }: { state: SwapState; onError: (e) => void; disabled: boolean }) => {
    const onPress = useCallback(() => {
        onError({});
        state.onSwap().catch(onError);
    }, [state.onSwap, onError]);
    return (
        <Button
            size={"large"}
            title={"Swap " + state.fromSymbol + "-" + state.toSymbol}
            disabled={disabled}
            loading={state.swapping}
            onPress={onPress}
        />
    );
};

const WrapButton = ({ state, onError }: { state: SwapState; onError: (e) => void }) => {
    const onPress = useCallback(async () => {
        onError({});
        state.onWrap().catch(onError);
    }, []);
    return <Button size={"large"} title={"Wrap"} loading={state.wrapping} onPress={onPress} />;
};

const UnwrapButton = ({ state, onError }: { state: SwapState; onError: (e) => void }) => {
    const onPress = useCallback(async () => {
        onError({});
        state.onUnwrap().catch(onError);
    }, []);
    return <Button size={"large"} title={"Unwrap"} loading={state.unwrapping} onPress={onPress} />;
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

export default SwapScreen;
