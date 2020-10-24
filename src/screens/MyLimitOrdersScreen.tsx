import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Platform, View } from "react-native";

import moment from "moment";
import useAsyncEffect from "use-async-effect";
import Button from "../components/Button";
import Container from "../components/Container";
import Content from "../components/Content";
import ErrorMessage from "../components/ErrorMessage";
import Expandable from "../components/Expandable";
import FlexView from "../components/FlexView";
import InfoBox from "../components/InfoBox";
import { ITEM_SEPARATOR_HEIGHT } from "../components/ItemSeparator";
import Loading from "../components/Loading";
import Meta from "../components/Meta";
import Selectable from "../components/Selectable";
import Text from "../components/Text";
import Title from "../components/Title";
import TokenAmount from "../components/TokenAmount";
import TokenLogo from "../components/TokenLogo";
import TokenSymbol from "../components/TokenSymbol";
import WebFooter from "../components/web/WebFooter";
import { SwapSubMenu } from "../components/web/WebSubMenu";
import { Spacing } from "../constants/dimension";
import Fraction from "../constants/Fraction";
import useColors from "../hooks/useColors";
import useMyLimitOrdersState, { MyLimitOrdersState } from "../hooks/useMyLimitOrdersState";
import { Order } from "../hooks/useSDK";
import MetamaskError from "../types/MetamaskError";
import { formatBalance } from "../utils";
import Screen from "./Screen";

const MyLimitOrdersScreen = () => {
    return (
        <Screen>
            <SwapSubMenu />
            <Container>
                <Content>
                    <Title text={"My Orders"} />
                    <Text light={true}>Scan limit orders you've placed and cancel them if needed.</Text>
                    <MyLimitOrders />
                    {Platform.OS === "web" && <WebFooter />}
                </Content>
            </Container>
        </Screen>
    );
};

const MyLimitOrders = () => {
    const state = useMyLimitOrdersState();
    return (
        <View style={{ marginTop: Spacing.large }}>
            <OrderSelect state={state} />
            <OrderInfo state={state} />
        </View>
    );
};

const OrderSelect = (props: { state: MyLimitOrdersState }) => {
    return (
        <View>
            <Expandable
                title={"Limit Orders"}
                expanded={!props.state.selectedOrder}
                onExpand={() => props.state.setSelectedOrder()}>
                <OrderList state={props.state} />
            </Expandable>
            {props.state.selectedOrder && (
                <OrderItem
                    order={props.state.selectedOrder}
                    selected={true}
                    onSelectOrder={() => props.state.setSelectedOrder()}
                />
            )}
        </View>
    );
};

const OrderList = ({ state }: { state: MyLimitOrdersState }) => {
    const renderItem = useCallback(
        ({ item }) => {
            return (
                <OrderItem key={item.address} order={item} selected={false} onSelectOrder={state.setSelectedOrder} />
            );
        },
        [state.setSelectedOrder]
    );
    return state.loading || !state.myOrders ? (
        <Loading />
    ) : state.myOrders.length === 0 ? (
        <EmptyList />
    ) : (
        <FlatList keyExtractor={item => JSON.stringify(item)} data={state.myOrders} renderItem={renderItem} />
    );
};

const EmptyList = () => {
    return (
        <View style={{ margin: Spacing.normal }}>
            <Text disabled={true} style={{ textAlign: "center", width: "100%" }}>
                {"You don't have any limit orders placed."}
            </Text>
        </View>
    );
};

const OrderItem = (props: { order: Order; selected: boolean; onSelectOrder: (order: Order) => void }) => {
    const { amountIn, amountOutMin, fromToken, toToken } = props.order;
    const status = props.order.status();
    const disabled = status !== "Open";
    const price = Fraction.fromTokens(amountOutMin, amountIn, toToken, fromToken);
    const onPress = useCallback(() => props.onSelectOrder(props.order), [props.onSelectOrder, props.order]);
    return (
        <Selectable
            selected={props.selected}
            onPress={onPress}
            style={{
                marginBottom: ITEM_SEPARATOR_HEIGHT
            }}>
            <FlexView style={{ alignItems: "center" }}>
                <View>
                    <Token token={fromToken} amount={amountIn} disabled={disabled} buy={false} />
                    <View style={{ height: Spacing.tiny }} />
                    <Token token={toToken} amount={amountOutMin} disabled={disabled} buy={true} />
                </View>
                <Field label={"Price"} value={price.toString(8)} disabled={disabled} minWidth={0} />
                <Field label={"Status"} value={status} disabled={disabled} minWidth={64} />
            </FlexView>
        </Selectable>
    );
};

