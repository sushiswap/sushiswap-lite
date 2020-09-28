import React, { FC } from "react";
import { View, ViewProps, ViewStyle } from "react-native";

import { Spacing } from "../constants/dimension";

interface ColumnProps extends ViewProps {
    noTopMargin?: boolean;
    style?: ViewStyle;
}

const Column: FC<ColumnProps> = props => (
    <View {...props} style={[{ width: 440, marginTop: props.noTopMargin ? 0 : Spacing.large }, props.style]} />
);

export default Column;
