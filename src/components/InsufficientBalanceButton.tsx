import React from "react";

import Button from "./Button";

const InsufficientBalanceButton = ({ symbol }: { symbol: string }) => {
    return <Button title={"Insufficient " + (symbol ? symbol : "Balance")} disabled={true} />;
};
export default InsufficientBalanceButton;
