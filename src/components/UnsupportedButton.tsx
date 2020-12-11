import React from "react";

import { TokenPairState } from "../hooks/useTokenPairState";
import useTranslation from "../hooks/useTranslation";
import Button from "./Button";

const UnsupportedButton = ({ state }: { state: TokenPairState }) => {
    const t = useTranslation();
    return <Button title={state.fromSymbol + "-" + state.toSymbol + " " + t("not-supported")} disabled={true} />;
};

export default UnsupportedButton;
