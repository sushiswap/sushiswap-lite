import React, { useContext, useState } from "react";
import { Platform, View } from "react-native";

import useAsyncEffect from "use-async-effect";
import ApproveButton from "../components/ApproveButton";
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
import LPTokenSelect, { LPTokenItem } from "../components/LPTokenSelect";
import Meta from "../components/Meta";
import Select, { Option } from "../components/Select";
import Text from "../components/Text";
import Title from "../components/Title";
import TokenInput from "../components/TokenInput";
import WebFooter from "../components/web/WebFooter";
import { MigrateSubMenu } from "../components/web/WebSubMenu";
import { SUSHI_ROLL } from "../constants/contracts";
import { Spacing } from "../constants/dimension";
import { EthersContext } from "../context/EthersContext";
import useLinker from "../hooks/useLinker";
import useMigrateState, { MigrateMode, MigrateState } from "../hooks/useMigrateState";
import MetamaskError from "../types/MetamaskError";
import { isEmptyValue, parseBalance } from "../utils";
import Screen from "./Screen";

const MigrateScreen = () => {
    return (
        <Screen>
            <Container>
                <BackgroundImage />
                <Content>
                    <Title text={"Migrate Liquidity"} />
                    <Text light={true}>Migrate your Uniswap LP tokens to SushiSwap LP tokens.</Text>
                    <Migrate />
                </Content>
                {Platform.OS === "web" && <WebFooter />}
            </Container>
            <MigrateSubMenu />
        </Screen>
    );
};

const Migrate = () => {
    const { ethereum } = useContext(EthersContext);
    const state = useMigrateState();
    return (
        <View style={{ marginTop: Spacing.large }}>
            {!ethereum?.isWalletConnect && (
                <>
                    <MigrateModeSelect state={state} />
                    <Border />
                </>
            )}
            <UniswapLiquidityScreen state={state} />
            <Border />
            <AmountInput state={state} />
            <AmountInfo state={state} />
        </View>
    );
};

const MigrateModeSelect = ({ state }: { state: MigrateState }) => {
    const options: Option[] = [
        {
            key: "permit",
            title: "Non-hardware Wallet",
            description: "Migration is done in one-click using your signature(permit)."
        },
        {
            key: "approve",
            title: "Hardware Wallet (Trezor, Ledger, etc.)",
            description: "You need to first approve LP tokens and then migrate it."
        }
    ];
    return (
        <Select
            title={"Wallet Type"}
            options={options}
            option={options.find(option => option.key === state.mode)}
            setOption={option => state.setMode(option?.key as MigrateMode | undefined)}
        />
    );
};

const UniswapLiquidityScreen = ({ state }: { state: MigrateState }) => {
    if (!state.mode) {
        return <Heading text={"Your Uniswap Liquidity"} disabled={true} />;
    }
    return (
        <LPTokenSelect
            state={state}
            title={"Your Uniswap Liquidity"}
            emptyText={"You don't have any liquidity on Uniswap."}
            Item={LPTokenItem}
        />
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
    const disabled = !state.selectedLPToken || isEmptyValue(state.amount);
    return (
        <InfoBox>
            <Meta label={state.selectedLPToken?.symbol || "SushiSwap LP"} text={state.amount} disabled={disabled} />
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
                    {state.mode === "approve" && !state.selectedLPTokenAllowed && (
                        <ApproveButton
                            token={state.selectedLPToken}
                            spender={SUSHI_ROLL}
                            onSuccess={() => state.setSelectedLPTokenAllowed(true)}
                            onError={setError}
                        />
                    )}
                    <MigrateButton
                        state={state}
                        onError={setError}
                        disabled={state.mode === "approve" && !state.selectedLPTokenAllowed}
                    />
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
    const goToFarm = useLinker("/farming", "Farming");
    const onPress = async () => {
        onError({});
        try {
            await state.onMigrate();
            goToFarm();
        } catch (e) {
            onError(e);
        }
    };
    return <Button title={"Migrate Liquidity"} loading={state.migrating} onPress={onPress} disabled={disabled} />;
};

export default MigrateScreen;
