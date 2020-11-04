import React, { useCallback, useState } from "react";
import { Platform, View } from "react-native";

import useAsyncEffect from "use-async-effect";
import ApproveButton from "../components/ApproveButton";
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
import Text from "../components/Text";
import Title from "../components/Title";
import TokenInput from "../components/TokenInput";
import WebFooter from "../components/web/WebFooter";
import { LiquiditySubMenu } from "../components/web/WebSubMenu";
import { ROUTER } from "../constants/contracts";
import { Spacing } from "../constants/dimension";
import useRemoveLiquidityState, { RemoveLiquidityState } from "../hooks/useRemoveLiquidityState";
import MetamaskError from "../types/MetamaskError";
import { isEmptyValue, parseBalance } from "../utils";
import Screen from "./Screen";

const RemoveLiquidityScreen = () => {
    return (
        <Screen>
            <LiquiditySubMenu />
            <Container>
                <Content>
                    <Title text={"Remove Liquidity"} />
                    <Text light={true}>Scan your liquidity and remove one if needed.</Text>
                    <RemoveLiquidity />
                    {Platform.OS === "web" && <WebFooter />}
                </Content>
            </Container>
        </Screen>
    );
};

const RemoveLiquidity = () => {
    const state = useRemoveLiquidityState();
    return (
        <View style={{ marginTop: Spacing.large }}>
            <LPTokenSelect
                state={state}
                title={"Your Liquidity"}
                emptyText={"You don't have any liquidity."}
                Item={LPTokenItem}
            />
            <Border />
            <AmountInput state={state} />
            <AmountInfo state={state} />
        </View>
    );
};

const AmountInput = ({ state }: { state: RemoveLiquidityState }) => {
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

const AmountInfo = ({ state }: { state: RemoveLiquidityState }) => {
    const disabled = !state.selectedLPToken || !state.fromToken || !state.toToken;
    return (
        <InfoBox>
            <Meta
                label={state.fromToken ? "Amount of " + state.fromToken.symbol : "Amount of Token 1"}
                text={state.fromAmount}
                disabled={disabled}
            />
            <Meta
                label={state.toToken ? "Amount of " + state.toToken.symbol : "Amount of Token 2"}
                text={state.toAmount}
                disabled={disabled}
            />
            <Controls state={state} />
        </InfoBox>
    );
};

// tslint:disable-next-line:max-func-body-length
const Controls = ({ state }: { state: RemoveLiquidityState }) => {
    const [error, setError] = useState<MetamaskError>({});
    useAsyncEffect(() => setError({}), [state.fromSymbol, state.toSymbol, state.fromAmount]);
    const approveRequired = !state.selectedLPTokenAllowed;
    const disabled = approveRequired || isEmptyValue(state.amount);
    return (
        <View style={{ marginTop: Spacing.normal }}>
            {!state.selectedLPToken || isEmptyValue(state.amount) ? (
                <RemoveButton state={state} onError={setError} disabled={true} />
            ) : parseBalance(state.amount, state.selectedLPToken.decimals).gt(state.selectedLPToken.balance) ? (
                <InsufficientBalanceButton symbol={state.selectedLPToken.symbol} />
            ) : state.loading || !state.pair ? (
                <FetchingButton />
            ) : (
                <>
                    <ApproveButton
                        token={state.selectedLPToken}
                        spender={ROUTER}
                        onSuccess={() => state.setSelectedLPTokenAllowed(true)}
                        onError={setError}
                        hidden={!approveRequired}
                    />
                    <RemoveButton state={state} onError={setError} disabled={disabled} />
                </>
            )}
            {error.message && error.code !== 4001 && <ErrorMessage error={error} />}
        </View>
    );
};

const RemoveButton = ({
    state,
    onError,
    disabled
}: {
    state: RemoveLiquidityState;
    onError: (e) => void;
    disabled: boolean;
}) => {
    const onPress = useCallback(() => {
        onError({});
        state.onRemove().catch(onError);
    }, [state.onRemove, onError]);
    return <Button title={"Remove Liquidity"} disabled={disabled} loading={state.removing} onPress={onPress} />;
};

export default RemoveLiquidityScreen;
