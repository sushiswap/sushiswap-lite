import React, { FC } from "react";

import { IS_DESKTOP, Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import Text from "./Text";

export interface AmountMetaProps {
    amount?: string;
    suffix?: string;
    disabled?: boolean;
}

const AmountMeta: FC<AmountMetaProps> = props => {
    const { textDark, textLight, placeholder } = useColors();
    return (
        <Text
            style={{
                fontSize: IS_DESKTOP ? 28 : 20,
                marginBottom: Spacing.normal,
                color: props.disabled ? placeholder : props.amount ? textDark : textLight
            }}>
            {props.disabled ? "N/A" : props.amount ? props.amount + " " + (props.suffix || "") : "Fetching…"}
        </Text>
    );
};

export default AmountMeta;
