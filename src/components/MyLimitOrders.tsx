import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Image, TouchableHighlight, View } from "react-native";
import { Hoverable } from "react-native-web-hover";

import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import useMyLimitOrdersState, { MyLimitOrdersState } from "../hooks/useMyLimitOrdersState";
import { Order } from "../hooks/useSDK";
import { formatBalance } from "../utils";
import Border from "./Border";
import CloseIcon from "./CloseIcon";
import Column from "./Column";
import FlexView from "./FlexView";
import SelectIcon from "./SelectIcon";
import Text from "./Text";

const MyLimitOrders = () => {
    const state = useMyLimitOrdersState();
    return (
        <>
            <Column style={{ alignItems: "center" }}>
                <Text h4={true} style={{ textAlign: "center", marginBottom: Spacing.normal }}>
                    📝 My Orders
                </Text>
                <OrderSelect state={state} />
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
                {"1. Select an order you want to CANCEL:"}
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
    const { background, backgroundHovered, textMedium } = useColors();
    const amountIn = formatBalance(props.order.amountIn, props.order.fromToken.decimals, 18);
    const onPress = useCallback(() => {
        props.onSelectOrder(props.order);
    }, [props.onSelectOrder, props.order]);
    return (
        <Hoverable>
            {({ hovered }) => (
                <TouchableHighlight onPress={onPress}>
                    <View style={{ backgroundColor: hovered ? backgroundHovered : background }}>
                        <FlexView style={{ alignItems: "center", margin: Spacing.small }}>
                            <View>
                                <LogoSymbol token={props.order.fromToken} />
                                <LogoSymbol token={props.order.toToken} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text note={true} style={{ textAlign: "right" }}>
                                    Amount
                                </Text>
                                <Text light={true} style={{ textAlign: "right", fontSize: 22, color: textMedium }}>
                                    {amountIn}
                                </Text>
                            </View>
                            {props.selected ? <CloseIcon /> : <SelectIcon />}
                        </FlexView>
                    </View>
                </TouchableHighlight>
            )}
        </Hoverable>
    );
};

const LogoSymbol = ({ token }) => {
    const { textMedium } = useColors();
    const [isEmpty, setIsEmpty] = useState(false);
    const source = isEmpty ? require("../../assets/empty-token.png") : { uri: token.logoURI };
    return (
        <FlexView style={{ alignItems: "center", marginBottom: Spacing.tiny }}>
            <Image
                source={source}
                onError={() => setIsEmpty(true)}
                style={{ width: 24, height: 24, backgroundColor: "white", borderRadius: 12 }}
            />
            <Text light={true} style={{ fontSize: 22, color: textMedium, marginLeft: Spacing.small }}>
                {token.symbol.replace(/\+/g, "+\n")}
            </Text>
        </FlexView>
    );
};

export default MyLimitOrders;
