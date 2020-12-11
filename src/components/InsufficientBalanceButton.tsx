import React from "react";

import useTranslation from "../hooks/useTranslation";
import Button from "./Button";

const InsufficientBalanceButton = ({ symbol }: { symbol: string }) => {
    const t = useTranslation();
    return <Button title={symbol ? t("insufficient-", { symbol }) : t("insufficient-balance")} disabled={true} />;
};
export default InsufficientBalanceButton;
