import React, { FC } from "react";
import { Platform, View, ViewProps, ViewStyle } from "react-native";

import { Spacing } from "../constants/dimension";

interface ColumnProps extends ViewProps {
    noTopMargin?: boolean;
    style?: ViewStyle;
}

const Column: FC<ColumnProps> = props => (
    <View
        {...props}
        style={[
            {
                width: "100%",
                marginTop: props.noTopMargin ? 0 : Platform.OS === "web" ? Spacing.large : Spacing.normal
            },
            props.style
        ]}
    />
);

export default Column;
