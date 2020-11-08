import React, { FC } from "react";
import { TouchableHighlight, View, ViewProps, ViewStyle } from "react-native";
import { Hoverable } from "react-native-web-hover";

import useColors from "../hooks/useColors";
import useStyles from "../hooks/useStyles";

export interface SelectableProps extends ViewProps {
    selected: boolean;
    onPress?: () => void;
    disabled?: boolean;
    containerStyle?: ViewStyle;
}

const Selectable: FC<SelectableProps> = props => {
    const { borderDark, accent, overlay } = useColors();
    const { border } = useStyles();
    const { background, backgroundLight } = useColors();
    return (
        <Hoverable style={props.containerStyle}>
            {({ hovered }) => (
                <TouchableHighlight activeOpacity={0.7} underlayColor={overlay} onPress={props.onPress}>
                    <View
                        {...props}
                        style={[
                            {
                                ...border({ color: props.selected ? accent : borderDark }),
                                backgroundColor: hovered && !props.disabled ? backgroundLight : background
                            },
                            props.style
                        ]}
                    />
                </TouchableHighlight>
            )}
        </Hoverable>
    );
};

export default Selectable;
