import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Image, Platform, TouchableHighlight, View } from "react-native";
import { Hoverable } from "react-native-web-hover";

import useAsyncEffect from "use-async-effect";
import Border from "../components/Border";
import Button from "../components/Button";
import CloseIcon from "../components/CloseIcon";
import Column from "../components/Column";
import Container from "../components/Container";
import Content from "../components/Content";
import ErrorMessage from "../components/ErrorMessage";
import FlexView from "../components/FlexView";
import Meta from "../components/Meta";
import SelectIcon from "../components/SelectIcon";
import Subtitle from "../components/Subtitle";
import Text from "../components/Text";
import WebFooter from "../components/web/WebFooter";
import { Spacing } from "../constants/dimension";
import Fraction from "../constants/Fraction";
import useColors from "../hooks/useColors";
import useMyLimitOrdersState, { MyLimitOrdersState } from "../hooks/useMyLimitOrdersState";
import { Order } from "../hooks/useSDK";
import MetamaskError from "../types/MetamaskError";
import { formatBalance, formatDate } from "../utils";
import Screen from "./Screen";

const MyLimitOrdersScreen = () => {
    return (
        <Screen>
            <Container>
                <Content>
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
        <>
            <Column style={{ alignItems: "center" }}>
                <Text h4={true} style={{ textAlign: "center", marginBottom: Spacing.normal }}>
                    ⏳ My Limit Orders
                </Text>
                <OrderSelect state={state} />
                <OrderInfo state={state} />
                <Controls state={state} />
            </Column>
        </>
    );
};

