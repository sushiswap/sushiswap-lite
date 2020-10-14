import React, { useCallback, useState } from "react";
import { ActivityIndicator, Platform } from "react-native";

import useAsyncEffect from "use-async-effect";
import ApproveButton from "../components/ApproveButton";
import Button from "../components/Button";
import Column from "../components/Column";
import Container from "../components/Container";
import Content from "../components/Content";
import ErrorMessage from "../components/ErrorMessage";
import FetchingButton from "../components/FetchingButton";
import Guide from "../components/Guide";
import InsufficientBalanceButton from "../components/InsufficientBalanceButton";
import Meta from "../components/Meta";
import Notice from "../components/Notice";
import Text from "../components/Text";
import TokenInput from "../components/TokenInput";
import TokenSelect from "../components/TokenSelect";
import UnsupportedButton from "../components/UnsupportedButton";
import WebFooter from "../components/web/WebFooter";
import { ROUTER } from "../constants/contracts";
import { Spacing } from "../constants/dimension";
import Fraction from "../constants/Fraction";
import useAddLiquidityState, { AddLiquidityState } from "../hooks/useAddLiquidityState";
import useLinker from "../hooks/useLinker";
import MetamaskError from "../types/MetamaskError";
import { convertAmount, convertToken, isEmptyValue, parseBalance } from "../utils";
import Screen from "./Screen";

const LiquidityScreen = () => {
    return (
        <Screen>
            <Container>
                <Content>
                    <AddLiquidity />
                    {Platform.OS === "web" && <WebFooter />}
                </Content>
            </Container>
        </Screen>
    );
};

const AddLiquidity = () => {
    const state = useAddLiquidityState();
    return (
        <>
            <Column>
                <Text h4={true} style={{ textAlign: "center", marginBottom: Spacing.normal }}>
                    🔥 Add Liquidity
                </Text>
            </Column>
            <TokenSelect
                title={"1. Select the 1st token you want to ADD:"}
                hidden={false}
                symbol={state.fromSymbol}
                onChangeSymbol={state.setFromSymbol}
                filterTokens={token => token.balance && !token.balance.isZero()}
            />
            <TokenSelect
                title={"2. Select the 2nd token you want to ADD:"}
                hidden={state.fromSymbol === ""}
                symbol={state.toSymbol}
                onChangeSymbol={state.setToSymbol}
                filterTokens={token => token.symbol !== state.fromSymbol && token.balance && !token.balance.isZero()}
            />
            <FromTokenInput state={state} />
            <ToTokenInput state={state} />
            <PriceInfo state={state} />
            <Controls state={state} />
            <RemoveLiquidityGuide state={state} />
        </>
    );
};

const FromTokenInput = ({ state }: { state: AddLiquidityState }) => {
    const onAmountChanged = useCallback(
        (newAmount: string) => {
            state.setFromAmount(newAmount);
            if (state.pair && state.fromToken) {
                const fromPrice = state.pair.priceOf(convertToken(state.fromToken));
                state.setToAmount(fromPrice.quote(convertAmount(state.fromToken, newAmount)).toExact());
            }
        },
        [state.pair, state.fromToken]
    );
    if (state.loading)
        return (
            <Column>
                <ActivityIndicator size={"large"} />
            </Column>
        );
    return (
        <TokenInput
            title={"3. How many tokens do you want to supply?"}
            token={state.fromToken}
            hidden={!state.fromToken || !state.toToken || state.loading}
            amount={state.fromAmount}
            onAmountChanged={onAmountChanged}
        />
    );
};

const ToTokenInput = ({ state }: { state: AddLiquidityState }) => {
    const onAmountChanged = useCallback(
        (newAmount: string) => {
            state.setToAmount(newAmount);
            if (state.pair && state.toToken) {
                const toPrice = state.pair.priceOf(convertToken(state.toToken));
                state.setFromAmount(toPrice.quote(convertAmount(state.toToken, newAmount)).toExact());
            }
        },
        [state.pair, state.toToken]
    );
    return (
        <TokenInput
            token={state.toToken}
            hidden={!state.fromToken || !state.toToken || state.loading}
            amount={state.toAmount}
            onAmountChanged={onAmountChanged}
        />
    );
};

