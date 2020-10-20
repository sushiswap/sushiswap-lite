import React from "react";
import { CheckBox as NativeCheckBox, CheckBoxProps } from "react-native-elements";

import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";

// tslint:disable-next-line:max-func-body-length
const CheckBox = (props: CheckBoxProps) => {
    const { accent, textLight } = useColors();
    const iconRight = props.iconRight === undefined ? true : props.iconRight;
    return (
        <NativeCheckBox
            {...props}
            textStyle={[
                {
                    fontFamily: "regular",
                    fontSize: 14,
                    color: textLight,
                    marginLeft: iconRight ? 0 : 4,
                    marginRight: iconRight ? 4 : 0
                },
                props.textStyle
            ]}
            containerStyle={[
                {
                    backgroundColor: "transparent",
                    borderWidth: 0,
                    marginLeft: iconRight ? Spacing.tiny : 0,
                    marginRight: iconRight ? 0 : Spacing.tiny,
                    marginVertical: Spacing.small,
                    padding: 0
                },
                props.containerStyle
            ]}
            iconRight={iconRight}
            iconType={"material-community"}
            checkedIcon={"radiobox-marked"}
            uncheckedIcon={"radiobox-blank"}
            checkedColor={accent}
        />
    );
};

export default CheckBox;
