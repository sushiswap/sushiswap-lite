import React, { useState } from "react";
import { Platform, View } from "react-native";

import ApproveButton from "../components/ApproveButton";
import BackgroundImage from "../components/BackgroundImage";
import Button from "../components/Button";
import Container from "../components/Container";
import Content from "../components/Content";
import ErrorMessage from "../components/ErrorMessage";
import FetchingButton from "../components/FetchingButton";
import Heading from "../components/Heading";
import InfoBox from "../components/InfoBox";
import InsufficientBalanceButton from "../components/InsufficientBalanceButton";
import Meta from "../components/Meta";
import Notice from "../components/Notice";
import Text from "../components/Text";
import Title from "../components/Title";
import TokenInput from "../components/TokenInput";
import WebFooter from "../components/web/WebFooter";
import { StakingSubMenu } from "../components/web/WebSubMenu";
import { SUSHI_BAR } from "../constants/contracts";
import { IS_DESKTOP, Spacing } from "../constants/dimension";
import Fraction from "../constants/Fraction";
import useStakingState, { StakingState } from "../hooks/useStakingState";
import MetamaskError from "../types/MetamaskError";
import { formatBalance, isEmptyValue, parseBalance } from "../utils";
import Screen from "./Screen";

const StakeScreen = () => {
    return (
        <Screen>
            <Container>
                <BackgroundImage />
                <Content>
                    <Title text={"Stake"} />
                    <Text light={true}>Earn recurring income by staking your SUSHI.</Text>
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
            <SushiBalance state={state} />
            <AmountInput state={state} />
            {state.sushi && state.sushi.balance.isZero() && (
                <Notice text={"You don't have any SUSHI."} color={"orange"} style={{ marginTop: Spacing.small }} />
            )}
            <StakeInfo state={state} />
        </View>
    );
};

const SushiBalance = ({ state }: { state: StakingState }) => {
    return (
        <View>
            <Heading text={"Your SUSHI"} />
            <Text disabled={!state.sushi} style={{ fontSize: 28, marginBottom: Spacing.normal }}>
                {!state.sushi
                    ? "Fetching..."
                    : formatBalance(state.sushi.balance, state.sushi.decimals, IS_DESKTOP ? 18 : 8)}
            </Text>
        </View>
    );
};

const AmountInput = ({ state }: { state: StakingState }) => {
    if (!state.sushi || state.sushi.balance.isZero()) {
        return <Heading text={"Amount To Stake"} disabled={true} />;
    }
    return (
        <View>
            <Heading text={"Amount To Stake"} />
            <TokenInput
                token={state.sushi}
                amount={state.amount}
                onAmountChanged={state.setAmount}
                autoFocus={IS_DESKTOP}
            />
        </View>
    );
};

// tslint:disable-next-line:max-func-body-length
const StakeInfo = ({ state }: { state: StakingState }) => {
    const disabled =
        !state.sushi ||
        state.sushi.balance.isZero() ||
        !state.xSushi ||
        !state.sushiStaked ||
        !state.xSushiSupply ||
        isEmptyValue(state.amount);
    const xSushiAmount = disabled
        ? undefined
        : parseBalance(state.amount, state.sushi!.decimals)
              .mul(state.xSushiSupply!)
              .div(state.sushiStaked!);
    const xSushiTotal = disabled ? undefined : formatBalance(state.xSushiSupply!, state.xSushi!.decimals);
    const xSushiBalance = disabled ? undefined : state.xSushi!.balance.add(xSushiAmount!);
    const share = disabled
        ? undefined
        : Fraction.from(xSushiAmount!.add(xSushiBalance!), state.xSushiSupply!).toString();
    return (
        <InfoBox>
            <Text disabled={disabled} style={{ fontSize: 28, marginBottom: Spacing.normal }}>
                {!xSushiAmount ? "N/A" : formatBalance(xSushiAmount, state.xSushi!.decimals, 8) + " xSUSHI"}
            </Text>
            <Meta label={"xSUSHI Share"} text={share} suffix={"%"} disabled={disabled} />
            <Meta label={"Total xSUSHI"} text={xSushiTotal} disabled={disabled} />
            <Controls state={state} />
        </InfoBox>
    );
};

const Controls = ({ state }: { state: StakingState }) => {
    const [error, setError] = useState<MetamaskError>({});
    return (
        <View style={{ marginTop: Spacing.normal }}>
            {!state.sushi || state.sushi.balance.isZero() || isEmptyValue(state.amount) ? (
                <StakeButton state={state} onError={setError} disabled={true} />
            ) : parseBalance(state.amount, state.sushi.decimals).gt(state.sushi.balance) ? (
                <InsufficientBalanceButton symbol={state.sushi.symbol} />
            ) : state.loading ? (
                <FetchingButton />
            ) : (
                <>
                    <ApproveButton
                        token={state.sushi}
                        spender={SUSHI_BAR}
                        onSuccess={() => state.setSushiAllowed(true)}
                        onError={setError}
                        hidden={state.sushiAllowed}
                    />
                    <StakeButton state={state} onError={setError} disabled={!state.sushiAllowed} />
                </>
            )}
            {error.message && error.code !== 4001 && <ErrorMessage error={error} />}
        </View>
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
    const onPress = async () => {
        onError({});
        try {
            await state.onEnter();
            state.setAmount("");
        } catch (e) {
            onError(e);
        }
    };
    return <Button title={"Stake"} loading={state.entering} onPress={onPress} disabled={disabled} />;
};

export default StakeScreen;
