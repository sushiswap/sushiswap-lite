import React, { useCallback, useContext, useState } from "react";
import { View } from "react-native";
import { Icon } from "react-native-elements";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import { ROUTER, SETTLEMENT } from "../constants/contracts";
import { Spacing } from "../constants/dimension";
import Fraction from "../constants/Fraction";
import { EthersContext } from "../context/EthersContext";
import useColors from "../hooks/useColors";
import useDelayedEffect from "../hooks/useDelayedEffect";
import useSDK from "../hooks/useSDK";
import useStyles from "../hooks/useStyles";
import useSwapState, { OrderType, SwapState } from "../hooks/useSwapState";
import MetamaskError from "../types/MetamaskError";
import Token from "../types/Token";
import { formatBalance, isEmptyValue, parseBalance } from "../utils";
import ApproveButton from "./ApproveButton";
import Button from "./Button";
import CheckBox from "./CheckBox";
import Column from "./Column";
import ErrorMessage from "./ErrorMessage";
import FetchingButton from "./FetchingButton";
import InsufficientBalanceButton from "./InsufficientBalanceButton";
import Meta from "./Meta";
import Notice from "./Notice";
import Subtitle from "./Subtitle";
import Text from "./Text";
import TokenInput from "./TokenInput";
import TokenSelect from "./TokenSelect";
import UnsupportedButton from "./UnsupportedButton";

const Swap = () => {
    const state = useSwapState();
    return (
        <>
            <Column style={{ alignItems: "center" }}>
                <Text h4={true} style={{ textAlign: "center", marginBottom: Spacing.normal }}>
                    🍣 Swap Tokens
                </Text>
            </Column>
            <TokenSelect
                title={"1. Select the token you want to SELL:"}
                hidden={false}
                symbol={state.fromSymbol}
                onChangeSymbol={state.setFromSymbol}
                filterTokens={token => token.balance && !token.balance.isZero()}
            />
            <TokenSelect
                title={"2. Select the token you want to BUY:"}
                hidden={state.fromSymbol === ""}
                symbol={state.toSymbol}
                onChangeSymbol={state.setToSymbol}
                filterTokens={token => token.symbol !== state.fromSymbol}
            />
            <Inputs state={state} />
            <TradeInfo state={state} />
            <SwapControls state={state} />
            <LimitOrderControls state={state} />
        </>
    );
};

const Inputs = ({ state }: { state: SwapState }) => {
    if (!state.fromSymbol) {
        return <Column noTopMargin={true} />;
    }
    return (
        <Column>
            <Subtitle text={"3. How many " + (state.fromSymbol || "tokens") + " do you want to SELL?"} />
            <OrderTypeSelect state={state} />
            <TokenInput
                token={state.fromToken}
                hidden={!state.fromToken || state.limitOrderUnsupported}
                amount={state.fromAmount}
                onAmountChanged={state.setFromAmount}
            />
            <PriceInput state={state} />
            <LimitOrderUnsupportedNotice state={state} />
        </Column>
    );
};

const PriceInput = ({ state }: { state: SwapState }) => {
    if (state.limitOrderUnsupported) return <Column noTopMargin={true} />;
    const fromAmount = parseBalance(state.fromAmount, state.fromToken!.decimals);
    const marketPrice =
        state.toToken && state.trade && fromAmount.eq(state.trade.inputAmount.raw.toString())
            ? parseBalance(Fraction.convert(state.trade.executionPrice).toString(), state.toToken.decimals)
            : ethers.constants.Zero;
    return (
        <TokenInput
            token={
                {
                    ...state.toToken,
                    balance: marketPrice
                } as Token
            }
            hidden={!state.toToken || state.orderType === "market"}
            amount={state.limitOrderPrice}
            onAmountChanged={state.setLimitOrderPrice}
            label={"Minimum Price (" + state.toSymbol + " / " + state.fromSymbol + ")"}
            maxButtonText={"MARKET"}
        />
    );
};

