import React from "react";
import { View } from "react-native";

import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import useStyles from "../hooks/useStyles";
import Column from "./Column";
import Text from "./Text";

const Guide = (props: { hidden: boolean; text: string; buttonTitle: string; onPressButton: () => void }) => {
    const { accent } = useColors();
    const { border } = useStyles();
    const borderStyle = border({ color: accent });
    if (props.hidden) return <Column noTopMargin={true} />;
    return (
        <Column style={{ marginTop: Spacing.huge }}>
            <View style={{ ...borderStyle, width: "100%", alignItems: "center" }}>
                <Text note={true} style={{ color: borderStyle.borderColor }}>
                    {props.text}
                </Text>
                <Text
                    note={true}
                    fontWeight={"bold"}
                    style={{ textDecorationLine: "underline", color: borderStyle.borderColor, textAlign: "center" }}
                    onPress={props.onPressButton}>
                    {props.buttonTitle}
                </Text>
            </View>
        </Column>
    );
};

export default Guide;
