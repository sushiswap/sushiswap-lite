import React, { useCallback, useContext, useState } from "react";
import { Platform, View } from "react-native";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import ApproveButton from "../components/ApproveButton";
import Border from "../components/Border";
import Button from "../components/Button";
import Container from "../components/Container";
import Content from "../components/Content";
import ErrorMessage from "../components/ErrorMessage";
import Expandable from "../components/Expandable";
import ExperimentalNotice from "../components/ExperimentalNotice";
import FetchingButton from "../components/FetchingButton";
import Heading from "../components/Heading";
import InfoBox from "../components/InfoBox";
import InsufficientBalanceButton from "../components/InsufficientBalanceButton";
import { ITEM_SEPARATOR_HEIGHT } from "../components/ItemSeparator";
import Meta from "../components/Meta";
import Notice from "../components/Notice";
import Selectable from "../components/Selectable";
import Text from "../components/Text";
import Title from "../components/Title";
import TokenInput from "../components/TokenInput";
import TokenSelect from "../components/TokenSelect";
import UnsupportedButton from "../components/UnsupportedButton";
import WebFooter from "../components/web/WebFooter";
import { SwapSubMenu } from "../components/web/WebSubMenu";
import { ROUTER, SETTLEMENT } from "../constants/contracts";
import { Spacing } from "../constants/dimension";
import Fraction from "../constants/Fraction";
import { EthersContext } from "../context/EthersContext";
import useColors from "../hooks/useColors";
import useDelayedEffect from "../hooks/useDelayedEffect";
import useLinker from "../hooks/useLinker";
import useSwapState, { OrderType, SwapState } from "../hooks/useSwapState";
import MetamaskError from "../types/MetamaskError";
import Token from "../types/Token";
import { formatBalance, isEmptyValue, parseBalance } from "../utils";
import Screen from "./Screen";

const SwapScreen = () => {
    return (
        <Screen>
            <SwapSubMenu />
            <Container>
                <Content>
                    <Title text={"Swap Tokens"} />
                    <Text light={true}>Swap now or place a limit order with a desired price.</Text>
                    <Swap />
                    {Platform.OS === "web" && <WebFooter />}
                </Content>
            </Container>
        </Screen>
    );
};

const Swap = () => {
    const state = useSwapState();
    return (
        <View style={{ marginTop: Spacing.large }}>
            <OrderTypeSelect state={state} />
            <Border />
            <FromTokenSelect state={state} />
            <Border />
            <ToTokenSelect state={state} />
            <Border />
            <AmountInput state={state} />
            {state.orderType === "limit" && (
                <View>
                    <AmountNotice state={state} />
                    <Border />
                    <PriceInput state={state} />
                </View>
            )}
            <TradeInfo state={state} />
        </View>
    );
};

const OrderTypeSelect = ({ state }: { state: SwapState }) => {
    return (
        <View>
            <Expandable title={"Order Type"} expanded={!state.orderType} onExpand={() => state.setOrderType()}>
                <OrderTypeItem state={state} orderType={"market"} />
                <OrderTypeItem state={state} orderType={"limit"} />
            </Expandable>
            {state.orderType && <OrderTypeItem state={state} orderType={state.orderType} selectable={true} />}
            {state.orderType === "limit" && (
                <ExperimentalNotice
                    contractURL={
                        "https://github.com/sushiswap/sushiswap-settlement/blob/master/contracts/Settlement.sol"
                    }
                />
            )}
        </View>
    );
};

const OrderTypeItem = ({
    state,
    orderType,
    selectable
}: {
    state: SwapState;
    orderType: OrderType;
    selectable?: boolean;
}) => {
    const selected = state.orderType === orderType;
    const type = orderType === "market" ? "Market Order" : "Limit Order";
    const desc =
        orderType === "market"
            ? "Settle an order immediately"
            : "Place an order with a desired price waiting to be settled";
    const onPress = () => state.setOrderType(state.orderType === orderType ? undefined : orderType);
    return (
        <Selectable
            style={{
                marginBottom: ITEM_SEPARATOR_HEIGHT,
                paddingHorizontal: Spacing.small + Spacing.tiny
            }}
            selected={selected}
            disabled={selectable}
            onPress={onPress}>
            <Text fontWeight={"regular"}>{type}</Text>
            <Text note={true}>{desc}</Text>
        </Selectable>
    );
};

const FromTokenSelect = ({ state }: { state: SwapState }) => {
    const { tokens, setTokens } = useContext(EthersContext);
    if (!state.orderType) {
        return <Heading text={"Token To Sell"} disabled={true} />;
    }
    const ETH = tokens ? tokens.find(token => token.symbol === "ETH") : null;
    const onAddToken = (token: Token) => {
        if (tokens.findIndex(t => t.address === token.address) === -1) {
            setTokens([...tokens, token]);
        }
    };
    return (
        <View>
            <TokenSelect
                title={"Token To Sell"}
                symbol={state.fromSymbol}
                onChangeSymbol={state.setFromSymbol}
                hidden={token => token.balance.isZero() || (state.orderType === "limit" && token.symbol === "ETH")}
                onAddToken={onAddToken}
            />
            {state.orderType === "limit" && !state.fromSymbol && ETH && !ETH.balance.isZero() && (
                <LimitOrderUnsupportedNotice />
            )}
        </View>
    );
};

