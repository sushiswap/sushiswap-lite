import React, { useContext } from "react";
import { Icon } from "react-native-elements";

import { Spacing } from "../constants/dimension";
import { GlobalContext } from "../context/GlobalContext";
import useColors from "../hooks/useColors";

const SelectIcon = () => {
    const { darkMode } = useContext(GlobalContext);
    const { primary, secondary } = useColors();
    return (
        <Icon
            type={"material-community"}
            name={"chevron-right"}
            color={darkMode ? secondary : primary}
            style={{ marginLeft: Spacing.tiny }}
        />
    );
};

export default SelectIcon;
