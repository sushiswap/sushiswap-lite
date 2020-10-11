import React, { useCallback, useState } from "react";
import { Icon } from "react-native-elements";

import useAsyncEffect from "use-async-effect";
import { ROUTER } from "../constants/contracts";
import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import useRemoveLiquidityState, { RemoveLiquidityState } from "../hooks/useRemoveLiquidityState";
import MetamaskError from "../types/MetamaskError";
import { isEmptyValue, parseBalance } from "../utils";
import ApproveButton from "./ApproveButton";
import Button from "./Button";
import Column from "./Column";
import ErrorMessage from "./ErrorMessage";
import FetchingButton from "./FetchingButton";
import InsufficientBalanceButton from "./InsufficientBalanceButton";
import LPTokenItem from "./LPTokenItem";
import LPTokenSelect from "./LPTokenSelect";
import Text from "./Text";
import TokenInput from "./TokenInput";

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
                title={"1. Select the pool to REMOVE liquidity from:"}
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
    if (!state.selectedLPToken || isEmptyValue(state.fromAmount) || isEmptyValue(state.toAmount)) {
        return <Column noTopMargin={true} />;
    }
    return (
        <Column noTopMargin={true}>
            <ArrowDown />
            <Amount amount={state.fromAmount} token={state.fromToken} />
            <Amount amount={state.toAmount} token={state.toToken} />
        </Column>
    );
};

const ArrowDown = () => {
    const { textLight } = useColors();
    return <Icon type={"material-community"} name={"arrow-down"} color={textLight} style={{ margin: Spacing.small }} />;
};

const Amount = ({ amount, token }) => {
    const symbol = token.symbol === "WETH" ? "ETH" : token.symbol;
    return (
        <Text style={{ fontSize: 22, textAlign: "center" }}>
            {amount} {symbol}
        </Text>
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
    return <Button size={"large"} title={"Remove"} disabled={disabled} loading={state.removing} onPress={onPress} />;
};

export default RemoveLiquidity;
