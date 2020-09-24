import React from "react";
import { Platform, View } from "react-native";

import AddLiquidity from "../components/AddLiquidity";
import Column from "../components/Column";
import Container from "../components/Container";
import Content from "../components/Content";
import FlexView from "../components/FlexView";
import RemoveLiquidity from "../components/RemoveLiquidity";
import Text from "../components/Text";
import { Spacing } from "../constants/dimension";
import useAddLiquidityState from "../hooks/useAddLiquidityState";
import useColors from "../hooks/useColors";
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

const OR = () => {
    const { background } = useColors();
    return (
        <Column>
            <FlexView
                style={{
                    width: "100%",
                    paddingHorizontal: Spacing.small,
                    paddingVertical: Platform.OS === "web" ? Spacing.huge : Spacing.normal,
                    alignItems: "center"
                }}>
                <Line />
                <Text
                    light={true}
                    style={{
                        paddingHorizontal: Spacing.small,
                        paddingBottom: Spacing.tiny,
                        backgroundColor: background,
                        fontSize: 26
                    }}>
                    or
                </Text>
                <Line />
            </FlexView>
        </Column>
    );
};

const Line = () => {
    const { border } = useColors();
    return <View style={{ height: 1, flex: 1, backgroundColor: border }} />;
};

export default LiquidityScreen;
