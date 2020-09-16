import React, { FC } from "react";

import { Spacing } from "../constants/dimension";
import Text from "./Text";

interface SubtitleProps {
    text: string;
}

const Subtitle: FC<SubtitleProps> = props => {
    return (
        <Text fontWeight={"bold"} medium={true} style={{ marginBottom: Spacing.normal, fontSize: 20 }}>
            {props.text}
        </Text>
    );
};

export default Subtitle;
