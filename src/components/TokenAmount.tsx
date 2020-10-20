import React from "react";
import { TextStyle } from "react-native";

import { ethers } from "ethers";
import Token from "../types/Token";
import { formatBalance } from "../utils";
import Text from "./Text";

const TokenAmount = (props: { token: Token; amount?: ethers.BigNumber; disabled?: boolean; style?: TextStyle }) => (
    <Text caption={true} disabled={props.disabled} style={props.style}>
        {formatBalance(props.amount || props.token.balance, props.token.decimals, 8)}
    </Text>
);

export default TokenAmount;
