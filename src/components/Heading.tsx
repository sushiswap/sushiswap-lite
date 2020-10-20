import React, { FC } from "react";

import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import Button from "./Button";
import FlexView from "./FlexView";
import Text from "./Text";

interface HeadingProps {
    text: string;
    disabled?: boolean;
    buttonText?: string;
    onPressButton?: () => void | Promise<void>;
}

const Heading: FC<HeadingProps> = props => {
    const { accent } = useColors();
    return (
        <FlexView style={{ alignItems: "flex-end", height: 32, marginBottom: props.disabled ? 0 : Spacing.small }}>
            <Text
                medium={true}
                fontWeight={"bold"}
                disabled={props.disabled}
                style={{ flex: 1, fontSize: 18, paddingBottom: Spacing.tiny }}>
                {props.text}
            </Text>
            {props.buttonText && (
                <Button
                    type={"clear"}
                    size={"small"}
                    title={props.buttonText}
                    onPress={props.onPressButton}
                    color={accent}
                />
            )}
        </FlexView>
    );
};

export default Heading;
