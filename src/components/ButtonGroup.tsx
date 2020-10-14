import React, { FC, useCallback, useState } from "react";
import { ButtonGroup as NativeButtonGroup, ButtonGroupProps } from "react-native-elements";

import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import useStyles from "../hooks/useStyles";

// tslint:disable-next-line:max-func-body-length
const ButtonGroup: FC<ButtonGroupProps> = props => {
    const { borderDark } = useColors();
    const { shadow } = useStyles();
    const [index, setIndex] = useState<number>();
    const onPress = useCallback(i => {
        setIndex(i);
        props.onPress(i);
    }, []);
    return (
        <NativeButtonGroup
            {...props}
            selectedIndex={props.selectedIndex || index}
            onPress={onPress}
            textStyle={[
                {
                    fontFamily: "regular"
                },
                props.textStyle
            ]}
            buttonStyle={[
                {
                    borderTopLeftRadius: index === 0 ? Spacing.tiny : 0,
                    borderBottomLeftRadius: index === 0 ? Spacing.tiny : 0,
                    borderTopRightRadius:
                        props.buttons.length > 0 && index === props.buttons.length - 1 ? Spacing.tiny : 0,
                    borderBottomRightRadius:
                        props.buttons.length > 0 && index === props.buttons.length - 1 ? Spacing.tiny : 0
                },
                props.buttonStyle
            ]}
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
                    ...shadow()
                },
                props.containerStyle
            ]}
        />
    );
};

export default ButtonGroup;
