import React, { useContext, useState } from "react";
import { Platform, View } from "react-native";

import AmountMeta from "../components/AmountMeta";
import BackgroundImage from "../components/BackgroundImage";
import Border from "../components/Border";
import Button from "../components/Button";
import ChangeNetwork from "../components/ChangeNetwork";
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
import { EthersContext } from "../context/EthersContext";
import useStakingState, { StakingState } from "../hooks/useStakingState";
import useTranslation from "../hooks/useTranslation";
import MetamaskError from "../types/MetamaskError";
import { formatBalance, isEmptyValue, parseBalance } from "../utils";
import Screen from "./Screen";

const UnstakeScreen = () => {
    const t = useTranslation();
    return (
        <Screen>
            <Container>
                {Platform.OS === "web" && <BackgroundImage />}
                <Content>
                    <Title text={t("unstake")} />
                    <Text light={true}>{t("unstake-desc")}</Text>
                    <Staking />
                </Content>
                {Platform.OS === "web" && <WebFooter />}
            </Container>
            {Platform.OS === "web" && <StakingSubMenu />}
        </Screen>
    );
};

const Staking = () => {
    const { chainId } = useContext(EthersContext);
    const t = useTranslation();
    const state = useStakingState();
    if (chainId !== 1) return <ChangeNetwork />;
    return (
        <View style={{ marginTop: Spacing.large }}>
            <XSushiBalance state={state} />
            <Border />
            <AmountInput state={state} />
            {state.xSushi && state.xSushi.balance.isZero() && (
                <Notice text={t("you-dont-have-xsushi")} color={"orange"} style={{ marginTop: Spacing.small }} />
            )}
            <UnstakeInfo state={state} />
        </View>
    );
};

const XSushiBalance = ({ state }: { state: StakingState }) => {
    const t = useTranslation();
    return (
        <View>
            <Heading text={t("your-xsushi")} />
            <AmountMeta
                amount={state.xSushi ? formatBalance(state.xSushi.balance, state.xSushi.decimals) : ""}
                suffix={"xSUSHI"}
            />
        </View>
    );
};

const AmountInput = ({ state }: { state: StakingState }) => {
    const t = useTranslation();
    if (!state.xSushi || state.xSushi.balance.isZero()) {
        return <Heading text={t("amount-to-unstake")} disabled={true} />;
    }
    return (
        <View>
            <Heading text={t("amount-to-unstake")} />
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
            <AmountMeta
                amount={sushiAmount ? formatBalance(sushiAmount, state.sushi!.decimals, 8) : ""}
                suffix={"SUSHI"}
                disabled={disabled}
            />
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
    const t = useTranslation();
    const onPress = async () => {
        onError({});
        try {
            await state.onLeave();
            state.setAmount("");
        } catch (e) {
            onError(e);
        }
    };
    return <Button title={t("unstake")} loading={state.leaving} onPress={onPress} disabled={disabled} />;
};

export default UnstakeScreen;
