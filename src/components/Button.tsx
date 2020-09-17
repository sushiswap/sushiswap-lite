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
    const { primary, shadow, borderDark, textMedium } = useColors();
    const type = props.type || "solid";
    const size = props.size || "normal";
    const height = props.size === "small" ? 40 : size === "normal" ? 48 : 56;
    const fontSize = props.size === "small" ? 14 : size === "normal" ? 16 : 18;
    const fontFamily = props.fontWeight || "regular";
    const color = props.color || type === "solid" ? primary : textMedium;
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
            containerStyle={[
                !props.type || props.type === "solid"
                    ? {
                          borderRadius: Spacing.tiny,
                          elevation: Spacing.small,
                          shadowColor: shadow,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.5,
                          shadowRadius: 4,
                          overflow: "visible"
                      }
                    : {},
                props.containerStyle
            ]}
        />
    );
};
export default Button;