const PriceInfo = ({ state }: { state: AddLiquidityState }) => {
    if (!state.fromToken || !state.toToken || state.loading) {
        return <Column noTopMargin={true} />;
    }
    if (!isEmptyValue(state.fromAmount) && !state.loading && !state.pair) {
        const initialPrice = Fraction.from(
            parseBalance(state.toAmount, state.toToken.decimals),
            parseBalance(state.fromAmount, state.fromToken.decimals)
        );
        return (
            <Column noTopMargin={true}>
                <Notice
                    text={
                        "You are the first liquidity provider.\n" +
                        "The ratio of tokens you add will set the price of this pool."
                    }
                />
                {!!state.fromAmount && !!state.toAmount && (
                    <PriceMeta price={initialPrice} fromSymbol={state.fromSymbol} toSymbol={state.toSymbol} />
                )}
            </Column>
        );
    }
    const price = state.pair ? state.pair.priceOf(convertToken(state.fromToken)).toFixed(8) : "…";
    return (
        <Column noTopMargin={true}>
            <PriceMeta price={price} fromSymbol={state.fromSymbol} toSymbol={state.toSymbol} />
        </Column>
    );
};

const PriceMeta = ({ price, fromSymbol, toSymbol }) => (
    <Meta label={"Price"} text={price.toString()} suffix={toSymbol + " = 1 " + fromSymbol} />
);

// tslint:disable-next-line:max-func-body-length
const Controls = ({ state }: { state: AddLiquidityState }) => {
    const [error, setError] = useState<MetamaskError>({});
    useAsyncEffect(() => setError({}), [state.fromSymbol, state.toSymbol, state.fromAmount]);
    if (!state.fromToken || !state.toToken || state.loading) {
        return <Column noTopMargin={true} />;
    }
    const insufficientFromToken = parseBalance(state.fromAmount, state.fromToken.decimals).gt(state.fromToken.balance);
    const insufficientToToken = parseBalance(state.toAmount, state.toToken.decimals).gt(state.toToken.balance);
    const fromApproveRequired = state.fromSymbol !== "ETH" && !state.fromTokenAllowed;
    const toApproveRequired = state.toSymbol !== "ETH" && !state.toTokenAllowed;
    const disabled =
        fromApproveRequired || toApproveRequired || isEmptyValue(state.fromAmount) || isEmptyValue(state.toAmount);
    return (
        <Column>
            {insufficientFromToken ? (
                <InsufficientBalanceButton symbol={state.fromSymbol} />
            ) : insufficientToToken ? (
                <InsufficientBalanceButton symbol={state.toSymbol} />
            ) : state.loading || !state.pair ? (
                <FetchingButton />
            ) : (state.fromSymbol === "ETH" && state.toSymbol === "WETH") ||
              (state.fromSymbol === "WETH" && state.toSymbol === "ETH") ? (
                <UnsupportedButton state={state} />
            ) : (
                <>
                    <ApproveButton
                        token={state.fromToken}
                        spender={ROUTER}
                        onSuccess={() => state.setFromTokenAllowed(true)}
                        onError={setError}
                        hidden={!fromApproveRequired}
                    />
                    <ApproveButton
                        token={state.toToken}
                        spender={ROUTER}
                        onSuccess={() => state.setToTokenAllowed(true)}
                        onError={setError}
                        hidden={!toApproveRequired}
                    />
                    <SupplyButton state={state} onError={setError} disabled={disabled} />
                </>
            )}
            {error.message && error.code !== 4001 && <ErrorMessage error={error} />}
        </Column>
    );
};

const SupplyButton = ({
    state,
    onError,
    disabled
}: {
    state: AddLiquidityState;
    onError: (e) => void;
    disabled: boolean;
}) => {
    const onPress = useCallback(() => {
        onError({});
        state.onAdd().catch(onError);
    }, [state.onAdd, onError]);
    return (
        <Button
            size={"large"}
            title={"Supply " + state.fromSymbol + "-" + state.toSymbol}
            disabled={disabled}
            loading={state.adding}
            onPress={onPress}
        />
    );
};

const RemoveLiquidityGuide = ({ state }: { state: AddLiquidityState }) => {
    const onPress = useLinker("/#/liquidity/remove", "RemoveLiquidity", "_self");
    return (
        <Guide
            hidden={state.fromSymbol !== ""}
            text={"☘️ What if you want to remove existing liquidity?"}
            buttonTitle={"Click Here!"}
            onPressButton={onPress}
        />
    );
};

export default LiquidityScreen;
