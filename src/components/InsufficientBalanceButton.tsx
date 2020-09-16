import React from "react";

import { TokenPairState } from "../hooks/useTokenPairState";
import Button from "./Button";

const InsufficientBalanceButton = ({ state }: { state: TokenPairState }) => {
    return <Button size={"large"} title={"Insufficient " + state.fromSymbol + " Balance"} disabled={true} />;
};
export default InsufficientBalanceButton;
