import React, { useCallback, useState } from "react";
import { Platform, View } from "react-native";

import useAsyncEffect from "use-async-effect";
import ApproveButton from "../components/ApproveButton";
import Border from "../components/Border";
import Button from "../components/Button";
import Container from "../components/Container";
import Content from "../components/Content";
import ErrorMessage from "../components/ErrorMessage";
import ExperimentalNotice from "../components/ExperimentalNotice";
import FetchingButton from "../components/FetchingButton";
import Heading from "../components/Heading";
import InfoBox from "../components/InfoBox";
import InsufficientBalanceButton from "../components/InsufficientBalanceButton";
import LPTokenSelect, { LPTokenItem } from "../components/LPTokenSelect";
import Text from "../components/Text";
import Title from "../components/Title";
import TokenInput from "../components/TokenInput";
import WebFooter from "../components/web/WebFooter";
import { LiquiditySubMenu } from "../components/web/WebSubMenu";
import { MIGRATOR2 } from "../constants/contracts";
import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import useMigrateState, { MigrateState } from "../hooks/useMigrateState";
import MetamaskError from "../types/MetamaskError";
import { isEmptyValue, parseBalance } from "../utils";
import Screen from "./Screen";

const MigrateScreen = () => {
    return (
        <Screen>
            <LiquiditySubMenu />
            <Container>
                <Content>
                    <Title text={"Migrate"} />
                    <Text light={true}>Migrate your Uniswap LP tokens.</Text>
                    <Migrate />
                    {Platform.OS === "web" && <WebFooter />}
                </Content>
            </Container>
        </Screen>
    );
};

const Migrate = () => {
    const state = useMigrateState();
    return (
        <View style={{ marginTop: Spacing.normal }}>
            <LPTokenSelect
                state={state}
                title={"Your Uniswap Liquidity"}
                emptyText={"You don't have any liquidity on Uniswap."}
                Item={LPTokenItem}
            />
            <Border />
            <AmountInput state={state} />
            <ExperimentalNotice
                contractURL={"https://github.com/sushiswap/sushiswap/blob/master/contracts/Migrator2.sol"}
            />
            <AmountInfo state={state} />
        </View>
    );
};

const AmountInput = ({ state }: { state: MigrateState }) => {
    if (!state.selectedLPToken) {
        return <Heading text={"Amount of Tokens"} disabled={true} />;
    }
    return (
        <TokenInput
            title={"Amount of Tokens"}
            token={state.selectedLPToken}
            amount={state.amount}
            onAmountChanged={state.setAmount}
        />
    );
};

const AmountInfo = ({ state }: { state: MigrateState }) => {
    const { textDark, textLight, placeholder } = useColors();
    const disabled = !state.selectedLPToken || isEmptyValue(state.amount);
    const color = disabled ? placeholder : state.amount ? textDark : textLight;
    return (
        <InfoBox>
            <Text style={{ fontSize: 28, color }}>{disabled ? "N/A" : state.amount + " SLP"}</Text>
            <Controls state={state} />
        </InfoBox>
    );
};

const Controls = ({ state }: { state: MigrateState }) => {
    const [error, setError] = useState<MetamaskError>({});
    useAsyncEffect(() => setError({}), [state.amount]);
    return (
        <View style={{ marginTop: Spacing.normal }}>
            {!state.selectedLPToken || isEmptyValue(state.amount) ? (
                <MigrateButton state={state} onError={setError} disabled={true} />
            ) : parseBalance(state.amount, state.selectedLPToken.decimals).gt(state.selectedLPToken.balance) ? (
                <InsufficientBalanceButton symbol={state.selectedLPToken.symbol} />
            ) : state.loading ? (
                <FetchingButton />
            ) : (
                <>
                    <ApproveButton
                        token={state.selectedLPToken}
                        spender={MIGRATOR2}
                        onSuccess={() => state.setSelectedLPTokenAllowed(true)}
                        onError={setError}
                        hidden={state.selectedLPTokenAllowed}
                    />
                    <MigrateButton state={state} onError={setError} disabled={!state.selectedLPTokenAllowed} />
                </>
            )}
            {error.message && error.code !== 4001 && <ErrorMessage error={error} />}
        </View>
    );
};

const MigrateButton = ({
    state,
    onError,
    disabled
}: {
    state: MigrateState;
    onError: (e) => void;
    disabled: boolean;
}) => {
    const onPress = useCallback(async () => {
        onError({});
        try {
            await state.onMigrate();
        } catch (e) {
            onError(e);
        }
    }, []);
    return <Button title={"Migrate"} loading={state.migrating} onPress={onPress} disabled={disabled} />;
};

export default MigrateScreen;
