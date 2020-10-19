import React, { PropsWithChildren } from "react";
import { View, ViewProps } from "react-native";

import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import useStyles from "../hooks/useStyles";

const InfoBox = (props: PropsWithChildren<ViewProps>) => {
    const { backgroundLight } = useColors();
    const { border } = useStyles();
    return (
        <View
            {...props}
            style={[
                {
                    ...border({ color: backgroundLight }),
                    backgroundColor: backgroundLight,
                    marginTop: Spacing.large,
                    padding: Spacing.small + Spacing.tiny
                },
                props.style
            ]}
        />
    );
};

export default InfoBox;
