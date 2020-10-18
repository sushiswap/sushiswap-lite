import React, { useCallback, useState } from "react";
import { Platform, View } from "react-native";

import useAsyncEffect from "use-async-effect";
import ApproveButton from "../components/ApproveButton";
import Button from "../components/Button";
import Column from "../components/Column";
import Container from "../components/Container";
import Content from "../components/Content";
import ErrorMessage from "../components/ErrorMessage";
import ExperimentalNotice from "../components/ExperimentalNotice";
import FetchingButton from "../components/FetchingButton";
import InsufficientBalanceButton from "../components/InsufficientBalanceButton";
import LPTokenItem from "../components/LPTokenItem";
import LPTokenSelect from "../components/LPTokenSelect";
import Text from "../components/Text";
import TokenInput from "../components/TokenInput";
import WebFooter from "../components/web/WebFooter";
import { MIGRATOR2 } from "../constants/contracts";
import { Spacing } from "../constants/dimension";
import useMigrateState, { MigrateState } from "../hooks/useMigrateState";
import MetamaskError from "../types/MetamaskError";
import { isEmptyValue, parseBalance } from "../utils";
import Screen from "./Screen";

const MigrateScreen = () => {
    return (
        <Screen>
            <Container>
                <Content>
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
        <View style={{ alignItems: "center", marginBottom: Spacing.huge * 2 }}>
            <Column>
                <Text h4={true} style={{ textAlign: "center", marginBottom: Spacing.normal }}>
                    🦄️ Migrate from Uniswap
                </Text>
                <ExperimentalNotice
                    contractURL={
                        "https://github.com/sushiswap-community/sushiswap-core/blob/master/contracts/Migrator2.sol"
                    }
                />
                <LPTokenSelect
                    state={state}
                    title={"1. Select a uniswap pool to MIGRATE from:"}
                    emptyText={"You don't have any liquidity on uniswap."}
                    Item={LPTokenItem}
                />
                <TokenInput
                    title={"2. How many tokens would you MIGRATE?"}
                    token={state.selectedLPToken}
                    hidden={!state.selectedLPToken}
                    amount={state.amount}
                    onAmountChanged={state.setAmount}
                />
                <Controls state={state} />
            </Column>
        </View>
    );
};

const Controls = ({ state }: { state: MigrateState }) => {
    const [error, setError] = useState<MetamaskError>({});
    useAsyncEffect(() => setError({}), [state.amount]);
    if (!state.selectedLPToken || isEmptyValue(state.amount)) return <Column noTopMargin={true} />;
    return (
        <Column>
            {parseBalance(state.amount, state.selectedLPToken.decimals).gt(state.selectedLPToken.balance) ? (
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
        </Column>
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
