import React, { FC } from "react";
import { View, ViewProps } from "react-native";

import { Spacing } from "../constants/dimension";

interface ColumnProps extends ViewProps {
    noTopMargin?: boolean;
}

const Column: FC<ColumnProps> = props => (
    <View {...props} style={{ width: 440, marginTop: props.noTopMargin ? 0 : Spacing.large }} />
);

export default Column;
