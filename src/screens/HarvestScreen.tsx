import React, { FC, useCallback, useState } from "react";
import { Platform, View } from "react-native";

import useAsyncEffect from "use-async-effect";
import BackgroundImage from "../components/BackgroundImage";
import Border from "../components/Border";
import Button from "../components/Button";
import CloseIcon from "../components/CloseIcon";
import Container from "../components/Container";
import Content from "../components/Content";
import ErrorMessage from "../components/ErrorMessage";
import FetchingButton from "../components/FetchingButton";
import FlexView from "../components/FlexView";
import Heading from "../components/Heading";
import InfoBox from "../components/InfoBox";
import { ITEM_SEPARATOR_HEIGHT } from "../components/ItemSeparator";
import LPTokenSelect, { LPTokenItemProps } from "../components/LPTokenSelect";
import Meta from "../components/Meta";
import Selectable from "../components/Selectable";
import SelectIcon from "../components/SelectIcon";
import Text from "../components/Text";
import Title from "../components/Title";
import TokenInput from "../components/TokenInput";
import TokenLogo from "../components/TokenLogo";
import WebFooter from "../components/web/WebFooter";
import { FarmingSubMenu } from "../components/web/WebSubMenu";
import { IS_DESKTOP, Spacing } from "../constants/dimension";
import useFarmingState, { FarmingState } from "../hooks/useFarmingState";
import MetamaskError from "../types/MetamaskError";
import Token from "../types/Token";
import { formatBalance, isEmptyValue, parseBalance } from "../utils";
import Screen from "./Screen";

const HarvestScreen = () => {
    return (
        <Screen>
            <Container>
                <BackgroundImage />
                <Content>
                    <Title text={"Harvest SUSHI"} />
                    <Text light={true}>Withdraw your LP tokens to harvest SUSHI rewards.</Text>
                    <Harvest />
                </Content>
                {Platform.OS === "web" && <WebFooter />}
            </Container>
            <FarmingSubMenu />
        </Screen>
    );
};

const Harvest = () => {
    const state = useFarmingState(true);
    const emptyText = "You don't have any LP tokens deposited.";
    return (
        <View style={{ marginTop: Spacing.large }}>
            <LPTokenSelect state={state} title={"My Pools"} emptyText={emptyText} Item={TokenItem} />
            <Border />
            <Withdraw state={state} />
            <WithdrawInfo state={state} />
        </View>
    );
};

// tslint:disable-next-line:max-func-body-length
const TokenItem: FC<LPTokenItemProps> = props => {
    const amount = formatBalance(props.token?.amountDeposited || 0, props.token.decimals, 8);
    const onPress = useCallback(() => {
        props.onSelectToken(props.token);
    }, [props.onSelectToken, props.token]);
    return (
        <Selectable
            selected={props.selected}
            onPress={onPress}
            containerStyle={{ marginBottom: ITEM_SEPARATOR_HEIGHT }}>
            <FlexView style={{ alignItems: "center" }}>
                <TokenLogo token={props.token.tokenA} small={true} replaceWETH={true} />
                <TokenLogo token={props.token.tokenB} small={true} replaceWETH={true} style={{ marginLeft: 4 }} />
                <Text medium={true} caption={true} style={{ marginLeft: Spacing.tiny }}>
                    {props.token.tokenA.symbol}-{props.token.tokenB.symbol}
                </Text>
                <Text caption={IS_DESKTOP} medium={true} style={{ flex: 1, textAlign: "right", marginRight: 4 }}>
                    {amount}
                </Text>
                {props.selected ? <CloseIcon /> : <SelectIcon />}
            </FlexView>
        </Selectable>
    );
};

const Withdraw = ({ state }: { state: FarmingState }) => {
    if (!state.selectedLPToken) {
        return <Heading text={"Amount"} disabled={true} />;
    }
    // This enables MAX button
    const token = {
        ...state.selectedLPToken,
        balance: state.selectedLPToken.amountDeposited
    } as Token;
    return (
        <View>
            <Heading text={state.selectedLPToken.symbol + " Amount"} />
            <TokenInput token={token} amount={state.amount} onAmountChanged={state.setAmount} autoFocus={IS_DESKTOP} />
        </View>
    );
};

const WithdrawInfo = ({ state }: { state: FarmingState }) => {
    const amount = parseBalance(state.amount);
    const total = state.selectedLPToken?.amountDeposited;
    const sushi = total && amount.lte(total) ? state.selectedLPToken!.pendingSushi?.mul(amount).div(total) : undefined;
    return (
        <InfoBox>
            <Meta label={"SUSHI Rewards"} text={sushi ? formatBalance(sushi) : ""} disabled={!state.selectedLPToken} />
            <Meta
                label={"Amount Deposited"}
                text={total ? formatBalance(total) : ""}
                disabled={!state.selectedLPToken}
            />
            <WithdrawControls state={state} />
        </InfoBox>
    );
};

const WithdrawControls = ({ state }: { state: FarmingState }) => {
    const [error, setError] = useState<MetamaskError>({});
    useAsyncEffect(() => setError({}), [state.selectedLPToken]);
    const disabled = isEmptyValue(state.amount);
    return (
        <View style={{ marginTop: Spacing.normal }}>
            {!state.selectedLPToken || state.selectedLPToken.amountDeposited?.isZero() ? (
                <WithdrawButton state={state} onError={setError} disabled={true} />
            ) : parseBalance(state.amount, state.selectedLPToken!.decimals).gt(
                  state.selectedLPToken!.amountDeposited!
              ) ? (
                <Button title={"Insufficient Amount"} disabled={true} />
            ) : state.loading ? (
                <FetchingButton />
            ) : (
                <WithdrawButton state={state} onError={setError} disabled={disabled} />
            )}
            {error.message && error.code !== 4001 && <ErrorMessage error={error} />}
        </View>
    );
};

const WithdrawButton = ({
    state,
    onError,
    disabled
}: {
    state: FarmingState;
    onError: (e) => void;
    disabled: boolean;
}) => {
    const onPress = useCallback(() => {
        onError({});
        state.onWithdraw().catch(onError);
    }, [state.onWithdraw, onError]);
    return <Button title={"Withdraw"} disabled={disabled} loading={state.withdrawing} onPress={onPress} />;
};

export default HarvestScreen;
