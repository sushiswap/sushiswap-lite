import React, { useCallback, useState } from "react";
import { Platform } from "react-native";

import useAsyncEffect from "use-async-effect";
import ApproveButton from "../components/ApproveButton";
import Button from "../components/Button";
import Column from "../components/Column";
import Container from "../components/Container";
import Content from "../components/Content";
import ErrorMessage from "../components/ErrorMessage";
import FetchingButton from "../components/FetchingButton";
import InsufficientBalanceButton from "../components/InsufficientBalanceButton";
import LPTokenItem from "../components/LPTokenItem";
import LPTokenSelect from "../components/LPTokenSelect";
import Meta from "../components/Meta";
import Text from "../components/Text";
import TokenInput from "../components/TokenInput";
import WebFooter from "../components/web/WebFooter";
import { ROUTER } from "../constants/contracts";
import { Spacing } from "../constants/dimension";
import useRemoveLiquidityState, { RemoveLiquidityState } from "../hooks/useRemoveLiquidityState";
import MetamaskError from "../types/MetamaskError";
import { isEmptyValue, parseBalance } from "../utils";
import Screen from "./Screen";

const RemoveLiquidityScreen = () => {
    return (
        <Screen>
            <Container>
                <Content>
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
        <>
            <Column>
                <Text h4={true} style={{ textAlign: "center", marginBottom: Spacing.normal }}>
                    🎉 Remove Liquidity
                </Text>
            </Column>
            <LPTokenSelect
                state={state}
                title={"1. Select a pool to REMOVE liquidity from:"}
                emptyText={"You don't have any liquidity."}
                Item={LPTokenItem}
            />
            <TokenInput
                title={"2. How many tokens do you want to REMOVE?"}
                token={state.selectedLPToken}
                hidden={!state.selectedLPToken}
                amount={state.amount}
                onAmountChanged={state.setAmount}
            />
            <AmountInfo state={state} />
            <Controls state={state} />
        </>
    );
};

const AmountInfo = ({ state }: { state: RemoveLiquidityState }) => {
    if (!state.selectedLPToken || !state.fromToken || !state.toToken) {
        return <Column noTopMargin={true} />;
    }
    return (
        <Column noTopMargin={true}>
            <Meta
                label={"Amount of " + state.fromToken.symbol}
                text={state.fromAmount}
                suffix={state.fromToken.symbol}
            />
            <Meta label={"Amount of " + state.toToken.symbol} text={state.toAmount} suffix={state.toToken.symbol} />
        </Column>
    );
};

// tslint:disable-next-line:max-func-body-length
const Controls = ({ state }: { state: RemoveLiquidityState }) => {
    const [error, setError] = useState<MetamaskError>({});
    useAsyncEffect(() => setError({}), [state.fromSymbol, state.toSymbol, state.fromAmount]);
    if (!state.selectedLPToken) {
        return <Column noTopMargin={true} />;
    }
    const approveRequired = !state.selectedLPTokenAllowed;
    const disabled = approveRequired || isEmptyValue(state.amount);
    return (
        <Column>
            {parseBalance(state.amount, state.selectedLPToken.decimals).gt(state.selectedLPToken.balance) ? (
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
        </Column>
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
    return <Button title={"Remove"} disabled={disabled} loading={state.removing} onPress={onPress} />;
};

export default RemoveLiquidityScreen;