const ToTokenSelect = ({ state }: { state: SwapState }) => {
    if (!state.orderType || !state.fromSymbol) {
        return <Heading text={"Token To Buy"} disabled={true} />;
    }
    return (
        <View>
            <TokenSelect
                title={"Token To Buy"}
                symbol={state.toSymbol}
                onChangeSymbol={state.setToSymbol}
                hidden={token =>
                    token.symbol === state.fromSymbol || (state.orderType === "limit" && token.symbol === "ETH")
                }
            />
            {state.orderType === "limit" && !state.toSymbol && <LimitOrderUnsupportedNotice />}
        </View>
    );
};

const AmountInput = ({ state }: { state: SwapState }) => {
    if (!state.fromSymbol || !state.toSymbol) {
        return <Heading text={"Amount"} disabled={true} />;
    }
    return (
        <View>
            <Heading text={state.fromSymbol + " Amount"} />
            <TokenInput
                token={state.fromToken}
                amount={state.fromAmount}
                onAmountChanged={state.setFromAmount}
                autoFocus={true}
            />
        </View>
    );
};

const AmountNotice = ({ state }: { state: SwapState }) => {
    if (
        state.priceInETH === undefined ||
        isEmptyValue(state.fromAmount) ||
        !state.fromToken ||
        (state.priceInETH && parseBalance(state.fromAmount, state.fromToken.decimals).lte(state.priceInETH.mul(10)))
    ) {
        return <View />;
    }
    return (
        <View style={{ marginTop: Spacing.small }}>
            <Notice
                text={
                    state.priceInETH === null
                        ? "This token is not supported in beta."
                        : "Maximum allowed amount in beta is " +
                          formatBalance(state.priceInETH.mul(10), state.fromToken!.decimals) +
                          " " +
                          state.fromSymbol +
                          " (≈ 10 ETH)."
                }
                color={"red"}
            />
        </View>
    );
};

const PriceInput = ({ state }: { state: SwapState }) => {
    if (!state.fromSymbol || !state.toSymbol) {
        return <Heading text={"Minimum Price"} disabled={true} />;
    }
    const marketPrice =
        state.toToken && state.trade
            ? parseBalance(state.trade.executionPrice.toFixed(state.toToken.decimals), state.toToken.decimals)
            : ethers.constants.Zero;
    return (
        <TokenInput
            title={"Minimum Price (" + state.toSymbol + "/" + state.fromSymbol + ")"}
            token={
                {
                    ...state.toToken,
                    balance: marketPrice
                } as Token
            }
            amount={state.limitOrderPrice}
            onAmountChanged={state.setLimitOrderPrice}
            maxButtonText={"MARKET"}
        />
    );
};

