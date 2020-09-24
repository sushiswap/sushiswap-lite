import React from "react";
import { Platform, View, ViewProps } from "react-native";

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
        <View style={{ alignItems: "center", flex: 1, width: "100%", backgroundColor: background }}>
            <View style={{ width: Platform.OS === "web" ? 1280 : "100%", flex: 1 }}>
                <View
                    {...props}
                    style={[
                        {
                            paddingHorizontal: Spacing.content * multiplier,
                            paddingVertical: Platform.OS === "web" ? Spacing.normal * multiplier : 0,
                            backgroundColor: background,
                            alignItems: "center"
                        },
                        props.style
                    ]}
                />
            </View>
        </View>
    );
};
export default Content;
