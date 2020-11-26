import React, { useState } from "react";
import { Platform, View } from "react-native";

import AmountMeta from "../components/AmountMeta";
import BackgroundImage from "../components/BackgroundImage";
import Border from "../components/Border";
import Button from "../components/Button";
import Container from "../components/Container";
import Content from "../components/Content";
import ErrorMessage from "../components/ErrorMessage";
import FetchingButton from "../components/FetchingButton";
import Heading from "../components/Heading";
import InfoBox from "../components/InfoBox";
import InsufficientBalanceButton from "../components/InsufficientBalanceButton";
import Notice from "../components/Notice";
import Text from "../components/Text";
import Title from "../components/Title";
import TokenInput from "../components/TokenInput";
import WebFooter from "../components/web/WebFooter";
import { StakingSubMenu } from "../components/web/WebSubMenu";
import { IS_DESKTOP, Spacing } from "../constants/dimension";
import useStakingState, { StakingState } from "../hooks/useStakingState";
import MetamaskError from "../types/MetamaskError";
import { formatBalance, isEmptyValue, parseBalance } from "../utils";
import Screen from "./Screen";

const UnstakeScreen = () => {
    return (
        <Screen>
            <Container>
                <BackgroundImage />
                <Content>
                    <Title text={"Unstake"} />
                    <Text light={true}>Convert your xSUSHI to SUSHI.</Text>
                    <Staking />
                </Content>
                {Platform.OS === "web" && <WebFooter />}
            </Container>
            <StakingSubMenu />
        </Screen>
    );
};

const Staking = () => {
    const state = useStakingState();
    return (
        <View style={{ marginTop: Spacing.large }}>
            <XSushiBalance state={state} />
            <Border />
            <AmountInput state={state} />
            {state.xSushi && state.xSushi.balance.isZero() && (
                <Notice text={"You don't have any xSUSHI."} color={"orange"} style={{ marginTop: Spacing.small }} />
            )}
            <UnstakeInfo state={state} />
        </View>
    );
};

const XSushiBalance = ({ state }: { state: StakingState }) => {
    return (
        <View>
            <Heading text={"Your xSUSHI"} />
            <AmountMeta
                amount={state.xSushi ? formatBalance(state.xSushi.balance, state.xSushi.decimals) : ""}
                suffix={"xSUSHI"}
                disabled={!state.xSushi}
            />
        </View>
    );
};

const AmountInput = ({ state }: { state: StakingState }) => {
    if (!state.xSushi || state.xSushi.balance.isZero()) {
        return <Heading text={"Amount To Unstake"} disabled={true} />;
    }
    return (
        <View>
            <Heading text={"Amount To Unstake"} />
            <TokenInput
                token={state.xSushi}
                amount={state.amount}
                onAmountChanged={state.setAmount}
                autoFocus={IS_DESKTOP}
            />
        </View>
    );
};

const UnstakeInfo = ({ state }: { state: StakingState }) => {
    const disabled =
        !state.sushi || !state.xSushi || !state.sushiStaked || !state.xSushiSupply || isEmptyValue(state.amount);
    const sushiAmount = disabled
        ? undefined
        : parseBalance(state.amount, state.xSushi!.decimals)
              .mul(state.sushiStaked!)
              .div(state.xSushiSupply!);
    return (
        <InfoBox>
            <Text disabled={disabled} style={{ fontSize: IS_DESKTOP ? 28 : 20 }}>
                {!sushiAmount ? "N/A" : formatBalance(sushiAmount, state.sushi!.decimals, 8) + " SUSHI"}
            </Text>
            <Controls state={state} />
        </InfoBox>
    );
};

const Controls = ({ state }: { state: StakingState }) => {
    const [error, setError] = useState<MetamaskError>({});
    return (
        <View style={{ marginTop: Spacing.normal }}>
            {!state.xSushi || state.xSushi.balance.isZero() || isEmptyValue(state.amount) ? (
                <UnstakeButton state={state} onError={setError} disabled={true} />
            ) : parseBalance(state.amount, state.xSushi.decimals).gt(state.xSushi.balance) ? (
                <InsufficientBalanceButton symbol={state.xSushi.symbol} />
            ) : state.loading ? (
                <FetchingButton />
            ) : (
                <UnstakeButton state={state} onError={setError} disabled={false} />
            )}
            {error.message && error.code !== 4001 && <ErrorMessage error={error} />}
        </View>
    );
};

const UnstakeButton = ({
    state,
    onError,
    disabled
}: {
    state: StakingState;
    onError: (e) => void;
    disabled: boolean;
}) => {
    const onPress = async () => {
        onError({});
        try {
            await state.onLeave();
            state.setAmount("");
        } catch (e) {
            onError(e);
        }
    };
    return <Button title={"Unstake"} loading={state.leaving} onPress={onPress} disabled={disabled} />;
};

export default UnstakeScreen;
