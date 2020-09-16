import React, { useCallback, useContext, useState } from "react";

import { EthersContext } from "../context/EthersContext";
import { ROUTER } from "../hooks/useSDK";
import Token from "../types/Token";
import Button from "./Button";

const ApproveButton = ({
    token,
    onSuccess,
    onError
}: {
    token: Token;
    onSuccess: () => void;
    onError: (e) => void;
}) => {
    const { approveToken } = useContext(EthersContext);
    const [loading, setLoading] = useState(false);
    const onPress = useCallback(async () => {
        if (token) {
            onError({});
            setLoading(true);
            try {
                const tx = await approveToken(token.address, ROUTER);
                await tx.wait();
                onSuccess();
            } catch (e) {
                onError(e);
            } finally {
                setLoading(false);
            }
        }
    }, [token]);
    return <Button size={"large"} title={"Approve " + token?.symbol} onPress={onPress} loading={loading} />;
};

export default ApproveButton;
