import React, { PropsWithChildren, useContext } from "react";
import { View, ViewProps } from "react-native";

import { Spacing } from "../constants/dimension";
import { GlobalContext } from "../context/GlobalContext";
import useColors from "../hooks/useColors";
import useStyles from "../hooks/useStyles";

const InfoBox = (props: PropsWithChildren<ViewProps>) => {
    const { darkMode } = useContext(GlobalContext);
    const { backgroundLight, borderDark } = useColors();
    const { border } = useStyles();
    return (
        <View
            {...props}
            style={[
                {
                    ...border({ color: darkMode ? borderDark : backgroundLight }),
                    backgroundColor: backgroundLight,
                    marginTop: Spacing.normal + Spacing.small,
                    padding: Spacing.small + Spacing.tiny
                },
                props.style
            ]}
        />
    );
};

export default InfoBox;
