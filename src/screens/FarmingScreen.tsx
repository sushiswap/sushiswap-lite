import React, { FC, useCallback, useContext, useState } from "react";
import { Platform, View } from "react-native";

import useAsyncEffect from "use-async-effect";
import AmountMeta from "../components/AmountMeta";
import ApproveButton from "../components/ApproveButton";
import BackgroundImage from "../components/BackgroundImage";
import Border from "../components/Border";
import Button from "../components/Button";
import ChangeNetwork from "../components/ChangeNetwork";
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
import { EthersContext } from "../context/EthersContext";
import useColors from "../hooks/useColors";
import useFarmingState, { FarmingState } from "../hooks/useFarmingState";
import useLinker from "../hooks/useLinker";
import useTranslation from "../hooks/useTranslation";
import MetamaskError from "../types/MetamaskError";
import { formatBalance, formatPercentage, formatUSD, isEmptyValue, parseBalance, pow10 } from "../utils";
import Screen from "./Screen";

const FarmingScreen = () => {
    const t = useTranslation();
    return (
        <Screen>
            <Container>
                <BackgroundImage />
                <Content>
                    <Title text={t("plant-lp-tokens")} />
                    <Text light={true}>{t("plant-lp-tokens-desc")}</Text>
                    <Farming />
                </Content>
                {Platform.OS === "web" && <WebFooter />}
            </Container>
            <FarmingSubMenu />
        </Screen>
    );
};

const Farming = () => {
    const { chainId } = useContext(EthersContext);
    const t = useTranslation();
    const state = useFarmingState(false);
    if (chainId !== 1) return <ChangeNetwork />;
    return (
        <View style={{ marginTop: Spacing.large }}>
            <LPTokenSelect
                state={state}
                title={t("active-farms")}
                emptyText={t("unable-to-load-farms")}
                Item={TokenItem}
            />
            <Border />
            <Deposit state={state} />
            <DepositInfo state={state} />
            <Notice text={t("sushi-vested-notice")} clear={true} style={{ marginTop: Spacing.normal }} />
        </View>
    );
};

// tslint:disable-next-line:max-func-body-length
const TokenItem: FC<LPTokenItemProps> = props => {
    const apy = props.token.apy || 0;
    const multiplier = props.token.multiplier || 0;
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
                <View style={{ flex: 1, alignItems: "flex-end", marginRight: 4 }}>
                    <Text note={true}>
                        {multiplier > 1 ? "✨" : ""}
                        {multiplier.toFixed(2) || "1.00"}x APY
                    </Text>
                    <Text caption={IS_DESKTOP} medium={true}>
                        {formatPercentage(apy)}%
                    </Text>
                </View>
                {props.selected ? <CloseIcon /> : <SelectIcon />}
            </FlexView>
        </Selectable>
    );
};

const Deposit = ({ state }: { state: FarmingState }) => {
    const t = useTranslation();
    if (!state.selectedLPToken) {
        return <Heading text={t("amount")} disabled={true} />;
    }
    return (
        <View>
            <Heading text={state.selectedLPToken.symbol + " " + t("amount")} />
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
    const t = useTranslation();
    const { green } = useColors();
    const onPress = useLinker("/liquidity", "Liquidity");
    return (
        <>
            <Notice
                color={green}
                text={t("tokens-needed-for-farming-notice", { symbol: state.selectedLPToken!.symbol })}
            />
            <Button
                color={green}
                title={t("add-liquidity")}
                containerStyle={{ marginTop: Spacing.normal }}
                onPress={onPress}
            />
        </>
    );
};

const DepositInfo = ({ state }: { state: FarmingState }) => {
    const t = useTranslation();
    const disabled = isEmptyValue(state.amount) || !state.selectedLPToken?.sushiRewardedPerYear;
    const sushiPerYear = disabled
        ? 0
        : parseBalance(state.amount)
              .mul(state.selectedLPToken!.sushiRewardedPerYear!)
              .div(pow10(18));
    return (
        <InfoBox>
            <AmountMeta amount={formatBalance(sushiPerYear, 18, 8)} suffix={t("sushi-per-year")} disabled={disabled} />
            <Meta
                label={t("my-balance")}
                text={formatBalance(state.selectedLPToken?.balance || 0)}
                disabled={!state.selectedLPToken}
            />
            <Meta
                label={t("total-value-locked")}
                text={formatUSD(state.selectedLPToken?.totalValueUSD || 0)}
                disabled={!state.selectedLPToken}
            />
            <Meta
                label={t("annual-percentage-yield")}
                text={formatPercentage(state.selectedLPToken?.apy || 0)}
                suffix={"%"}
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
    const t = useTranslation();
    const onPress = useCallback(() => {
        onError({});
        state.onDeposit().catch(onError);
    }, [state.onDeposit, onError]);
    return <Button title={t("deposit")} disabled={disabled} loading={state.depositing} onPress={onPress} />;
};

export default FarmingScreen;
