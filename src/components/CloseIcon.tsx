import React from "react";
import { Icon } from "react-native-elements";

import useColors from "../hooks/useColors";

const CloseIcon = () => {
    const { accent } = useColors();
    return <Icon type={"material-community"} name={"close"} color={accent} style={{ marginLeft: 4 }} />;
};

export default CloseIcon;
