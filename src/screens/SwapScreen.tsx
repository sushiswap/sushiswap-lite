import React from "react";
import { View } from "react-native";

import Container from "../components/Container";
import Content from "../components/Content";
import MyLimitOrders from "../components/MyLimitOrders";
import OR from "../components/OR";
import Swap from "../components/Swap";
import { Spacing } from "../constants/dimension";
import Screen from "./Screen";

const SwapScreen = () => {
    return (
        <Screen>
            <Container>
                <Content>
                    <View style={{ width: "100%", alignItems: "center", marginBottom: Spacing.huge * 2 }}>
                        <Swap />
                        <OR />
                        <MyLimitOrders />
                    </View>
                </Content>
            </Container>
        </Screen>
    );
};

export default SwapScreen;
