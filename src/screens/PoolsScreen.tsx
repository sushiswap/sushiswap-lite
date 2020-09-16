import React from "react";
import { View } from "react-native";

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

const PoolsScreen = () => {
    const addLiquidityState = useAddLiquidityState();
    const removeLiquidityState = useRemoveLiquidityState();
    const showAdd = !removeLiquidityState.selectedLPToken;
    const showRemove = addLiquidityState.fromSymbol === "";
    return (
        <Screen>
            <Container>
                <Content>
                    <View style={{ alignItems: "center", marginBottom: Spacing.large }}>
                        {showAdd && <AddLiquidity state={addLiquidityState} />}
                        {showAdd && showRemove && <OR />}
                        {showRemove && <RemoveLiquidity state={removeLiquidityState} />}
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
                    paddingVertical: Spacing.huge,
                    alignItems: "center"
                }}>
                <Line />
                <Text h4={true} light={true} style={{ paddingHorizontal: Spacing.small, backgroundColor: background }}>
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

export default PoolsScreen;
