import React from "react";
import { View, ViewProps } from "react-native";

import { Spacing, WEB_WIDTH } from "../constants/dimension";

const Content: React.FunctionComponent<ViewProps> = props => {
    return (
        <View
            {...props}
            style={[
                {
                    width: WEB_WIDTH,
                    marginLeft: "auto",
                    marginRight: "auto",
                    paddingHorizontal: Spacing.normal,
                    paddingVertical: Spacing.huge
                },
                props.style
            ]}
        />
    );
};
export default Content;
