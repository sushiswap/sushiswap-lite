import React from "react";
import { Platform, View } from "react-native";

import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import Column from "./Column";
import FlexView from "./FlexView";
import Text from "./Text";

const OR = () => {
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

export default OR;
