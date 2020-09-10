import React, { FunctionComponent } from "react";
import { View, ViewProps } from "react-native";

interface FlexViewProps extends ViewProps {
    direction?: "row" | "column";
}

const FlexView: FunctionComponent<FlexViewProps> = props => {
    const flexDirection = props.direction || "row";
    return <View {...props} style={[{ flexDirection }, props.style]} />;
};
export default FlexView;
