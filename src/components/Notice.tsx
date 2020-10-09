import React from "react";

import useStyles from "../hooks/useStyles";
import Text from "./Text";

const Notice = (props: { text: string; color?: string }) => {
    const { border } = useStyles();
    const borderStyle = border(props.color);
    return (
        <Text
            note={true}
            style={{
                color: props.color || borderStyle.borderColor,
                ...borderStyle
            }}>
            {props.text}
        </Text>
    );
};

export default Notice;
