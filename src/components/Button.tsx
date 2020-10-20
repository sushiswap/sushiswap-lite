import React, { FC } from "react";
import { Button as NativeButton, ButtonProps as NativeButtonProps } from "react-native-elements";

import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";

export interface ButtonProps extends NativeButtonProps {
    color?: string;
    size?: "small" | "normal" | "large";
    fontWeight?: "light" | "regular" | "bold";
}

// tslint:disable-next-line:max-func-body-length
const Button: FC<ButtonProps> = props => {
    const { primary, textMedium, placeholder, backgroundLight } = useColors();
    const type = props.type || "solid";
    const size = props.size || "normal";
    const height = props.size === "small" ? 36 : size === "normal" ? 45 : 54;
    const fontSize = props.size === "small" ? 13 : size === "normal" ? 15 : 18;
    const fontFamily = props.fontWeight || "regular";
    return (
        <NativeButton
            {...props}
            disabled={props.loading || props.disabled}
            onPress={props.loading ? undefined : props.onPress}
            type={type}
            buttonStyle={[
                {
                    height,
                    paddingHorizontal: Spacing.small,
                    backgroundColor: "transparent"
                },
                props.buttonStyle
            ]}
            titleStyle={[
                { fontSize, fontFamily, color: type === "solid" ? "white" : props.color || textMedium },
                props.titleStyle
            ]}
            disabledTitleStyle={[{ fontSize, fontFamily, color: placeholder }, props.titleStyle]}
            style={[{ backgroundColor: type === "solid" ? props.color || primary : "transparent" }, props.style]}
            disabledStyle={[
                { backgroundColor: type === "solid" ? backgroundLight : "transparent" },
                props.disabledStyle
            ]}
        />
    );
};
export default Button;
