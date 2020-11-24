import React, { useContext } from "react";
import { View, ViewProps } from "react-native";

import { DESKTOP_CONTENT_WIDTH, IS_DESKTOP, Spacing, SUB_MENU_HEIGHT } from "../constants/dimension";
import { GlobalContext } from "../context/GlobalContext";
import useColors from "../hooks/useColors";
import useStyles from "../hooks/useStyles";

const Content: React.FunctionComponent<ViewProps> = props => {
    const { darkMode } = useContext(GlobalContext);
    const { borderDark: borderColor, background } = useColors();
    const { border, shadow } = useStyles();
    return (
        <View
            {...props}
            style={[
                {
                    ...border({ color: darkMode ? borderColor : undefined }),
                    ...shadow(),
                    backgroundColor: background,
                    width: IS_DESKTOP ? DESKTOP_CONTENT_WIDTH : "100%",
                    marginLeft: "auto",
                    marginRight: "auto",
                    marginTop: Spacing.huge + SUB_MENU_HEIGHT,
                    marginBottom: Spacing.large,
                    padding: Spacing.small + Spacing.tiny
                },
                props.style
            ]}
        />
    );
};
export default Content;
