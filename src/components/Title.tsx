import React, { FC } from "react";

import { IS_DESKTOP, Spacing } from "../constants/dimension";
import Text from "./Text";

interface TitleProps {
    text: string;
}

const Title: FC<TitleProps> = props => {
    return (
        <Text fontWeight={"bold"} style={{ marginBottom: Spacing.tiny, fontSize: IS_DESKTOP ? 40 : 28 }}>
            {props.text}
        </Text>
    );
};

export default Title;
