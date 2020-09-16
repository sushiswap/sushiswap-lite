import React from "react";

import { TokenPairState } from "../hooks/useTokenPairState";
import Button from "./Button";

const UnsupportedButton = ({ state }: { state: TokenPairState }) => {
    return <Button size={"large"} title={state.fromSymbol + "-" + state.toSymbol + " Not Supported"} disabled={true} />;
};

export default UnsupportedButton;
