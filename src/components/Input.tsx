import React, { FC, useCallback } from "react";
import { Platform } from "react-native";
import { Input as NativeInput, InputProps as NativeInputProps } from "react-native-elements";

import useColors from "../hooks/useColors";

export interface Validation {
    regexp: RegExp;
    error: string;
}

export interface InputProps extends NativeInputProps {
    color?: string;
    size?: "small" | "normal" | "large";
    allowed?: Validation[];
    forbidden?: Validation[];
    onError?: (error: string) => void;
}

// tslint:disable-next-line:max-func-body-length
const Input: FC<InputProps> = props => {
    const { textDark, textMedium, textLight } = useColors();
    const size = props.size || "normal";
    const color = props.color || textDark;
    const fontSize = size === "small" ? 16 : size === "large" ? 24 : 20;
    const onChangeText = useCallback(
        (text: string) => {
            props.onChangeText?.(text);
            props.onError?.("");
            const errors = [] as string[];
            if (text !== "" && props.forbidden) {
                props.forbidden.forEach(validation => {
                    if (text.match(validation.regexp)) {
                        errors.push(validation.error);
                    }
                });
            }
            if (text !== "" && props.allowed) {
                props.allowed.forEach(validation => {
                    if (!text.match(validation.regexp)) {
                        errors.push(validation.error);
                    }
                });
            }
            if (errors.length > 0) {
                props.onError?.(errors.join("\n"));
            }
        },
        [props.onChangeText, props.onError, props.forbidden, props.allowed]
    );
    return (
        <NativeInput
            {...props}
            inputStyle={[
                { fontSize, fontFamily: "regular", paddingBottom: 4, color, marginTop: 0, minHeight: 32 },
                // @ts-ignore
                Platform.OS === "web" ? { outline: "none" } : {},
                props.inputStyle
            ]}
            labelStyle={[{ color: textMedium }, props.labelStyle]}
            placeholderTextColor={props.placeholderTextColor || textLight}
            errorStyle={props.onError ? { height: 0 } : props.errorStyle}
            containerStyle={[{ paddingHorizontal: 0 }, props.containerStyle]}
            onChangeText={onChangeText}
        />
    );
};

export default Input;
