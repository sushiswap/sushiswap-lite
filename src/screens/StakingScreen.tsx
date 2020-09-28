import React, { useCallback, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Icon } from "react-native-elements";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import ApproveButton from "../components/ApproveButton";
import Button from "../components/Button";
import ButtonGroup from "../components/ButtonGroup";
import Column from "../components/Column";
import Container from "../components/Container";
import Content from "../components/Content";
import ErrorMessage from "../components/ErrorMessage";
import FetchingButton from "../components/FetchingButton";
import FlexView from "../components/FlexView";
import InsufficientBalanceButton from "../components/InsufficientBalanceButton";
import Meta from "../components/Meta";
import Notice from "../components/Notice";
import Subtitle from "../components/Subtitle";
import Text from "../components/Text";
import TokenInput from "../components/TokenInput";
import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import { SUSHI_BAR } from "../hooks/useSDK";
import useStakingState, { Action, StakingState } from "../hooks/useStakingState";
import MetamaskError from "../types/MetamaskError";
import { formatBalance, isEmptyValue, parseBalance } from "../utils";
import Screen from "./Screen";

const Actions = ["enter", "leave"];

const StakingScreen = () => {
    return (
        <Screen>
            <Container>
                <Content>
                    <Staking />
                </Content>
            </Container>
        </Screen>
    );
};

const Staking = () => {
    const state = useStakingState();
    return (
        <View style={{ alignItems: "center", marginBottom: Spacing.huge * 2 }}>
            <Column>
                <Text h4={true} style={{ textAlign: "center" }}>
                    💰 Staking
                </Text>
            </Column>
            <ActionSelect state={state} />
            {state.action === "enter" && state.sushi && state.sushi.balance.isZero() && <NoSushiNotice />}
            {state.action === "leave" && state.xSushi && state.xSushi.balance.isZero() && <NoXSushiNotice />}
            <TokenInput
                title={"2. How many SUSHI do you want to STAKE?"}
                token={state.sushi}
                hidden={state.action !== "enter" || !state.sushi || state.sushi.balance.isZero()}
                amount={state.amount}
                onAmountChanged={state.setAmount}
            />
            <TokenInput
                title={"2. How many xSUSHI do you want to UNSTAKE?"}
                token={state.xSushi}
                hidden={state.action !== "leave" || !state.xSushi || state.xSushi.balance.isZero()}
                amount={state.amount}
                onAmountChanged={state.setAmount}
            />
            <StakeInfo state={state} />
            <Controls state={state} />
        </View>
    );
};

const ActionSelect = ({ state }: { state: StakingState }) => {
    if (!state.sushi || !state.xSushi || !state.sushiStaked || !state.xSushiSupply) {
        return (
            <Column noTopMargin={true}>
                <ActivityIndicator size={"large"} style={{ marginTop: Spacing.large }} />
            </Column>
        );
    }
    const index = state.action ? Actions.indexOf(state.action) : null;
    const onPress = useCallback((i: number) => {
        state.setAction(Actions[i] as Action);
    }, []);
    return (
        <Column>
            <Subtitle text={"1. Do you want to STAKE or UNSTAKE?"} />
            <View style={{ marginHorizontal: Spacing.small, marginBottom: Spacing.normal }}>
                <Meta label={"Total SUSHI Staked"} text={formatBalance(state.sushiStaked, state.sushi.decimals)} />
                <Meta label={"My SUSHI Balance"} text={formatBalance(state.sushi.balance, state.sushi.decimals)} />
                <Line />
                <Meta label={"Total xSUSHI Supply"} text={formatBalance(state.xSushiSupply, state.xSushi.decimals)} />
                <Meta label={"My xSUSHI Balance"} text={formatBalance(state.xSushi.balance, state.xSushi.decimals)} />
            </View>
            <ButtonGroup
                selectedIndex={index}
                onPress={onPress}
                buttons={[{ element: StakeText }, { element: UnstakeText }]}
                containerStyle={{ marginHorizontal: Spacing.small }}
            />
        </Column>
    );
};

const Line = () => {
    const { border } = useColors();
    return (
        <View style={{ width: "100%", paddingHorizontal: Spacing.small }}>
            <View
                style={{
                    height: 1,
                    width: "100%",
                    marginTop: Spacing.small,
                    marginBottom: Spacing.tiny,
                    backgroundColor: border
                }}
            />
        </View>
    );
};

