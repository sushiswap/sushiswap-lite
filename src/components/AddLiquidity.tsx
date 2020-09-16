import React, { useCallback, useContext, useState } from "react";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import { Spacing } from "../constants/dimension";
import { GlobalContext } from "../context/GlobalContext";
import { AddLiquidityState } from "../hooks/useAddLiquidityState";
import useColors from "../hooks/useColors";
import MetamaskError from "../types/MetamaskError";
import { convertAmount, convertToken, formatBalance, isEmptyValue, parseBalance } from "../utils";
import ApproveButton from "./ApproveButton";
import Button from "./Button";
import Column from "./Column";
import ErrorMessage from "./ErrorMessage";
import FetchingButton from "./FetchingButton";
import FlexView from "./FlexView";
import InsufficientBalanceButton from "./InsufficientBalanceButton";
import Text from "./Text";
import TokenInput from "./TokenInput";
import TokenSelect from "./TokenSelect";
import UnsupportedButton from "./UnsupportedButton";

const AddLiquidity = ({ state }: { state: AddLiquidityState }) => (
    <>
        <Column>
            <Text h4={true} style={{ textAlign: "center" }}>
                🔥 Add Liquidity
            </Text>
        </Column>
        <TokenSelect
            title={"1. Select the 1st token of the liquidity pool"}
            hidden={false}
            symbol={state.fromSymbol}
            onChangeSymbol={state.setFromSymbol}
            filterTokens={token => token.balance && !token.balance.isZero()}
        />
        <TokenSelect
            title={"2. Select the 2nd token of the liquidity pool"}
            hidden={state.fromSymbol === ""}
            symbol={state.toSymbol}
            onChangeSymbol={state.setToSymbol}
            filterTokens={token => token.symbol !== state.fromSymbol && token.balance && !token.balance.isZero()}
        />
        <FromTokenInput state={state} />
        <ToTokenInput state={state} />
        <PriceInfo state={state} />
        <Controls state={state} />
    </>
);

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
    return (
        <TokenInput
            title={"3. How many " + state.fromSymbol + "-" + state.toSymbol + " do you want to supply?"}
            token={state.fromToken}
            hidden={!state.fromToken || !state.toToken}
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
            hidden={!state.fromToken || !state.toToken}
            amount={state.toAmount}
            onAmountChanged={onAmountChanged}
        />
    );
};

const PriceInfo = ({ state }: { state: AddLiquidityState }) => {
    const { darkMode } = useContext(GlobalContext);
    const { primary, secondary } = useColors();
    if (!isEmptyValue(state.fromAmount) && !state.loading && !state.pair) {
        const initialPrice = formatBalance(
            parseBalance(state.toAmount, state.toToken?.decimals)
                .mul(ethers.BigNumber.from(10).pow(8))
                .div(parseBalance(state.fromAmount, state.fromToken?.decimals)),
            8
        );
        return (
            <Column noTopMargin={true}>
                <Text note={true} style={{ color: darkMode ? secondary : primary, margin: Spacing.small }}>
                    {"You are the first liquidity provider.\n" +
                        "The ratio of tokens you add will set the price of this pool."}
                </Text>
                {!!state.fromAmount && !!state.toAmount && (
                    <PriceRow price={initialPrice} fromSymbol={state.fromSymbol} toSymbol={state.toSymbol} />
                )}
            </Column>
        );
    }
    if (!state.fromToken || !state.toToken) {
        return <Column noTopMargin={true} />;
    }
    const price = state.pair ? state.pair.priceOf(convertToken(state.fromToken)).toSignificant(8) : "…";
    return (
        <Column noTopMargin={true}>
            <PriceRow price={price} fromSymbol={state.fromSymbol} toSymbol={state.toSymbol} />
        </Column>
    );
};

const PriceRow = ({ price, fromSymbol, toSymbol }) => (
    <Row label={"Price"} text={price + " " + toSymbol + " = 1 " + fromSymbol} />
);

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

// tslint:disable-next-line:max-func-body-length
const Controls = ({ state }: { state: AddLiquidityState }) => {
    const [error, setError] = useState<MetamaskError>({});
    useAsyncEffect(() => setError({}), [state.fromSymbol, state.toSymbol, state.fromAmount]);
    if (!state.fromToken || !state.toToken) {
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
                        onSuccess={() => state.setFromTokenAllowed(true)}
                        onError={setError}
                        hidden={!fromApproveRequired}
                    />
                    <ApproveButton
                        token={state.toToken}
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

export default AddLiquidity;
