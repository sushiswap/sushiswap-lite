import React, { useContext, useState } from "react";
import { Platform, View } from "react-native";

import AmountMeta from "../components/AmountMeta";
import ApproveButton from "../components/ApproveButton";
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
import { EthersContext } from "../context/EthersContext";
import useStakingState, { StakingState } from "../hooks/useStakingState";
import useTranslation from "../hooks/useTranslation";
import MetamaskError from "../types/MetamaskError";
import { formatBalance, isEmptyValue, parseBalance } from "../utils";
import Screen from "./Screen";

const StakeScreen = () => {
    const t = useTranslation();
    return (
        <Screen>
            <Container>
                {Platform.OS === "web" && <BackgroundImage />}
                <Content>
                    <Title text={t("stake")} />
                    <Text light={true}>{t("stake-desc")}</Text>
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
            <SushiBalance state={state} />
            <Border />
            <AmountInput state={state} />
            {state.sushi && state.sushi.balance.isZero() && (
                <Notice text={t("you-dont-have-sushi")} color={"orange"} style={{ marginTop: Spacing.small }} />
            )}
            <StakeInfo state={state} />
        </View>
    );
};

const SushiBalance = ({ state }: { state: StakingState }) => {
    const t = useTranslation();
    return (
        <View>
            <Heading text={t("your-sushi")} />
            <AmountMeta
                amount={state.sushi ? formatBalance(state.sushi.balance, state.sushi.decimals) : ""}
                suffix={"SUSHI"}
            />
        </View>
    );
};

const AmountInput = ({ state }: { state: StakingState }) => {
    const t = useTranslation();
    if (!state.sushi || state.sushi.balance.isZero()) {
        return <Heading text={t("amount-to-stake")} disabled={true} />;
    }
    return (
        <View>
            <Heading text={t("amount-to-stake")} />
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
    const t = useTranslation();
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
    const xSushiTotal = disabled ? undefined : formatBalance(state.xSushiSupply!, state.xSushi!.decimals, 8);
    const xSushiBalance = disabled ? undefined : state.xSushi!.balance.add(xSushiAmount!);
    const share = disabled
        ? undefined
        : Fraction.from(xSushiAmount!.add(xSushiBalance!), state.xSushiSupply!).toString();
    return (
        <InfoBox>
            <AmountMeta
                amount={xSushiAmount ? formatBalance(xSushiAmount, state.xSushi!.decimals, 8) : ""}
                suffix={"xSUSHI"}
                disabled={disabled}
            />
            <Meta label={t("xsushi-share")} text={share} suffix={"%"} disabled={disabled} />
            <Meta label={t("total-xsushi")} text={xSushiTotal} disabled={disabled} />
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
    const t = useTranslation();
    const onPress = async () => {
        onError({});
        try {
            await state.onEnter();
            state.setAmount("");
        } catch (e) {
            onError(e);
        }
    };
    return <Button title={t("stake")} loading={state.entering} onPress={onPress} disabled={disabled} />;
};

export default StakeScreen;
