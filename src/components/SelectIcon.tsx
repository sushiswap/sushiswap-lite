import React from "react";
import { Icon } from "react-native-elements";

import useColors from "../hooks/useColors";

const SelectIcon = () => {
    const { accent } = useColors();
    return <Icon type={"material-community"} name={"chevron-right"} color={accent} style={{ marginLeft: 4 }} />;
};

export default SelectIcon;
