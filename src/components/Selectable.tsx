import React, { FC } from "react";
import { TouchableHighlight, View, ViewProps } from "react-native";
import { Hoverable } from "react-native-web-hover";

import useColors from "../hooks/useColors";
import useStyles from "../hooks/useStyles";

export interface SelectableProps extends ViewProps {
    selected: boolean;
    onPress?: () => void;
    disabled?: boolean;
}

const Selectable: FC<SelectableProps> = props => {
    const { borderDark, accent } = useColors();
    const { border } = useStyles();
    const { background, backgroundLight } = useColors();
    return (
        <Hoverable>
            {({ hovered }) => (
                <TouchableHighlight onPress={props.onPress}>
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
