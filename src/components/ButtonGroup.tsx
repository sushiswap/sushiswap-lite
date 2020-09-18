import React, { FC } from "react";
import { ButtonGroup as NativeButtonGroup, ButtonGroupProps } from "react-native-elements";

import useColors from "../hooks/useColors";
import useStyles from "../hooks/useStyles";

// tslint:disable-next-line:max-func-body-length
const ButtonGroup: FC<ButtonGroupProps> = props => {
    const { borderDark } = useColors();
    const { shadow } = useStyles();
    return (
        <NativeButtonGroup
            {...props}
            selectedButtonStyle={[
                {
                    backgroundColor: borderDark
                },
                props.selectedButtonStyle
            ]}
            containerStyle={[
                {
                    marginHorizontal: 0,
                    marginVertical: 0,
                    height: 56,
                    ...shadow
                },
                props.containerStyle
            ]}
        />
    );
};

export default ButtonGroup;
