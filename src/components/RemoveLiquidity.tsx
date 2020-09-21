import React, { FC, useCallback, useState } from "react";
import { Image, TouchableHighlight, View } from "react-native";
import { Icon } from "react-native-elements";
import { Hoverable } from "react-native-web-hover";

import useAsyncEffect from "use-async-effect";
import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import { RemoveLiquidityState } from "../hooks/useRemoveLiquidityState";
import { ROUTER } from "../hooks/useSDK";
import MetamaskError from "../types/MetamaskError";
import { formatBalance, isEmptyValue, parseBalance } from "../utils";
import ApproveButton from "./ApproveButton";
import Button from "./Button";
import CloseIcon from "./CloseIcon";
import Column from "./Column";
import ErrorMessage from "./ErrorMessage";
import FetchingButton from "./FetchingButton";
import FlexView from "./FlexView";
import InsufficientBalanceButton from "./InsufficientBalanceButton";
import LPTokenSelect, { LPTokenItemProps } from "./LPTokenSelect";
import SelectIcon from "./SelectIcon";
import Text from "./Text";
import TokenInput from "./TokenInput";

const RemoveLiquidity = ({ state }: { state: RemoveLiquidityState }) => (
    <>
        <Column>
            <Text h4={true} style={{ textAlign: "center" }}>
                🎉 Remove Liquidity
            </Text>
        </Column>
        <LPTokenSelect
            state={state}
            title={"1. Select the pool to REMOVE liquidity from:"}
            emptyText={"You don't have any liquidity."}
            filteredBy={null}
            Item={TokenItem}
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

const TokenItem: FC<LPTokenItemProps> = props => {
    const { background, backgroundHovered, textMedium } = useColors();
    const balance = formatBalance(props.token.balance, props.token.decimals, 18);
    const onPress = useCallback(() => {
        props.onSelectToken(props.token);
    }, [props.onSelectToken, props.token]);
    return (
        <Hoverable>
            {({ hovered }) => (
                <TouchableHighlight onPress={onPress}>
                    <View style={{ backgroundColor: hovered ? backgroundHovered : background }}>
                        <FlexView style={{ alignItems: "center", margin: Spacing.small }}>
                            <View>
                                <LogoSymbol token={props.token.tokenA} />
                                <LogoSymbol token={props.token.tokenB} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text note={true} style={{ textAlign: "right" }}>
                                    My Balance
                                </Text>
                                <Text light={true} style={{ textAlign: "right", fontSize: 22, color: textMedium }}>
                                    {balance}
                                </Text>
                            </View>
                            {props.selected ? <CloseIcon /> : <SelectIcon />}
                        </FlexView>
                    </View>
                </TouchableHighlight>
            )}
        </Hoverable>
    );
};

const LogoSymbol = ({ token }) => {
    const { textMedium } = useColors();
    return (
        <FlexView style={{ alignItems: "center", marginBottom: Spacing.tiny }}>
            <Image
                source={{ uri: token.logoURI }}
                style={{ width: 24, height: 24, backgroundColor: "white", borderRadius: 12 }}
            />
            <Text light={true} style={{ fontSize: 22, color: textMedium, marginLeft: Spacing.small }}>
                {token.symbol}
            </Text>
        </FlexView>
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