const Token = ({ token, amount, disabled, buy }) => {
    const { green, red, disabled: colorDisabled } = useColors();
    return (
        <FlexView style={{ alignItems: "center" }}>
            <TokenLogo token={token} disabled={disabled} />
            <Text style={{ color: disabled ? colorDisabled : buy ? green : red, marginLeft: Spacing.tiny, width: 40 }}>
                {buy ? "BUY" : "SELL"}
            </Text>
            <TokenAmount token={token} amount={amount} disabled={disabled} />
            <TokenSymbol token={token} disabled={disabled} />
        </FlexView>
    );
};

const Field = ({ label, value, disabled, minWidth }) => {
    const { textMedium, textLight, disabled: colorDisabled } = useColors();
    return (
        <View style={{ flex: minWidth ? 0 : 1, minWidth, marginLeft: Spacing.tiny }}>
            <Text note={true} style={{ textAlign: "right", color: disabled ? colorDisabled : textLight }}>
                {label}
            </Text>
            <Text
                caption={true}
                light={true}
                style={{ textAlign: "right", color: disabled ? colorDisabled : textMedium }}>
                {value}
            </Text>
        </View>
    );
};

const OrderInfo = ({ state }: { state: MyLimitOrdersState }) => {
    const order = state.selectedOrder;
    const amountIn = order ? formatBalance(order.amountIn, order.fromToken.decimals) : undefined;
    const amountOutMin = order ? formatBalance(order.amountOutMin, order.toToken.decimals) : undefined;
    const filledAmountIn = order ? formatBalance(order.filledAmountIn!, order.fromToken.decimals) : undefined;
    const expiry = useMemo(() => {
        if (order) {
            const deadline = new Date(order.deadline.toNumber() * 1000);
            const now = Date.now();
            const diff = moment(deadline).diff(now);
            return moment(deadline).isAfter(now) ? moment.utc(diff).format("HH[h] mm[m]") : null;
        }
    }, [order]);
    const disabled = !state.selectedOrder;
    return (
        <InfoBox>
            <Meta label={"Amount Filled"} text={filledAmountIn} suffix={order?.fromToken?.symbol} disabled={disabled} />
            <Meta label={"Amount To Sell"} text={amountIn} suffix={order?.fromToken?.symbol} disabled={disabled} />
            <Meta label={"Amount To Buy"} text={amountOutMin} suffix={order?.toToken?.symbol} disabled={disabled} />
            {expiry && <Meta label={"Expiration"} text={expiry} disabled={disabled} />}
            <FilledEvents state={state} />
            <Controls state={state} />
        </InfoBox>
    );
};

const FilledEvents = ({ state }: { state: MyLimitOrdersState }) => {
    const prefix = "https://etherscan.io/tx/";
    return (
        <View>
            {state.filledEvents &&
                state.filledEvents.map((event, i) => {
                    const hash = event.transactionHash;
                    const tx = hash.substring(0, 10) + "..." + hash.substring(hash.length - 8);
                    return <Meta key={i} label={"Filled TX #" + i} text={tx} url={prefix + hash} />;
                })}
        </View>
    );
};

const Controls = ({ state }: { state: MyLimitOrdersState }) => {
    const [error, setError] = useState<MetamaskError>({});
    useAsyncEffect(() => setError({}), [state.selectedOrder]);
    return (
        <View style={{ marginTop: Spacing.normal }}>
            <CancelButton state={state} onError={setError} />
            {error.message && error.code !== 4001 && <ErrorMessage error={error} />}
        </View>
    );
};

const CancelButton = ({ state, onError }: { state: MyLimitOrdersState; onError: (e) => void }) => {
    const onPress = useCallback(() => {
        onError({});
        state.onCancelOrder().catch(onError);
    }, [state.onCancelOrder, onError]);
    const disabled = !state.selectedOrder || state.selectedOrder.status() !== "Open";
    return <Button title={"Cancel Order"} loading={state.cancellingOrder} onPress={onPress} disabled={disabled} />;
};

export default MyLimitOrdersScreen;
