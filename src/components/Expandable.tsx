import React, { FC, ReactNode, useState } from "react";
import { View, ViewStyle } from "react-native";

import Heading from "./Heading";

export interface ExpandableProps {
    title: string;
    expanded: boolean;
    onExpand?: () => void;
    style?: ViewStyle;
    children?: ReactNode;
}

const Expandable: FC<ExpandableProps> = props => {
    const [expanded, setExpanded] = useState(true);
    const shouldExpand = props.expanded && expanded;
    const buttonText = shouldExpand ? undefined : "Change";
    const onPress = () => {
        setExpanded(true);
        props.onExpand?.();
    };

    return (
        <View style={props.style}>
            <Heading text={props.title} buttonText={buttonText} onPressButton={onPress} />
            <View style={{ display: shouldExpand ? "flex" : "none" }}>{props.children}</View>
        </View>
    );
};

export default Expandable;
