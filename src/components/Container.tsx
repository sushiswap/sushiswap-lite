import React, { FC } from "react";
import { ScrollView, ViewProps } from "react-native";

import { HEADER_HEIGHT } from "../constants/dimension";
import useColors from "../hooks/useColors";

export interface ContainerProps extends ViewProps {
    scrollToBottomLength?: number;
    showScrollToBottomButton?: boolean;
}

const Container: FC<ContainerProps> = props => {
    const { background } = useColors();
    return (
        <ScrollView
            nestedScrollEnabled={true}
            contentContainerStyle={{ flex: 1 }}
            style={[{ backgroundColor: background, marginTop: HEADER_HEIGHT }, props.style]}
            {...props}
        />
    );
};

export default Container;
