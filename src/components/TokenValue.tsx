import React, { FC } from "react";
import { TextStyle } from "react-native";

import TokenWithValue from "../types/TokenWithValue";
import { formatUSD } from "../utils";
import Text from "./Text";

export interface TokenValueProps {
    token: TokenWithValue;
    disabled?: boolean;
    style?: TextStyle;
}

const TokenValue: FC<TokenValueProps> = props => {
    return (
        <Text note={true} fontWeight={"light"} disabled={props.disabled} style={props.style}>
            {formatUSD(props.token.valueUSD || 0, 4)}
        </Text>
    );
};

export default TokenValue;
