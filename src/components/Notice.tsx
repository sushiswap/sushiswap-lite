import React, { useContext } from "react";

import { Spacing } from "../constants/dimension";
import { GlobalContext } from "../context/GlobalContext";
import useColors from "../hooks/useColors";
import Text from "./Text";

const Notice = (props: { text: string; color?: string }) => {
    const { darkMode } = useContext(GlobalContext);
    const { primary, secondary } = useColors();
    const color = props.color || (darkMode ? secondary : primary);
    return (
        <Text
            note={true}
            style={{
                color,
                borderColor: color,
                borderWidth: 1,
                borderRadius: 4,
                padding: Spacing.small
            }}>
            {props.text}
        </Text>
    );
};

export default Notice;
