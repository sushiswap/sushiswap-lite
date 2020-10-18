import React, { FC } from "react";
import { Text as NativeText, TextProps as NativeTextProps } from "react-native-elements";

import useColors from "../hooks/useColors";

export interface TextProps extends NativeTextProps {
    note?: boolean;
    caption?: boolean;
    dark?: boolean;
    medium?: boolean;
    light?: boolean;
    disabled?: boolean;
    fontWeight?: "light" | "regular" | "bold";
}

const Text: FC<TextProps> = props => {
    const { textDark, textMedium, textLight, placeholder } = useColors();
    const fontFamily = props.fontWeight || "regular";
    const color = props.disabled
        ? placeholder
        : props.medium
        ? textMedium
        : props.note || props.light
        ? textLight
        : textDark;
    return (
        <NativeText
            {...props}
            h1Style={[{ fontFamily }, props.h1Style]}
            h2Style={[{ fontFamily }, props.h2Style]}
            h3Style={[{ fontFamily }, props.h3Style]}
            h4Style={[{ fontFamily }, props.h4Style]}
            style={[
                {
                    fontFamily,
                    fontSize: props.note ? 13 : props.caption ? 18 : 15,
                    color
                },
                props.style
            ]}
        />
    );
};
export default Text;
