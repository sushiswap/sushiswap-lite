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
    const { primary, borderDark, textMedium, underlay } = useColors();
    const type = props.type || "solid";
    const size = props.size || "normal";
    const height = props.size === "small" ? 36 : size === "normal" ? 45 : 54;
    const fontSize = props.size === "small" ? 12 : size === "normal" ? 15 : 18;
    const fontFamily = props.fontWeight || "regular";
    const color = type === "solid" ? "white" : props.color || textMedium;
    const backgroundColor = type === "solid" ? (props.disabled ? underlay : props.color || primary) : "transparent";
    return (
        <NativeButton
            {...props}
            type={type}
            buttonStyle={[
                {
                    height,
                    paddingHorizontal: Spacing.small,
                    backgroundColor,
                    borderColor: borderDark
                },
                props.buttonStyle
            ]}
            titleStyle={[{ fontSize, fontFamily, color }, props.titleStyle]}
        />
    );
};
export default Button;
