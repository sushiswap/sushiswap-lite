import React, { FC, useCallback, useContext } from "react";
import { Platform, View } from "react-native";

import { ethers } from "ethers";
import { Spacing } from "../constants/dimension";
import { EthersContext } from "../context/EthersContext";
import useColors from "../hooks/useColors";
import useStyles from "../hooks/useStyles";
import Token from "../types/Token";
import { findOrFetchToken } from "../utils/fetch-utils";
import Button from "./Button";
import FlexView from "./FlexView";
import Input from "./Input";

export interface TokenSearchProps {
    tokens?: Token[];
    text: string;
    onChangeText: (text: string) => void;
    onAddToken?: (token: Token) => void;
}

// tslint:disable-next-line:max-func-body-length
const TokenSearch: FC<TokenSearchProps> = props => {
    const { border } = useStyles();
    if (!props.tokens) {
        return <View />;
    }
    // const isAddress = ethers.utils.isAddress(props.text.trim());
    return (
        <FlexView style={{ marginBottom: Spacing.small }}>
            <Input
                value={props.text}
                onChangeText={props.onChangeText}
                placeholder={"Search for a token… (name or symbol)"}
                autoFocus={true}
                inputStyle={{ marginHorizontal: Spacing.tiny, fontSize: props.text ? 20 : 16 }}
                inputContainerStyle={{ borderBottomWidth: 0, marginRight: 40 }}
                labelStyle={{ height: 0 }}
                containerStyle={{
                    ...border(),
                    paddingHorizontal: Spacing.tiny,
                    paddingTop: 12,
                    paddingBottom: 0
                }}
            />
            {/*{isAddress && <AddButton address={props.text} onAddToken={props.onAddToken} />}*/}
        </FlexView>
    );
};

const AddButton = (props: { address: string; onAddToken? }) => {
    const { provider, signer, getTokenBalance } = useContext(EthersContext);
    const { accent } = useColors();
    const onPress = useCallback(async () => {
        const address = props.address.trim();
        if (provider && signer && ethers.utils.isAddress(address)) {
            const token = await findOrFetchToken(provider, address);
            const balance = await getTokenBalance(address, await signer.getAddress());
            props.onAddToken?.({
                ...token,
                balance
            } as Token);
        }
    }, [provider, signer, props.address]);
    return (
        <View style={{ position: "absolute", right: 12, bottom: Platform.OS === "web" ? 10 : 20 }}>
            <Button
                type={"clear"}
                size={"small"}
                color={accent}
                title={"Add"}
                fontWeight={"bold"}
                onPress={onPress}
                buttonStyle={{ paddingHorizontal: 4 }}
            />
        </View>
    );
};

export default TokenSearch;
