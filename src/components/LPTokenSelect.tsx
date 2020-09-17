import React, { FC, useCallback } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";

import { ethers } from "ethers";
import { Spacing } from "../constants/dimension";
import { LPTokensState } from "../hooks/useLPTokensState";
import LPToken from "../types/LPToken";
import Border from "./Border";
import Column from "./Column";
import Subtitle from "./Subtitle";
import Text from "./Text";

export interface LPTokenSelectProps {
    state: LPTokensState;
    title: string;
    emptyText: string;
    Item: FC<LPTokenItemProps>;
}

export interface LPTokenItemProps {
    token: LPToken;
    selected: boolean;
    onSelectToken: (token: LPToken) => void;
}

const LPTokenSelect: FC<LPTokenSelectProps> = props => {
    const onUnselectToken = useCallback(() => {
        props.state.setSelectedLPToken(undefined);
    }, [props.state.setSelectedLPToken]);
    return (
        <Column>
            <Subtitle text={props.title} />
            {props.state.selectedLPToken ? (
                <props.Item token={props.state.selectedLPToken} selected={true} onSelectToken={onUnselectToken} />
            ) : (
                <LPTokenList state={props.state} emptyText={props.emptyText} Item={props.Item} />
            )}
        </Column>
    );
};

const LPTokenList = ({
    state,
    emptyText,
    Item
}: {
    state: LPTokensState;
    emptyText: string;
    Item: FC<LPTokenItemProps>;
}) => {
    const renderItem = useCallback(({ item }) => {
        return <Item key={item.address} token={item} selected={false} onSelectToken={state.setSelectedLPToken} />;
    }, []);
    const data = state.lpTokens.sort((t1, t2) => {
        return (t2.totalDeposited || ethers.constants.Zero)
            .sub(t1.totalDeposited || ethers.constants.Zero)
            .div(ethers.BigNumber.from(10).pow(14))
            .toNumber();
    });
    return state.loading ? (
        <ActivityIndicator size={"large"} style={{ marginTop: Spacing.large }} />
    ) : state.lpTokens.length === 0 ? (
        <EmptyList text={emptyText} />
    ) : (
        <FlatList
            keyExtractor={item => JSON.stringify(item)}
            data={data}
            renderItem={renderItem}
            ItemSeparatorComponent={Border}
        />
    );
};

const EmptyList = ({ text }: { text: string }) => {
    return (
        <View style={{ margin: Spacing.normal }}>
            <Text light={true} style={{ textAlign: "center", width: "100%" }}>
                {text}
            </Text>
        </View>
    );
};

export default LPTokenSelect;
