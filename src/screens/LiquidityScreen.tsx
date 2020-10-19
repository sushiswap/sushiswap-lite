import React, { useCallback, useState } from "react";
import { Platform, View } from "react-native";

import useAsyncEffect from "use-async-effect";
import ApproveButton from "../components/ApproveButton";
import Border from "../components/Border";
import Button from "../components/Button";
import Container from "../components/Container";
import Content from "../components/Content";
import ErrorMessage from "../components/ErrorMessage";
import FetchingButton from "../components/FetchingButton";
import Heading from "../components/Heading";
import InfoBox from "../components/InfoBox";
import InsufficientBalanceButton from "../components/InsufficientBalanceButton";
import ItemSeparator from "../components/ItemSeparator";
import Meta from "../components/Meta";
import Notice from "../components/Notice";
import Text from "../components/Text";
import Title from "../components/Title";
import TokenInput from "../components/TokenInput";
import TokenSelect from "../components/TokenSelect";
import UnsupportedButton from "../components/UnsupportedButton";
import WebFooter from "../components/web/WebFooter";
import WebSubMenu from "../components/web/WebSubMenu";
import { ROUTER } from "../constants/contracts";
import { Spacing } from "../constants/dimension";
import Fraction from "../constants/Fraction";
import useAddLiquidityState, { AddLiquidityState } from "../hooks/useAddLiquidityState";
import useColors from "../hooks/useColors";
import useSDK from "../hooks/useSDK";
import MetamaskError from "../types/MetamaskError";
import { convertAmount, convertToken, isEmptyValue, parseBalance } from "../utils";
import Screen from "./Screen";

const LiquidityScreen = () => {
    return (
        <Screen>
            <WebSubMenu
                items={[
                    {
                        title: "Add Liquidity",
                        path: "/liquidity"
                    },
                    {
                        title: "Remove Liquidity",
                        path: "/liquidity/remove"
                    }
                ]}
            />
            <Container>
                <Content>
                    <Title text={"Add Liquidity"} />
                    <Text light={true}>Add liquidity to a pool and get LP tokens of the pair.</Text>
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
        <View style={{ marginTop: Spacing.large }}>
            <TokenSelect
                title={"1st Token"}
                symbol={state.fromSymbol}
                onChangeSymbol={state.setFromSymbol}
                hidden={token => token.balance.isZero()}
            />
            <Border />
            <ToTokenSelect state={state} />
            <Border />
            <FromTokenInput state={state} />
            <ItemSeparator />
            <ToTokenInput state={state} />
            <ItemSeparator />
            <PriceInfo state={state} />
        </View>
    );
};

const ToTokenSelect = ({ state }: { state: AddLiquidityState }) => {
    if (!state.fromSymbol) {
        return <Heading text={"2nd Token"} disabled={true} />;
    }
    return (
        <View>
            <TokenSelect
                title={"2nd Token"}
                symbol={state.toSymbol}
                onChangeSymbol={state.setToSymbol}
                hidden={token => token.symbol === state.fromSymbol || token.balance.isZero()}
            />
        </View>
    );
};

const FromTokenInput = ({ state }: { state: AddLiquidityState }) => {
    if (!state.fromSymbol || !state.toSymbol) {
        return <Heading text={"Amount of Tokens"} disabled={true} />;
    }
    const onAmountChanged = (newAmount: string) => {
        state.setFromAmount(newAmount);
        if (state.pair && state.fromToken) {
            const fromPrice = state.pair.priceOf(convertToken(state.fromToken));
            const toAmount = fromPrice.quote(convertAmount(state.fromToken, newAmount)).toExact();
            state.setToAmount(isEmptyValue(toAmount) ? "" : toAmount);
        }
    };
    return (
        <TokenInput
            title={"Amount of Tokens"}
            token={state.fromToken}
            amount={state.fromAmount}
            onAmountChanged={onAmountChanged}
            hideMaxButton={state.loading && !state.pair}
        />
    );
};

const ToTokenInput = ({ state }: { state: AddLiquidityState }) => {
    if (!state.fromSymbol || !state.toSymbol) {
        return <View />;
    }
    const onAmountChanged = (newAmount: string) => {
        state.setToAmount(newAmount);
        if (state.pair && state.toToken) {
            const toPrice = state.pair.priceOf(convertToken(state.toToken));
            const fromAmount = toPrice.quote(convertAmount(state.toToken, newAmount)).toExact();
            state.setFromAmount(isEmptyValue(fromAmount) ? "" : fromAmount);
        }
    };
    return (
        <TokenInput
            token={state.toToken}
            amount={state.toAmount}
            onAmountChanged={onAmountChanged}
            hideMaxButton={state.loading && !state.pair}
        />
    );
};

