import React from "react";
import { View } from "react-native";

import AddLiquidity from "../components/AddLiquidity";
import Container from "../components/Container";
import Content from "../components/Content";
import OR from "../components/OR";
import RemoveLiquidity from "../components/RemoveLiquidity";
import { Spacing } from "../constants/dimension";
import Screen from "./Screen";

const LiquidityScreen = () => {
    return (
        <Screen>
            <Container>
                <Content>
                    <View style={{ width: "100%", alignItems: "center", marginBottom: Spacing.huge * 2 }}>
                        <AddLiquidity />
                        <OR />
                        <RemoveLiquidity />
                    </View>
                </Content>
            </Container>
        </Screen>
    );
};

export default LiquidityScreen;
