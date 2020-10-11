import React from "react";
import { View } from "react-native";

import AddLiquidity from "../components/AddLiquidity";
import Container from "../components/Container";
import Content from "../components/Content";
import OR from "../components/OR";
import RemoveLiquidity from "../components/RemoveLiquidity";
import { Spacing } from "../constants/dimension";
import useAddLiquidityState from "../hooks/useAddLiquidityState";
import useRemoveLiquidityState from "../hooks/useRemoveLiquidityState";
import Screen from "./Screen";

const LiquidityScreen = () => {
    const addLiquidityState = useAddLiquidityState();
    const removeLiquidityState = useRemoveLiquidityState();
    return (
        <Screen>
            <Container>
                <Content>
                    <View style={{ width: "100%", alignItems: "center", marginBottom: Spacing.huge * 2 }}>
                        {!removeLiquidityState.selectedLPToken && <AddLiquidity state={addLiquidityState} />}
                        {!removeLiquidityState.selectedLPToken && <OR />}
                        <RemoveLiquidity state={removeLiquidityState} />
                    </View>
                </Content>
            </Container>
        </Screen>
    );
};

export default LiquidityScreen;
