import React, { FC } from "react";
import { TextStyle } from "react-native";

import { IS_DESKTOP, Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import Button from "./Button";
import FlexView from "./FlexView";
import Text from "./Text";

interface HeadingProps {
    text: string;
    fontWeight?: "light" | "regular" | "bold";
    disabled?: boolean;
    buttonText?: string;
    onPressButton?: () => void | Promise<void>;
    style?: TextStyle;
}

const Heading: FC<HeadingProps> = props => {
    const { accent } = useColors();
    return (
        <FlexView style={{ alignItems: "flex-end", height: 32, marginBottom: props.disabled ? 0 : Spacing.small }}>
            <Text
                medium={true}
                fontWeight={props.fontWeight || "bold"}
                disabled={props.disabled}
                style={[{ flex: 1, fontSize: IS_DESKTOP ? 24 : 18, paddingBottom: Spacing.tiny }, props.style]}>
                {props.text}
            </Text>
            {props.buttonText && (
                <Button
                    type={"clear"}
                    size={"small"}
                    title={props.buttonText}
                    onPress={props.onPressButton}
                    color={accent}
                    buttonStyle={{ paddingHorizontal: Spacing.tiny }}
                />
            )}
        </FlexView>
    );
};

export default Heading;