const LimitOrderUnsupportedNotice = () => {
    const { placeholder } = useColors();
    return (
        <Notice
            text={"⚠️ ETH not supported for limit orders. Use WETH instead."}
            color={placeholder}
            clear={true}
            style={{ marginVertical: Spacing.small }}
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
    const disabled =
        state.fromSymbol === "" ||
        state.toSymbol === "" ||
        isEmptyValue(state.fromAmount) ||
        (state.orderType === "limit" && state.fromSymbol === "ETH");
    return (
        <InfoBox>
            {state.orderType === "limit" ? (
                <LimitOrderInfo state={state} />
            ) : (
                <SwapInfo state={state} disabled={disabled} />
            )}
        </InfoBox>
    );
};

const WrapInfo = ({ state }: { state: SwapState }) => {
    return (
        <View>
            <Text style={{ fontSize: 30, textAlign: "center" }}>
                {state.fromAmount} {state.toSymbol}
            </Text>
        </View>
    );
};

const SwapInfo = ({ state, disabled }: { state: SwapState; disabled: boolean }) => {
    const { textDark, textLight, placeholder } = useColors();
    const amount = state.trade?.outputAmount?.toFixed(8);
    const price = state.trade?.executionPrice?.toFixed(8);
    const impact = state.trade?.priceImpact?.toFixed(2);
    return (
        <View>
            <Text
                style={{
                    fontSize: 28,
                    marginBottom: Spacing.normal,
                    color: disabled ? placeholder : amount ? textDark : textLight
                }}>
                {disabled ? "N/A" : amount ? amount + " " + state.toSymbol : "Fetching…"}
            </Text>
            <Meta
                label={"Price"}
                text={price}
                suffix={state.toSymbol + "  = 1 " + state.fromSymbol}
                disabled={disabled}
            />
            <Meta label={"Price Impact"} text={impact} suffix={"%"} disabled={disabled} />
            <Meta label={"Fee (0.30%)"} text={state.swapFee} suffix={state.fromSymbol} disabled={disabled} />
            <SwapControls state={state} />
        </View>
    );
};

// tslint:disable-next-line:max-func-body-length
const SwapControls = ({ state }: { state: SwapState }) => {
    const [error, setError] = useState<MetamaskError>({});
    useAsyncEffect(() => setError({}), [state.fromSymbol, state.toSymbol, state.fromAmount]);
    const approveRequired = state.fromSymbol !== "ETH" && !state.fromTokenAllowed;
    return (
        <View style={{ marginTop: Spacing.normal }}>
            {!state.fromToken || !state.toToken || isEmptyValue(state.fromAmount) ? (
                <SwapButton state={state} onError={setError} disabled={true} />
            ) : parseBalance(state.fromAmount, state.fromToken.decimals).gt(state.fromToken.balance) ? (
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
        </View>
    );
};

const SwapButton = ({ state, onError, disabled }: { state: SwapState; onError: (e) => void; disabled: boolean }) => {
    const onPress = useCallback(() => {
        onError({});
        state.onSwap().catch(onError);
    }, [state.onSwap, onError]);
    return (
        <Button
            title={state.fromSymbol && state.toSymbol ? "Swap " + state.fromSymbol + "-" + state.toSymbol : "Swap"}
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
    return <Button title={"Wrap"} loading={state.wrapping} onPress={onPress} />;
};

const UnwrapButton = ({ state, onError }: { state: SwapState; onError: (e) => void }) => {
    const onPress = useCallback(async () => {
        onError({});
        state.onUnwrap().catch(onError);
    }, []);
    return <Button title={"Unwrap"} loading={state.unwrapping} onPress={onPress} />;
};

const LimitOrderInfo = ({ state }: { state: SwapState }) => {
    const d = !state.trade?.executionPrice;
    return (
        <View>
            <Text
                disabled={isEmptyValue(state.limitOrderReturn)}
                style={{ fontSize: 28, marginBottom: Spacing.normal }}>
                {isEmptyValue(state.limitOrderReturn) ? "N/A" : state.limitOrderReturn + " " + state.toSymbol}
            </Text>
            <Meta
                label={"Market Price"}
                text={state.trade?.executionPrice?.toFixed(8) || undefined}
                suffix={state.toSymbol + " / " + state.fromSymbol + ""}
                disabled={d}
            />
            <Meta label={"Relayer Fee (0.20%)"} text={state.limitOrderFee} suffix={state.fromSymbol} disabled={d} />
            <Meta label={"Swap Fee (0.30%)"} text={state.limitOrderSwapFee} suffix={state.fromSymbol} disabled={d} />
            <Meta label={"Expiration"} text={"24 Hours From Now"} disabled={d} />
            <LimitOrderControls state={state} />
        </View>
    );
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
    const disabled =
        state.orderType === "market" ||
        state.toSymbol === "" ||
        !state.fromToken ||
        !state.toToken ||
        isEmptyValue(state.fromAmount) ||
        !state.priceInETH ||
        parseBalance(state.fromAmount, state.fromToken!.decimals).gt(state.priceInETH.mul(10)) ||
        !state.trade ||
        isEmptyValue(state.limitOrderPrice);
    return (
        <View style={{ marginTop: Spacing.normal }}>
            {disabled ? (
                <PlaceOrderButton state={state} onError={setError} disabled={true} />
            ) : !Fraction.parse(state.limitOrderPrice).gt(
                  Fraction.parse(state.trade!.executionPrice.toFixed(state.toToken!.decimals))
              ) ? (
                <PriceTooLowButton />
            ) : state.unsupported ? (
                <UnsupportedButton state={state} />
            ) : state.loading || !state.trade ? (
                <FetchingButton />
            ) : (
                <>
                    <ApproveButton
                        token={state.fromToken!}
                        spender={SETTLEMENT}
                        onSuccess={() => setAllowed(true)}
                        onError={setError}
                        hidden={allowed}
                    />
                    <PlaceOrderButton state={state} onError={setError} disabled={!allowed} />
                </>
            )}
            {error.message && error.code !== 4001 && <ErrorMessage error={error} />}
        </View>
    );
};

const PriceTooLowButton = () => {
    return <Button title={"Set Price Greater Than Market"} disabled={true} />;
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
    const goToLimitOrders = useLinker("/swap/my-orders", "LimitOrders");
    const onPress = useCallback(async () => {
        onError({});
        try {
            await state.onCreateOrder();
            goToLimitOrders();
        } catch (e) {
            onError(e);
        }
    }, [state.onCreateOrder, goToLimitOrders, onError]);
    return <Button title={"Place Limit Order"} disabled={disabled} loading={state.creatingOrder} onPress={onPress} />;
};

export default SwapScreen;
