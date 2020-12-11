import React, { FC, useCallback, useContext, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { ethers } from "ethers";
import { IS_DESKTOP, Spacing } from "../constants/dimension";
import { EthersContext } from "../context/EthersContext";
import useColors from "../hooks/useColors";
import useDelayedEffect from "../hooks/useDelayedEffect";
import useStyles from "../hooks/useStyles";
import useTranslation from "../hooks/useTranslation";
import Token from "../types/Token";
import { findOrFetchToken } from "../utils/fetch-utils";
import Button from "./Button";
import FlexView from "./FlexView";
import Input from "./Input";
import { ITEM_SEPARATOR_HEIGHT } from "./ItemSeparator";
import Selectable from "./Selectable";
import TokenLogo from "./TokenLogo";
import TokenName from "./TokenName";

export interface TokenSearchProps {
    tokens?: Token[];
    text: string;
    onChangeText: (text: string) => void;
    onAddToken?: (token: Token) => void;
}

// tslint:disable-next-line:max-func-body-length
const TokenSearch: FC<TokenSearchProps> = props => {
    const t = useTranslation();
    const { border } = useStyles();
    const { provider, tokens } = useContext(EthersContext);
    const [tokenToAdd, setTokenToAdd] = useState<Token>();
    const [loading, setLoading] = useState(false);
    const duplicate = !!tokenToAdd && tokens.findIndex(tk => tk.address === tokenToAdd.address) !== -1;
    if (!props.tokens) return <View />;
    useEffect(() => {
        if (props.text === "") {
            setLoading(false);
            setTokenToAdd(undefined);
        }
    }, [props.text]);
    useDelayedEffect(
        async () => {
            const address = props.text.trim();
            if (provider && ethers.utils.isAddress(address)) {
                setLoading(true);
                try {
                    const token = await findOrFetchToken(address, provider);
                    if (token.name && token.symbol && token.decimals) {
                        setTokenToAdd(token as Token);
                    }
                } finally {
                    setLoading(false);
                }
            }
        },
        300,
        [provider, props.text]
    );
    return (
        <View>
            <FlexView style={{ marginBottom: Spacing.small }}>
                <Input
                    value={props.text}
                    onChangeText={props.onChangeText}
                    placeholder={t("token-name-symbol-or-address")}
                    autoFocus={IS_DESKTOP}
                    inputStyle={{ marginHorizontal: Spacing.tiny, fontSize: props.text ? 20 : 16 }}
                    inputContainerStyle={{ borderBottomWidth: 0, marginRight: loading ? 32 : 0 }}
                    labelStyle={{ height: 0 }}
                    containerStyle={{
                        ...border(),
                        paddingHorizontal: Spacing.tiny,
                        paddingTop: 12,
                        paddingBottom: 0
                    }}
                />
                {props.onAddToken && loading && <Loading />}
            </FlexView>
            {props.onAddToken && tokenToAdd && (
                <TokenItem token={tokenToAdd} selected={true} onSelectToken={props.onAddToken} duplicate={duplicate} />
            )}
        </View>
    );
};

const Loading = () => <ActivityIndicator size={"small"} style={{ position: "absolute", right: 16, bottom: 16 }} />;

const TokenItem = (props: {
    token: Token;
    selected: boolean;
    onSelectToken: (token: Token) => void;
    duplicate: boolean;
}) => {
    const t = useTranslation();
    const { accent } = useColors();
    const onPress = useCallback(() => {
        props.onSelectToken(props.token);
    }, [props.onSelectToken, props.token]);
    return (
        <Selectable
            selected={false}
            disabled={true}
            onPress={onPress}
            containerStyle={{
                marginBottom: ITEM_SEPARATOR_HEIGHT
            }}>
            <FlexView style={{ alignItems: "center" }}>
                <TokenLogo token={props.token} />
                <TokenName token={props.token} />
                <View style={{ flex: 1 }} />
                <Button
                    type={"clear"}
                    size={"small"}
                    color={accent}
                    title={props.duplicate ? t("already-added") : t("-add-") + " " + props.token.symbol}
                    fontWeight={"bold"}
                    onPress={onPress}
                    disabled={props.duplicate}
                    buttonStyle={{ paddingHorizontal: 4, height: 27 }}
                />
            </FlexView>
        </Selectable>
    );
};

export default TokenSearch;
