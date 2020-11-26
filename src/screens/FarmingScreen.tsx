import React, { FC, useCallback, useState } from "react";
import { Platform, View } from "react-native";

import useAsyncEffect from "use-async-effect";
import AmountMeta from "../components/AmountMeta";
import ApproveButton from "../components/ApproveButton";
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
import InsufficientBalanceButton from "../components/InsufficientBalanceButton";
import { ITEM_SEPARATOR_HEIGHT } from "../components/ItemSeparator";
import LPTokenSelect, { LPTokenItemProps } from "../components/LPTokenSelect";
import Meta from "../components/Meta";
import Notice from "../components/Notice";
import Selectable from "../components/Selectable";
import SelectIcon from "../components/SelectIcon";
import Text from "../components/Text";
import Title from "../components/Title";
import TokenInput from "../components/TokenInput";
import TokenLogo from "../components/TokenLogo";
import WebFooter from "../components/web/WebFooter";
import { FarmingSubMenu } from "../components/web/WebSubMenu";
import { MASTER_CHEF } from "../constants/contracts";
import { IS_DESKTOP, Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import useFarmingState, { FarmingState } from "../hooks/useFarmingState";
import useLinker from "../hooks/useLinker";
import MetamaskError from "../types/MetamaskError";
import { formatBalance, formatPercentage, formatUSD, isEmptyValue, parseBalance, pow10 } from "../utils";
import Screen from "./Screen";

const FarmingScreen = () => {
    return (
        <Screen>
            <Container>
                <BackgroundImage />
                <Content>
                    <Title text={"Plant LP Tokens"} />
                    <Text light={true}>Deposit your LP tokens and earn additional SUSHI rewards.</Text>
                    <Farming />
                </Content>
                {Platform.OS === "web" && <WebFooter />}
            </Container>
            <FarmingSubMenu />
        </Screen>
    );
};

const Farming = () => {
    const state = useFarmingState(false);
    const emptyText = "Temporarily unable to load pools.";
    return (
        <View style={{ marginTop: Spacing.large }}>
            <LPTokenSelect state={state} title={"Active Pools"} emptyText={emptyText} Item={TokenItem} />
            <Border />
            <Deposit state={state} />
            <DepositInfo state={state} />
            <Notice
                text={
                    "⚠️ 2/3 of your SUSHI rewards are vested for 6 months. You can harvest 1/3 immediately and the remaining 2/3 after 6 months of waiting."
                }
                clear={true}
                style={{ marginTop: Spacing.normal }}
            />
        </View>
    );
};

// tslint:disable-next-line:max-func-body-length
const TokenItem: FC<LPTokenItemProps> = props => {
    const apy = props.token.apy || 0;
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
                    {formatPercentage(apy)}%
                </Text>
                <Text caption={IS_DESKTOP} light={true} fontWeight={"light"}>
                    APY
                </Text>
                {props.selected ? <CloseIcon /> : <SelectIcon />}
            </FlexView>
        </Selectable>
    );
};

const Deposit = ({ state }: { state: FarmingState }) => {
    if (!state.selectedLPToken) {
        return <Heading text={"Amount"} disabled={true} />;
    }
    return (
        <View>
            <Heading text={state.selectedLPToken.symbol + " Amount"} />
            {state.selectedLPToken.balance.isZero() ? (
                <AddLiquidityNotice state={state} />
            ) : (
                <TokenInput
                    token={state.selectedLPToken}
                    amount={state.amount}
                    onAmountChanged={state.setAmount}
                    autoFocus={IS_DESKTOP}
                />
            )}
        </View>
    );
};

const AddLiquidityNotice = ({ state }: { state: FarmingState }) => {
    const { green } = useColors();
    const onPress = useLinker("/liquidity", "Liquidity");
    return (
        <>
            <Notice
                color={green}
                text={
                    "You need some " +
                    state.selectedLPToken!.symbol +
                    " token to start farming. Add liquidity to get the LP token."
                }
            />
            <Button
                color={green}
                title={"Add Liquidity"}
                containerStyle={{ marginTop: Spacing.normal }}
                onPress={onPress}
            />
        </>
    );
};

const DepositInfo = ({ state }: { state: FarmingState }) => {
    const disabled = isEmptyValue(state.amount) || !state.selectedLPToken?.sushiRewardedPerYear;
    const sushiPerYear = disabled
        ? 0
        : parseBalance(state.amount)
              .mul(state.selectedLPToken!.sushiRewardedPerYear!)
              .div(pow10(18));
    return (
        <InfoBox>
            <AmountMeta amount={formatBalance(sushiPerYear, 18, 8)} suffix={"SUSHI / 1y"} disabled={disabled} />
            <Meta
                label={"My Balance"}
                text={formatBalance(state.selectedLPToken?.balance || 0)}
                disabled={!state.selectedLPToken}
            />
            <Meta
                label={"Annual Percentage Yield"}
                text={formatPercentage(state.selectedLPToken?.apy || 0)}
                suffix={"%"}
                disabled={!state.selectedLPToken}
            />
            <Meta
                label={"Total Value Locked"}
                text={formatUSD(state.selectedLPToken?.totalValueUSD || 0)}
                disabled={!state.selectedLPToken}
            />
            <DepositControls state={state} />
        </InfoBox>
    );
};

const DepositControls = ({ state }: { state: FarmingState }) => {
    const [error, setError] = useState<MetamaskError>({});
    useAsyncEffect(() => setError({}), [state.selectedLPToken]);
    const approveRequired = !state.selectedLPTokenAllowed;
    const disabled = approveRequired || isEmptyValue(state.amount);
    return (
        <View style={{ marginTop: Spacing.normal }}>
            {!state.selectedLPToken || state.selectedLPToken.balance.isZero() ? (
                <DepositButton state={state} onError={setError} disabled={true} />
            ) : parseBalance(state.amount, state.selectedLPToken!.decimals).gt(state.selectedLPToken!.balance) ? (
                <InsufficientBalanceButton symbol={state.selectedLPToken!.symbol} />
            ) : state.loading ? (
                <FetchingButton />
            ) : (
                <>
                    <ApproveButton
                        token={state.selectedLPToken!}
                        spender={MASTER_CHEF}
                        onSuccess={() => state.setSelectedLPTokenAllowed(true)}
                        onError={setError}
                        hidden={isEmptyValue(state.amount) || !approveRequired}
                    />
                    <DepositButton state={state} onError={setError} disabled={disabled} />
                </>
            )}
            {error.message && error.code !== 4001 && <ErrorMessage error={error} />}
        </View>
    );
};

const DepositButton = ({
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
        state.onDeposit().catch(onError);
    }, [state.onDeposit, onError]);
    return <Button title={"Deposit"} disabled={disabled} loading={state.depositing} onPress={onPress} />;
};

export default FarmingScreen;
