import React, { FC } from "react";

import { IS_DESKTOP } from "../constants/dimension";
import useColors from "../hooks/useColors";
import useLinker from "../hooks/useLinker";
import FlexView from "./FlexView";
import Text from "./Text";

export interface MetaProps {
    label: string;
    text?: string;
    suffix?: string;
    url?: string;
    disabled?: boolean;
}

const Meta: FC<MetaProps> = props => {
    const { textMedium, textLight, placeholder } = useColors();
    const onPress = useLinker(props.url || "", "", "_blank");
    const text = props.disabled
        ? "N/A"
        : props.text
        ? props.text + (props.suffix ? " " + props.suffix : "")
        : "Fetching…";
    return (
        <FlexView style={{ justifyContent: "space-between", marginTop: 4 }}>
            <Text note={!IS_DESKTOP} fontWeight={"bold"} style={{ color: props.disabled ? placeholder : textMedium }}>
                {props.label}
            </Text>
            <Text
                note={!IS_DESKTOP}
                onPress={props.url ? onPress : undefined}
                style={{
                    color: props.disabled ? placeholder : props.text ? textMedium : textLight,
                    textDecorationLine: props.url ? "underline" : "none"
                }}>
                {text}
            </Text>
        </FlexView>
    );
};

export default Meta;
