import React, { FC, useCallback, useContext, useState } from "react";
import { View } from "react-native";

import { Spacing } from "../constants/dimension";
import { EthersContext } from "../context/EthersContext";
import { ROUTER } from "../hooks/useSDK";
import Token from "../types/Token";
import Button from "./Button";

export interface ApproveButtonProps {
    token: Token;
    onSuccess: () => void;
    onError: (e) => void;
    hidden?: boolean;
}

const ApproveButton: FC<ApproveButtonProps> = props => {
    const { approveToken } = useContext(EthersContext);
    const [loading, setLoading] = useState(false);
    const onPress = useCallback(async () => {
        if (props.token) {
            props.onError({});
            setLoading(true);
            try {
                const tx = await approveToken(props.token.address, ROUTER);
                await tx.wait();
                props.onSuccess();
            } catch (e) {
                props.onError(e);
            } finally {
                setLoading(false);
            }
        }
    }, [props.token]);
    if (props.hidden) {
        return <View />;
    }
    return (
        <Button
            size={"large"}
            title={"Approve " + (props.token?.symbol || "")}
            onPress={onPress}
            loading={loading}
            style={{ marginBottom: Spacing.small }}
        />
    );
};

export default ApproveButton;
