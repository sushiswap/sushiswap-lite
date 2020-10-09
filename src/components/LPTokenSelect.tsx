import React, { FC, useCallback } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";

import { ethers } from "ethers";
import { Spacing } from "../constants/dimension";
import { LPTokensState } from "../hooks/useLPTokensState";
import LPToken from "../types/LPToken";
import Border from "./Border";
import CheckBox from "./CheckBox";
import Column from "./Column";
import FlexView from "./FlexView";
import Text from "./Text";

export type LPTokenSelectFilter = "balance" | "amountDeposited" | "";

export interface LPTokenSelectProps {
    state: LPTokensState;
    title: string;
    emptyText: string;
    showFilter?: boolean;
    filter?: LPTokenSelectFilter;
    onFilterChanged?: (filter: LPTokenSelectFilter) => void;
    Item: FC<LPTokenItemProps>;
}

export interface LPTokenItemProps {
    token: LPToken;
    selected: boolean;
    filter?: LPTokenSelectFilter;
    onSelectToken: (token: LPToken) => void;
}

const LPTokenSelect: FC<LPTokenSelectProps> = props => {
    const onUnselectToken = useCallback(() => {
        props.state.setSelectedLPToken(undefined);
    }, [props.state.setSelectedLPToken]);
    return (
        <Column>
            <Text
                fontWeight={"bold"}
                medium={true}
                style={{ marginBottom: props.showFilter ? Spacing.tiny : Spacing.normal, fontSize: 20 }}>
                {props.title}
            </Text>
            {props.showFilter && <Filter filter={props.filter} onFilterChanged={props.onFilterChanged} />}
            {props.state.selectedLPToken ? (
                <props.Item
                    token={props.state.selectedLPToken}
                    selected={true}
                    filter={""}
                    onSelectToken={onUnselectToken}
                />
            ) : (
                <LPTokenList state={props.state} filter={props.filter} emptyText={props.emptyText} Item={props.Item} />
            )}
        </Column>
    );
};

const Filter = ({ filter, onFilterChanged }) => {
    const handler = (f: string) => () => onFilterChanged(f);
    return (
        <FlexView style={{ width: "100%", justifyContent: "flex-end" }}>
            <CheckBox checked={filter === "balance"} onPress={handler("balance")} title={"with balance"} />
            <CheckBox
                checked={filter === "amountDeposited"}
                onPress={handler("amountDeposited")}
                title={"with deposit"}
            />
            <CheckBox checked={!filter} onPress={handler("")} title={"all"} />
        </FlexView>
    );
};

// tslint:disable-next-line:max-func-body-length
const LPTokenList = ({
    state,
    emptyText,
    filter,
    Item
}: {
    state: LPTokensState;
    emptyText: string;
    filter?: LPTokenSelectFilter;
    Item: FC<LPTokenItemProps>;
}) => {
    const renderItem = useCallback(
        ({ item }) => {
            return (
                <Item
                    key={item.address}
                    token={item}
                    selected={false}
                    filter={filter}
                    onSelectToken={state.setSelectedLPToken}
                />
            );
        },
        [filter, state.setSelectedLPToken]
    );
    let data = state.lpTokens.sort((t1, t2) => {
        return (t2.totalDeposited || ethers.constants.Zero)
            .sub(t1.totalDeposited || ethers.constants.Zero)
            .div(ethers.BigNumber.from(10).pow(14))
            .toNumber();
    });
    if (filter === "amountDeposited") {
        data = data.filter(token => token.amountDeposited?.gt(0));
    } else if (filter === "balance") {
        data = data.filter(token => token.balance.gt(0));
    }
    return state.loading ? (
        <ActivityIndicator size={"large"} style={{ marginTop: Spacing.large }} />
    ) : data.length === 0 ? (
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