const LimitOrderUnsupportedNotice = ({ state }: { state: SwapState }) => {
    if (!state.limitOrderUnsupported) return <Column noTopMargin={true} />;
    return (
        <Column noTopMargin={true}>
            <Notice text={"ETH not supported for limit orders. Wrap ETH into WETH."} />
        </Column>
    );
};

const OrderTypeSelect = ({ state }: { state: SwapState }) => {
    const { border } = useStyles();
    if (!state.fromSymbol || !state.toSymbol) return <Column noTopMargin={true} />;
    return (
        <Column noTopMargin={true}>
            <View
                style={{
                    marginBottom: Spacing.normal,
                    ...border()
                }}>
                <OrderCheckBox state={state} orderType={"market"} />
                <OrderCheckBox state={state} orderType={"limit"} />
            </View>
        </Column>
    );
};

const OrderCheckBox = ({ state, orderType }: { state: SwapState; orderType: OrderType }) => {
    const onPress = useCallback(() => state.setOrderType(orderType), [orderType]);
    const title =
        orderType === "market" ? (
            <View style={{ marginLeft: Spacing.small }}>
                <Text fontWeight={"regular"}>Market Order</Text>
                <Text note={true} fontWeight={"light"}>
                    Settle an order immediately
                </Text>
            </View>
        ) : (
            <View style={{ marginLeft: Spacing.small }}>
                <Text fontWeight={"regular"}>Limit Order</Text>
                <Text note={true} fontWeight={"light"}>
                    Place an order with a minimum price
                </Text>
            </View>
        );
    return (
        <CheckBox
            checked={state.orderType === orderType}
            onPress={onPress}
            title={title}
            iconRight={false}
            containerStyle={{ marginVertical: 0, marginTop: 4 }}
        />
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
    if (
        state.fromSymbol === "" ||
        state.toSymbol === "" ||
        isEmptyValue(state.fromAmount) ||
        (state.orderType === "limit" && state.fromSymbol === "ETH")
    ) {
        return <Column noTopMargin={true} />;
    }
    return state.orderType === "limit" ? <LimitOrderInfo state={state} /> : <SwapInfo state={state} />;
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
    const amount = state.trade?.outputAmount?.toSignificant(8);
    const price = state.trade?.executionPrice?.toSignificant(8);
    const impact = state.trade?.priceImpact?.toSignificant(2);
    return (
        <Column noTopMargin={true}>
            <ArrowDown />
            <Text style={{ fontSize: 30, textAlign: "center", marginBottom: Spacing.normal }}>
                {amount || "…"} {state.toSymbol}
            </Text>
            <Meta label={"Price"} text={price} suffix={state.toSymbol + "  = 1 " + state.fromSymbol} />
            <Meta label={"Price Impact"} text={impact} suffix={"%"} />
            <Meta label={"Fee (0.30%)"} text={state.swapFee} suffix={state.fromSymbol} />
        </Column>
    );
};

const LimitOrderInfo = ({ state }: { state: SwapState }) => {
    const { calculateLimitOrderFee } = useSDK();
    const price = Fraction.parse(state.limitOrderPrice);
    const fromAmount = parseBalance(state.fromAmount, state.fromToken!.decimals);
    const toAmount =
        !isEmptyValue(state.fromAmount) && !price.isZero()
            ? formatBalance(price.apply(fromAmount.sub(calculateLimitOrderFee(fromAmount))), state.toToken!.decimals, 8)
            : undefined;
    const marketPrice = state.trade ? Fraction.convert(state.trade.executionPrice) : undefined;
    return (
        <Column noTopMargin={true}>
            <Meta label={"Minimum Amount"} text={toAmount} suffix={state.toSymbol} />
            <Meta label={"Relayer Fee (0.20%)"} text={state.limitOrderFee} suffix={state.fromSymbol} />
            <Meta label={"Swap Fee (0.30%)"} text={state.limitOrderSwapFee} suffix={state.fromSymbol} />
            <Meta
                label={"Market Price"}
                text={marketPrice?.toString() || undefined}
                suffix={state.toSymbol + " / " + state.fromSymbol + ""}
            />
        </Column>
    );
};

const ArrowDown = () => {
    const { textLight } = useColors();
    return <Icon type={"material-community"} name={"arrow-down"} color={textLight} style={{ margin: Spacing.tiny }} />;
};

// tslint:disable-next-line:max-func-body-length
const SwapControls = ({ state }: { state: SwapState }) => {
    const [error, setError] = useState<MetamaskError>({});
    useAsyncEffect(() => setError({}), [state.fromSymbol, state.toSymbol, state.fromAmount]);
    if (state.orderType === "limit" || state.toSymbol === "" || !state.fromToken || isEmptyValue(state.fromAmount))
        return <Column noTopMargin={true} />;
    const approveRequired = state.fromSymbol !== "ETH" && !state.fromTokenAllowed;
    return (
        <Column>
            {parseBalance(state.fromAmount, state.fromToken.decimals).gt(state.fromToken.balance) ? (
                <InsufficientBalanceButton symbol={state.fromSymbol} />
            ) : state.fromSymbol === "WETH" && state.toSymbol === "ETH" ? (
                <UnwrapButton state={state} onError={setError} />
            ) : state.fromSymbol === "ETH" && state.toSymbol === "WETH" ? (
                <WrapButton state={state} onError={setError} />
            ) : state.unsupported ? (
                <UnsupportedButton state={state} />
            ) : state.loading || !state.trade ? (
                <FetchingButton />
            ) : (
                <>
                    <ApproveButton
                        token={state.fromToken}
                        spender={ROUTER}
                        onSuccess={() => state.setFromTokenAllowed(true)}
                        onError={setError}
                        hidden={!approveRequired}
                    />
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

// tslint:disable-next-line:max-func-body-length
const LimitOrderControls = ({ state }: { state: SwapState }) => {
    const { getTokenAllowance } = useContext(EthersContext);
    const [error, setError] = useState<MetamaskError>({});
    const [allowed, setAllowed] = useState<boolean>();
    useAsyncEffect(() => setError({}), [state.fromSymbol, state.toSymbol, state.fromAmount]);
    useDelayedEffect(
        async () => {
            if (state.fromToken && !isEmptyValue(state.fromAmount)) {
                const fromAmount = parseBalance(state.fromAmount, state.fromToken.decimals);
                const allowance = await getTokenAllowance(state.fromToken.address, SETTLEMENT);
                setAllowed(ethers.BigNumber.from(allowance).gte(fromAmount));
            }
        },
        500,
        [state.fromToken, state.fromAmount]
    );
    const price = Fraction.parse(state.limitOrderPrice);
    if (
        state.orderType === "market" ||
        state.toSymbol === "" ||
        !state.fromToken ||
        isEmptyValue(state.fromAmount) ||
        !state.trade ||
        price.isNaN()
    )
        return <Column noTopMargin={true} />;
    return (
        <Column>
            {price.lt(Fraction.convert(state.trade.executionPrice)) ? (
                <PriceTooLowButton />
            ) : state.unsupported ? (
                <UnsupportedButton state={state} />
            ) : state.loading || !state.trade ? (
                <FetchingButton />
            ) : (
                <>
                    <ApproveButton
                        token={state.fromToken}
                        spender={SETTLEMENT}
                        onSuccess={() => setAllowed(true)}
                        onError={setError}
                        hidden={allowed}
                    />
                    <PlaceOrderButton state={state} onError={setError} disabled={!allowed} />
                </>
            )}
            {error.message && error.code !== 4001 && <ErrorMessage error={error} />}
        </Column>
    );
};

const PriceTooLowButton = () => {
    return <Button size={"large"} title={"Price Must Be Greater Than Market"} disabled={true} />;
};

const PlaceOrderButton = ({
    state,
    onError,
    disabled
}: {
    state: SwapState;
    onError: (e) => void;
    disabled: boolean;
}) => {
    const onPress = useCallback(() => {
        onError({});
        state.onCreateOrder().catch(onError);
    }, [state.onCreateOrder, onError]);
    return (
        <Button
            size={"large"}
            title={"Place Limit Order"}
            disabled={disabled}
            loading={state.creatingOrder}
            onPress={onPress}
        />
    );
};

export default Swap;
