import React, { FC, useCallback } from "react";
import { Platform, View } from "react-native";

import { ethers } from "ethers";
import { IS_DESKTOP, Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import useStyles from "../hooks/useStyles";
import Token from "../types/Token";
import { formatBalance, isETH, parseBalance, pow10 } from "../utils";
import Button from "./Button";
import Heading from "./Heading";
import Input from "./Input";

export interface TokenInputProps {
    title?: string;
    token?: Token;
    amount: string;
    onAmountChanged: (amount: string) => void;
    label?: string;
    hideMaxButton?: boolean;
    maxButtonText?: string;
    autoFocus?: boolean;
}

// tslint:disable-next-line:max-func-body-length
const TokenInput: FC<TokenInputProps> = props => {
    const { border } = useStyles();
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
    return (
        <View>
            {props.title && <Heading text={props.title} />}
            <View>
                <Input
                    label={props.label}
                    value={props.amount}
                    onChangeText={onChangeText}
                    placeholder={"0.0"}
                    keyboardType={"numeric"}
                    autoFocus={props.autoFocus || false}
                    inputStyle={{ marginHorizontal: Spacing.tiny }}
                    inputContainerStyle={{ borderBottomWidth: 0 }}
                    labelStyle={{ fontFamily: "light", height: props.label ? "auto" : 0 }}
                    containerStyle={{
                        ...border(),
                        paddingHorizontal: Spacing.tiny,
                        paddingTop: 15,
                        paddingBottom: 2
                    }}
                />
                {props.token?.balance?.gt(0) && !props.hideMaxButton && (
                    <MaxButton
                        token={props.token}
                        maxButtonText={props.maxButtonText}
                        updateAmount={props.onAmountChanged}
                    />
                )}
            </View>
        </View>
    );
};

const MaxButton = (props: { token: Token; updateAmount; maxButtonText?: string }) => {
    const { accent } = useColors();
    const onPressMax = useCallback(() => {
        if (props.token) {
            let balance = props.token.balance;
            if (isETH(props.token)) {
                // Subtract 0.01 ETH for gas fee
                const fee = pow10(16);
                balance = balance.gt(fee) ? balance.sub(fee) : ethers.constants.Zero;
            }
            props.updateAmount(formatBalance(balance, props.token.decimals));
        }
    }, [props.token, props.updateAmount]);
    return (
        <View style={{ position: "absolute", right: 12, bottom: Platform.OS === "web" ? 12 : 24 }}>
            <Button
                type={"clear"}
                size={"small"}
                color={accent}
                title={props.maxButtonText || (IS_DESKTOP ? "MAX " + props.token.symbol : "MAX")}
                fontWeight={"bold"}
                onPress={onPressMax}
                buttonStyle={{ paddingHorizontal: Spacing.tiny }}
            />
        </View>
    );
};

export default TokenInput;