const OrderSelect = (props: { state: MyLimitOrdersState }) => {
    const onUnselectOrder = useCallback(() => {
        props.state.setSelectedOrder(undefined);
    }, [props.state.setSelectedOrder]);
    return (
        <Column>
            <Text fontWeight={"bold"} medium={true} style={{ marginBottom: Spacing.normal, fontSize: 20 }}>
                {"1. Select a limit order you've placed:"}
            </Text>
            {props.state.selectedOrder ? (
                <OrderItem order={props.state.selectedOrder} selected={true} onSelectOrder={onUnselectOrder} />
            ) : (
                <OrderList state={props.state} />
            )}
        </Column>
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
    return state.loading || !state.orders ? (
        <ActivityIndicator size={"large"} style={{ marginTop: Spacing.large }} />
    ) : state.orders.length === 0 ? (
        <EmptyList />
    ) : (
        <FlatList
            keyExtractor={item => JSON.stringify(item)}
            data={state.orders}
            renderItem={renderItem}
            ItemSeparatorComponent={Border}
        />
    );
};

const EmptyList = () => {
    return (
        <View style={{ margin: Spacing.normal }}>
            <Text light={true} style={{ textAlign: "center", width: "100%" }}>
                {"You don't have any limit orders placed."}
            </Text>
        </View>
    );
};

const OrderItem = (props: { order: Order; selected: boolean; onSelectOrder: (order: Order) => void }) => {
    const { background, backgroundHovered } = useColors();
    const { amountIn, amountOutMin, fromToken, toToken } = props.order;
    const status = props.order.status();
    const disabled = status !== "Open";
    const price = Fraction.fromTokens(amountOutMin, amountIn, toToken, fromToken);
    const onPress = useCallback(() => props.onSelectOrder(props.order), [props.onSelectOrder, props.order]);
    return (
        <Hoverable>
            {({ hovered }) => (
                <TouchableHighlight onPress={onPress}>
                    <View style={{ backgroundColor: hovered ? backgroundHovered : background }}>
                        <FlexView style={{ alignItems: "center", margin: Spacing.small }}>
                            <View>
                                <TokenAmount token={fromToken} amount={amountIn} disabled={disabled} buy={false} />
                                <TokenAmount token={toToken} amount={amountOutMin} disabled={disabled} buy={true} />
                            </View>
                            <MetaColumn label={"Price"} value={price.toString(4)} disabled={disabled} minWidth={0} />
                            <MetaColumn label={"Status"} value={status} disabled={disabled} minWidth={64} />
                            {props.selected ? <CloseIcon /> : <SelectIcon />}
                        </FlexView>
                    </View>
                </TouchableHighlight>
            )}
        </Hoverable>
    );
};

const TokenAmount = ({ token, amount, disabled, buy }) => {
    const { textMedium, green, red, disabled: colorDisabled } = useColors();
    const [isEmpty, setIsEmpty] = useState(false);
    const source = isEmpty ? require("../../assets/empty-token.png") : { uri: token.logoURI };
    return (
        <FlexView style={{ alignItems: "center", marginBottom: Spacing.tiny }}>
            <Image
                source={source}
                onError={() => setIsEmpty(true)}
                style={{ width: 24, height: 24, backgroundColor: "white", borderRadius: 12 }}
            />
            <Text
                fontWeight={"light"}
                style={{ fontSize: 22, color: disabled ? colorDisabled : textMedium, marginLeft: Spacing.tiny }}>
                {formatBalance(amount, token.decimals, 4)}
            </Text>
            <Text style={{ fontSize: 22, marginLeft: Spacing.tiny, color: disabled ? colorDisabled : textMedium }}>
                {token.symbol.replace(/\+/g, "+\n")}
            </Text>
            <Text
                style={{ color: disabled ? colorDisabled : buy ? green : red, fontSize: 22, marginLeft: Spacing.tiny }}>
                {buy ? "IN" : "OUT"}
            </Text>
        </FlexView>
    );
};

const MetaColumn = ({ label, value, disabled, minWidth }) => {
    const { textMedium, textLight, disabled: colorDisabled } = useColors();
    return (
        <View style={{ flex: minWidth ? 0 : 1, minWidth, marginLeft: Spacing.tiny }}>
            <Text note={true} style={{ textAlign: "right", color: disabled ? colorDisabled : textLight }}>
                {label}
            </Text>
            <Text
                light={true}
                style={{ textAlign: "right", fontSize: 20, color: disabled ? colorDisabled : textMedium }}>
                {value}
            </Text>
        </View>
    );
};

const OrderInfo = ({ state }: { state: MyLimitOrdersState }) => {
    if (!state.selectedOrder) return <Column noTopMargin={true} />;
    const { amountIn, amountOutMin, fromToken, toToken, deadline } = state.selectedOrder;
    const filledAmountIn = state.selectedOrder.filledAmountIn;
    const price = Fraction.fromTokens(amountOutMin, amountIn, toToken, fromToken);
    const expiry = new Date(deadline.toNumber() * 1000);
    return (
        <Column>
            <Subtitle text={"2. Do you want to cancel the order?"} />
            <Meta
                label={"Amount Filled"}
                text={filledAmountIn ? formatBalance(filledAmountIn, fromToken.decimals) : undefined}
                suffix={fromToken.symbol}
            />
            <Meta label={"Amount Out"} text={formatBalance(amountIn, fromToken.decimals)} suffix={fromToken.symbol} />
            <Meta label={"Amount In"} text={formatBalance(amountOutMin, toToken.decimals)} suffix={toToken.symbol} />
            <Meta label={"Price"} text={price.toString()} suffix={toToken.symbol + " / " + fromToken.symbol} />
            <Meta label={"Expiration"} text={formatDate(expiry)} />
        </Column>
    );
};

const Controls = ({ state }: { state: MyLimitOrdersState }) => {
    const [error, setError] = useState<MetamaskError>({});
    useAsyncEffect(() => setError({}), [state.selectedOrder]);
    if (!state.selectedOrder) return <Column noTopMargin={true} />;
    return (
        <Column>
            <CancelButton state={state} onError={setError} />
            {error.message && error.code !== 4001 && <ErrorMessage error={error} />}
        </Column>
    );
};

const CancelButton = ({ state, onError }: { state: MyLimitOrdersState; onError: (e) => void }) => {
    const onPress = useCallback(() => {
        onError({});
        state.onCancelOrder().catch(onError);
    }, [state.onCancelOrder, onError]);
    const disabled = !state.selectedOrder || state.selectedOrder.status() !== "Open";
    return (
        <Button size={"large"} title={"Cancel"} loading={state.cancellingOrder} onPress={onPress} disabled={disabled} />
    );
};

export default MyLimitOrdersScreen;
