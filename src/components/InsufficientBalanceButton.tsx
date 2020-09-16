import React from "react";

import Button from "./Button";

const InsufficientBalanceButton = ({ symbol }: { symbol: string }) => {
    return <Button size={"large"} title={"Insufficient " + symbol + " Balance"} disabled={true} />;
};
export default InsufficientBalanceButton;
