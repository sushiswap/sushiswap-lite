import React, { FC } from "react";

import { Spacing } from "../constants/dimension";
import Text from "./Text";

interface TitleProps {
    text: string;
}

const Title: FC<TitleProps> = props => {
    return (
        <Text fontWeight={"bold"} style={{ marginBottom: Spacing.tiny, fontSize: 40 }}>
            {props.text}
        </Text>
    );
};

export default Title;
