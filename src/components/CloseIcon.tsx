import React from "react";
import { Icon } from "react-native-elements";

import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";

const CloseIcon = () => {
    const { textLight } = useColors();
    return <Icon type={"material-community"} name={"close"} color={textLight} style={{ marginLeft: Spacing.small }} />;
};

export default CloseIcon;