const PriceInfo = ({ state }: { state: AddLiquidityState }) => {
    if (state.fromToken && state.toToken && !state.loading && !state.pair) {
        return <FirstProviderInfo state={state} />;
    } else {
        return <PairPriceInfo state={state} />;
    }
};

const FirstProviderInfo = ({ state }: { state: AddLiquidityState }) => {
    const { green } = useColors();
    const noAmount = isEmptyValue(state.fromAmount) || isEmptyValue(state.toAmount);
    const initialPrice = Fraction.from(
        parseBalance(state.toAmount, state.toToken!.decimals),
        parseBalance(state.fromAmount, state.fromToken!.decimals)
    ).toString(8);
    return (
        <View>
            <Notice
                text={
                    "You are the first liquidity provider.\n" +
                    "The ratio of tokens you add will set the price of this pool."
                }
                color={green}
                style={{ marginTop: Spacing.small }}
            />
            <InfoBox style={{ marginTop: Spacing.normal }}>
                <PriceMeta state={state} price={initialPrice} disabled={noAmount} />
            </InfoBox>
        </View>
    );
};

const PairPriceInfo = ({ state }: { state: AddLiquidityState }) => {
    const [amount, setAmount] = useState<string>();
    const { textDark, textLight, placeholder } = useColors();
    const { calculateAmountOfLPTokenMinted } = useSDK();
    useAsyncEffect(async () => {
        if (state.pair && !isEmptyValue(state.fromAmount) && !isEmptyValue(state.toAmount)) {
            const minted = await calculateAmountOfLPTokenMinted(
                state.pair,
                convertAmount(state.fromToken!, state.fromAmount),
                convertAmount(state.toToken!, state.toAmount)
            );
            setAmount(minted?.toFixed(8));
        }
    }, [state.pair, state.fromAmount, state.toAmount]);
    const disabled = isEmptyValue(state.fromAmount) || isEmptyValue(state.toAmount);
    const price =
        state.pair && state.fromToken ? state.pair.priceOf(convertToken(state.fromToken)).toFixed(8) : undefined;
    const color = disabled ? placeholder : amount ? textDark : textLight;
    const symbol = state.fromSymbol + "-" + state.toSymbol + " LP";
    return (
        <InfoBox>
            <Text style={{ fontSize: 28, marginBottom: Spacing.normal, color }}>
                {disabled ? "N/A" : amount ? amount + " " + symbol : "Fetching…"}
            </Text>
            <PriceMeta state={state} price={price} disabled={!state.fromSymbol || !state.toSymbol} />
            <Controls state={state} />
        </InfoBox>
    );
};

const PriceMeta = ({ state, price, disabled }) => (
    <Meta label={"Price"} text={price} suffix={state.toSymbol + " = 1 " + state.fromSymbol} disabled={disabled} />
);

// tslint:disable-next-line:max-func-body-length
const Controls = ({ state }: { state: AddLiquidityState }) => {
    const [error, setError] = useState<MetamaskError>({});
    useAsyncEffect(() => setError({}), [state.fromSymbol, state.toSymbol, state.fromAmount]);
    const fromApproveRequired = state.fromSymbol !== "ETH" && !state.fromTokenAllowed;
    const toApproveRequired = state.toSymbol !== "ETH" && !state.toTokenAllowed;
    const disabled =
        fromApproveRequired || toApproveRequired || isEmptyValue(state.fromAmount) || isEmptyValue(state.toAmount);
    return (
        <View style={{ marginTop: Spacing.normal }}>
            {!state.fromToken ||
            !state.toToken ||
            state.loading ||
            isEmptyValue(state.fromAmount) ||
            isEmptyValue(state.toAmount) ? (
                <SupplyButton state={state} onError={setError} disabled={true} />
            ) : state.loading || !state.pair ? (
                <FetchingButton />
            ) : parseBalance(state.fromAmount, state.fromToken.decimals).gt(state.fromToken.balance) ? (
                <InsufficientBalanceButton symbol={state.fromSymbol} />
            ) : parseBalance(state.toAmount, state.toToken.decimals).gt(state.toToken.balance) ? (
                <InsufficientBalanceButton symbol={state.toSymbol} />
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
        </View>
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
            title={state.fromSymbol && state.toSymbol ? "Supply " + state.fromSymbol + "-" + state.toSymbol : "Supply"}
            disabled={disabled}
            loading={state.adding}
            onPress={onPress}
        />
    );
};

export default LiquidityScreen;
