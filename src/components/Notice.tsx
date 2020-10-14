import React from "react";
import { View } from "react-native";

import { Spacing } from "../constants/dimension";
import useStyles from "../hooks/useStyles";
import Text from "./Text";

const Notice = (props: { text: string; color?: string; buttonText?: string; onPressButton?: () => void }) => {
    const { border } = useStyles();
    const borderStyle = border(props.color);
    const color = props.color || borderStyle.borderColor;
    return (
        <View style={borderStyle}>
            <Text
                note={true}
                style={{
                    color
                }}>
                {props.text}
            </Text>
            {props.buttonText && props.onPressButton && (
                <Text
                    note={true}
                    onPress={props.onPressButton}
                    fontWeight={"bold"}
                    style={{ color, alignSelf: "flex-end", marginTop: Spacing.tiny }}>
                    {props.buttonText}
                </Text>
            )}
        </View>
    );
};

export default Notice;
