import React from "react";
import { View, ViewStyle } from "react-native";

import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import useStyles from "../hooks/useStyles";
import Button from "./Button";
import Text from "./Text";

export interface NoticeProps {
    text: string;
    clear?: boolean;
    color?: string;
    buttonText?: string;
    onPressButton?: () => void;
    style?: ViewStyle;
}

const Notice = (props: NoticeProps) => {
    const { textLight } = useColors();
    const { border } = useStyles();
    const borderStyle = border({ color: props.color });
    const color = props.color || textLight;
    return (
        <View style={[props.clear ? {} : borderStyle, props.style]}>
            <Text note={true} style={{ color }}>
                {props.text}
            </Text>
            {props.buttonText && props.onPressButton && (
                <Button
                    title={props.buttonText}
                    type={"clear"}
                    size={"small"}
                    fontWeight={"bold"}
                    onPress={props.onPressButton}
                    titleStyle={{ color }}
                    buttonStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
                    style={{ alignSelf: "flex-end", marginTop: Spacing.tiny }}
                />
            )}
        </View>
    );
};

export default Notice;
