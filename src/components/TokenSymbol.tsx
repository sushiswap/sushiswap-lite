import React from "react";

import { Spacing } from "../constants/dimension";
import Token from "../types/Token";
import Text from "./Text";

const TokenSymbol = (props: { token: Token; disabled?: boolean }) => (
    <Text medium={true} caption={true} disabled={props.disabled} style={{ marginLeft: Spacing.tiny }}>
        {props.token.symbol}
    </Text>
);

export default TokenSymbol;
