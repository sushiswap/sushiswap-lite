import React, { FC } from "react";

import useColors from "../hooks/useColors";
import FlexView from "./FlexView";
import Text from "./Text";

export interface MetaProps {
    label: string;
    text?: string;
    suffix?: string;
    disabled?: boolean;
}

const Meta: FC<MetaProps> = props => {
    const { textMedium, textLight, placeholder } = useColors();
    return (
        <FlexView style={{ justifyContent: "space-between", marginTop: 4 }}>
            <Text fontWeight={"bold"} style={{ fontSize: 13, color: props.disabled ? placeholder : textMedium }}>
                {props.label}
            </Text>
            <Text style={{ fontSize: 13, color: props.disabled ? placeholder : props.text ? textMedium : textLight }}>
                {props.disabled
                    ? "N/A"
                    : props.text
                    ? props.text + (props.suffix ? " " + props.suffix : "")
                    : "Fetching…"}
            </Text>
        </FlexView>
    );
};

export default Meta;