const StakeText = () => {
    return (
        <FlexView style={{ alignItems: "center" }}>
            <Text style={{ color: "black" }}>Stake SUSHI</Text>
            <Icon
                type={"material-community"}
                name={"chevron-right"}
                color={"black"}
                style={{ marginLeft: Spacing.tiny }}
            />
        </FlexView>
    );
};

const UnstakeText = () => {
    return (
        <FlexView style={{ alignItems: "center" }}>
            <Text style={{ color: "black" }}>Unstake xSUSHI</Text>
            <Icon
                type={"material-community"}
                name={"chevron-right"}
                color={"black"}
                style={{ marginLeft: Spacing.tiny }}
            />
        </FlexView>
    );
};

const NoSushiNotice = () => {
    return (
        <Column noTopMargin={true} style={{ padding: Spacing.small, marginTop: Spacing.small }}>
            <Notice text={"You don't have any SUSHI balance."} />
        </Column>
    );
};

const NoXSushiNotice = () => {
    return (
        <Column noTopMargin={true} style={{ padding: Spacing.small, marginTop: Spacing.small }}>
            <Notice text={"You don't have any xSUSHI staked."} />
        </Column>
    );
};

const StakeInfo = ({ state }: { state: StakingState }) => {
    if (!state.sushi || !state.xSushi || !state.sushiSupply || !state.xSushiSupply || isEmptyValue(state.amount)) {
        return <Column noTopMargin={true} />;
    }
    const amount = parseBalance(state.amount, state.sushi.decimals);
    const xSushiAmount = amount.mul(state.xSushiSupply).div(state.sushiSupply);
    const share = xSushiAmount.mul(ethers.BigNumber.from(10).pow(8)).div(state.xSushiSupply);
    return (
        <Column noTopMargin={true}>
            <Meta label={"xSUSHI Amount"} text={formatBalance(xSushiAmount, state.xSushi.decimals)} />
            <Meta label={"xSUSHI Share"} text={formatBalance(share, 8) + "%"} />
        </Column>
    );
};

const Controls = ({ state }: { state: StakingState }) => {
    const [error, setError] = useState<MetamaskError>({});
    useAsyncEffect(() => setError({}), [state.action, state.amount]);
    const token = state.action === "leave" ? state.xSushi : state.sushi;
    if (!state.action || !token || isEmptyValue(state.amount)) return <Column noTopMargin={true} />;
    return (
        <Column>
            {parseBalance(state.amount, token.decimals).gt(token.balance) ? (
                <InsufficientBalanceButton symbol={token.symbol} />
            ) : state.loading ? (
                <FetchingButton />
            ) : (
                <>
                    <ApproveButton
                        token={token}
                        spender={SUSHI_BAR}
                        onSuccess={() => state.setSushiAllowed(true)}
                        onError={setError}
                        hidden={state.action === "leave" || state.sushiAllowed}
                    />
                    {state.action === "leave" ? (
                        <UnstakeButton state={state} onError={setError} />
                    ) : (
                        <StakeButton state={state} onError={setError} disabled={!state.sushiAllowed} />
                    )}
                </>
            )}
            {error.message && error.code !== 4001 && <ErrorMessage error={error} />}
        </Column>
    );
};

const StakeButton = ({
    state,
    onError,
    disabled
}: {
    state: StakingState;
    onError: (e) => void;
    disabled: boolean;
}) => {
    const onPress = useCallback(async () => {
        onError({});
        try {
            await state.onEnter();
            state.setAction();
        } catch (e) {
            onError(e);
        }
    }, []);
    return <Button size={"large"} title={"Stake"} loading={state.entering} onPress={onPress} disabled={disabled} />;
};

const UnstakeButton = ({ state, onError }: { state: StakingState; onError: (e) => void }) => {
    const onPress = useCallback(async () => {
        onError({});
        try {
            await state.onLeave();
            state.setAction();
        } catch (e) {
            onError(e);
        }
    }, []);
    return <Button size={"large"} title={"Unstake"} loading={state.leaving} onPress={onPress} />;
};

export default StakingScreen;
