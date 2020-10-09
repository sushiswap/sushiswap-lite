import React, { FC } from "react";
import { Button as NativeButton, ButtonProps as NativeButtonProps } from "react-native-elements";

import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import useStyles from "../hooks/useStyles";

export interface ButtonProps extends NativeButtonProps {
    color?: string;
    size?: "small" | "normal" | "large";
    fontWeight?: "light" | "regular" | "bold";
}

// tslint:disable-next-line:max-func-body-length
const Button: FC<ButtonProps> = props => {
    const { primary, borderDark, textMedium } = useColors();
    const { shadow } = useStyles();
    const type = props.type || "solid";
    const size = props.size || "normal";
    const height = props.size === "small" ? 40 : size === "normal" ? 48 : 56;
    const fontSize = props.size === "small" ? 14 : size === "normal" ? 16 : 18;
    const fontFamily = props.fontWeight || "regular";
    const color = type === "solid" ? "white" : props.color || textMedium;
    return (
        <NativeButton
            {...props}
            type={type}
            buttonStyle={[
                {
                    height,
                    paddingHorizontal: Spacing.small,
                    backgroundColor: type === "solid" ? props.color || primary : "transparent",
                    borderColor: borderDark
                },
                props.buttonStyle
            ]}
            titleStyle={[{ fontSize, fontFamily, color }, props.titleStyle]}
            containerStyle={[type === "solid" || type === "outline" ? shadow() : {}, props.containerStyle]}
        />
    );
};
export default Button;
