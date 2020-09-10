import React from "react";
import { View, ViewProps } from "react-native";

import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";

interface ContentProps extends ViewProps {
    contentPadding?: "small" | "normal" | "large";
}

const Content: React.FunctionComponent<ContentProps> = props => {
    const { background } = useColors();
    const multiplier = {
        small: 0.75,
        normal: 1,
        large: 1.5
    }[props.contentPadding || "normal"];
    return (
        <View
            {...props}
            style={[
                {
                    paddingHorizontal: Spacing.content * multiplier,
                    paddingVertical: Spacing.normal * multiplier,
                    backgroundColor: background
                },
                props.style
            ]}
        />
    );
};
export default Content;
