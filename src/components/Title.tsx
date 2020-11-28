import React, { FC } from "react";
import { TextStyle } from "react-native";

import { IS_DESKTOP, Spacing } from "../constants/dimension";
import Text from "./Text";

interface TitleProps {
    text: string;
    fontWeight?: "light" | "regular" | "bold";
    disabled?: boolean;
    style?: TextStyle;
}

const Title: FC<TitleProps> = props => {
    return (
        <Text
            fontWeight={props.fontWeight || "bold"}
            disabled={props.disabled}
            style={[{ marginBottom: Spacing.tiny, fontSize: IS_DESKTOP ? 40 : 28 }, props.style]}>
            {props.text}
        </Text>
    );
};

export default Title;
