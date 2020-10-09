import React, { FC, useCallback, useContext } from "react";
import { Platform, View } from "react-native";

import { ethers } from "ethers";
import { Spacing } from "../constants/dimension";
import { GlobalContext } from "../context/GlobalContext";
import useColors from "../hooks/useColors";
import Token from "../types/Token";
import { formatBalance, parseBalance } from "../utils";
import Button from "./Button";
import Column from "./Column";
import Input from "./Input";
import Subtitle from "./Subtitle";

export interface TokenInputProps {
    title?: string;
    token?: Token;
    hidden: boolean;
    amount: string;
    onAmountChanged: (amount: string) => void;
    label?: string;
    maxButtonText?: string;
}

// tslint:disable-next-line:max-func-body-length
const TokenInput: FC<TokenInputProps> = props => {
    const onChangeText = useCallback(
        (text: string) => {
            if (props.token && props.onAmountChanged) {
                try {
                    parseBalance(text, props.token.decimals);
                    props.onAmountChanged(text);
                } catch (e) {
                    if (text.endsWith(".") && text.indexOf(".") === text.length - 1) {
                        props.onAmountChanged(text);
                    }
                }
            }
        },
        [props.token, props.onAmountChanged]
    );
    if (props.hidden) {
        return <Column noTopMargin={true} />;
    }
    const label = props.label || props.token?.symbol;
    return (
        <Column noTopMargin={!props.title}>
            {props.title && <Subtitle text={props.title} />}
            <View style={{ marginHorizontal: Spacing.small }}>
                <Input label={label} value={props.amount} onChangeText={onChangeText} placeholder={"0.0"} />
                {props.token?.balance?.gt(0) && (
                    <MaxButton
                        token={props.token}
                        maxButtonText={props.maxButtonText}
                        updateAmount={props.onAmountChanged}
                    />
                )}
            </View>
        </Column>
    );
};

const MaxButton = (props: { token: Token; updateAmount; maxButtonText?: string }) => {
    const { darkMode } = useContext(GlobalContext);
    const { primary, secondary } = useColors();
    const onPressMax = useCallback(() => {
        if (props.token) {
            let balance = props.token.balance;
            if (props.token.symbol === "ETH") {
                // Subtract 0.01 ETH for gas fee
                const fee = ethers.BigNumber.from(10).pow(16);
                balance = balance.gt(fee) ? balance.sub(fee) : ethers.constants.Zero;
            }
            props.updateAmount(formatBalance(balance, props.token.decimals));
        }
    }, [props.token, props.updateAmount]);
    return (
        <View style={{ position: "absolute", right: 0, bottom: Platform.OS === "web" ? 12 : 28 }}>
            <Button
                type={"clear"}
                color={darkMode ? secondary : primary}
                title={props.maxButtonText || "MAX"}
                fontWeight={"bold"}
                onPress={onPressMax}
                buttonStyle={{ paddingHorizontal: 0 }}
            />
        </View>
    );
};

export default TokenInput;
