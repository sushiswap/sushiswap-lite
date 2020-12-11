import React, { FC, useCallback, useContext, useState } from "react";
import { View } from "react-native";

import { Spacing } from "../constants/dimension";
import { EthersContext } from "../context/EthersContext";
import useTranslation from "../hooks/useTranslation";
import Token from "../types/Token";
import Button from "./Button";

export interface ApproveButtonProps {
    token: Token;
    spender: string;
    onSuccess: () => void;
    onError: (e) => void;
    hidden?: boolean;
}

const ApproveButton: FC<ApproveButtonProps> = props => {
    const t = useTranslation();
    const { approveToken } = useContext(EthersContext);
    const [loading, setLoading] = useState(false);
    const onPress = useCallback(async () => {
        if (props.token) {
            props.onError({});
            setLoading(true);
            try {
                const tx = await approveToken(props.token.address, props.spender);
                if (tx) {
                    await tx.wait();
                    props.onSuccess();
                }
            } catch (e) {
                props.onError(e);
            } finally {
                setLoading(false);
            }
        }
    }, [props.token]);
    if (props.hidden) return <View />;
    return (
        <Button
            title={t("approve") + " " + (props.token?.symbol || "")}
            onPress={onPress}
            loading={loading}
            containerStyle={{ marginBottom: Spacing.tiny }}
        />
    );
};

export default ApproveButton;
