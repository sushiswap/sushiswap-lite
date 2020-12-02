import React, { useCallback, useContext, useState } from "react";
import { Platform, View } from "react-native";

import { TokenAmount } from "@sushiswap/sdk";
import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import AmountMeta from "../components/AmountMeta";
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
import ItemSeparator from "../components/ItemSeparator";
import Meta from "../components/Meta";
import Notice from "../components/Notice";
import Select, { Option } from "../components/Select";
import Text from "../components/Text";
import Title from "../components/Title";
import TokenInput from "../components/TokenInput";
import TokenSelect from "../components/TokenSelect";
import UnsupportedButton from "../components/UnsupportedButton";
import WebFooter from "../components/web/WebFooter";
import { LiquiditySubMenu } from "../components/web/WebSubMenu";
import { ROUTER, ZAP_IN } from "../constants/contracts";
import { Spacing } from "../constants/dimension";
import Fraction from "../constants/Fraction";
import { EthersContext } from "../context/EthersContext";
import useAddLiquidityState, { AddLiquidityMode, AddLiquidityState } from "../hooks/useAddLiquidityState";
import useColors from "../hooks/useColors";
import useLinker from "../hooks/useLinker";
import useSDK from "../hooks/useSDK";
import MetamaskError from "../types/MetamaskError";
import Token from "../types/Token";
import { convertAmount, convertToken, formatBalance, isEmptyValue, parseBalance } from "../utils";
import Screen from "./Screen";

const LiquidityScreen = () => {
    return (
        <Screen>
            <Container>
                <BackgroundImage />
                <Content>
                    <Title text={"Add Liquidity"} />
                    <Text light={true}>Add liquidity to a pool and get LP tokens of the pair.</Text>
                    <AddLiquidity />
                </Content>
                {Platform.OS === "web" && <WebFooter />}
            </Container>
            <LiquiditySubMenu />
        </Screen>
    );
};

const AddLiquidity = () => {
    const state = useAddLiquidityState();
    return (
        <View style={{ marginTop: Spacing.large }}>
            <ModeSelect state={state} />
            <Border />
            <FromTokenSelect state={state} />
            <Border />
            <ToTokenSelect state={state} />
            <Border />
            <FromTokenInput state={state} />
            {state.mode === "zapper" ? (
                <ZapNotice state={state} />
            ) : (
                <>
                    <ItemSeparator />
                    <ToTokenInput state={state} />
                </>
            )}
            <PriceInfo state={state} />
        </View>
    );
};

const ModeSelect = ({ state }: { state: AddLiquidityState }) => {
    const options: Option[] = [
        {
            key: "zapper",
            title: "1-Click Zap",
            description: "Add liquidity with 1 token within a single transaction"
        },
        { key: "normal", title: "Normal", description: "Add liquidity with 2 tokens that have balances" }
    ];
    return (
        <Select
            title={"Mode"}
            options={options}
            option={options.find(option => option.key === state.mode)}
            setOption={option => state.setMode(option?.key as AddLiquidityMode | undefined)}
        />
    );
};

const FromTokenSelect = ({ state }: { state: AddLiquidityState }) => {
    const { customTokens } = useContext(EthersContext);
    if (!state.mode) {
        return <Heading text={"1st Token"} disabled={true} />;
    }
    return (
        <TokenSelect
            title={"1st Token"}
            symbol={state.fromSymbol}
            onChangeSymbol={state.setFromSymbol}
            hidden={token => !customTokens.find(t => t.address === token.address) && token.balance.isZero()}
        />
    );
};

const ToTokenSelect = ({ state }: { state: AddLiquidityState }) => {
    const { customTokens } = useContext(EthersContext);
    if (!state.fromSymbol) {
        return <Heading text={"2nd Token"} disabled={true} />;
    }
    return (
        <View>
            <TokenSelect
                title={"2nd Token"}
                symbol={state.toSymbol}
                onChangeSymbol={state.setToSymbol}
                hidden={token =>
                    token.symbol === state.fromSymbol ||
                    (!customTokens.find(t => t.address === token.address) && token.balance.isZero())
                }
            />
        </View>
    );
};

const FromTokenInput = ({ state }: { state: AddLiquidityState }) => {
    if (!state.fromSymbol || !state.toSymbol) {
        return <Heading text={"Amount of Tokens"} disabled={true} />;
    }
    const onAmountChanged = (newAmount: string) => {
        state.setFromAmount(newAmount);
        if (state.pair && state.fromToken) {
            const fromPrice = state.pair.priceOf(convertToken(state.fromToken));
            const toAmount = fromPrice.quote(convertAmount(state.fromToken, newAmount)).toExact();
            state.setToAmount(isEmptyValue(toAmount) ? "" : toAmount);
        }
    };
    return (
        <TokenInput
            title={state.mode === "zapper" ? "Amount of " + state.fromSymbol : "Amount of Tokens"}
            token={state.fromToken}
            amount={state.fromAmount}
            onAmountChanged={onAmountChanged}
            hideMaxButton={state.loading && !state.pair}
        />
    );
};

const ToTokenInput = ({ state }: { state: AddLiquidityState }) => {
    if (!state.fromSymbol || !state.toSymbol) {
        return <View />;
    }
    const onAmountChanged = (newAmount: string) => {
        state.setToAmount(newAmount);
        if (state.pair && state.toToken) {
            const toPrice = state.pair.priceOf(convertToken(state.toToken));
            const fromAmount = toPrice.quote(convertAmount(state.toToken, newAmount)).toExact();
            state.setFromAmount(isEmptyValue(fromAmount) ? "" : fromAmount);
        }
    };
    return (
        <TokenInput
            token={state.toToken}
            amount={state.toAmount}
            onAmountChanged={onAmountChanged}
            hideMaxButton={state.loading && !state.pair}
        />
    );
};

const ZapNotice = ({ state }: { state: AddLiquidityState }) => {
    if (!state.fromSymbol || !state.toSymbol || !state.pair) return <View />;
    return (
        <Notice
            clear={true}
            text={
                "☘️ 1/2 of " +
                state.fromSymbol +
                " will automatically be swapped to " +
                state.toSymbol +
                " and both tokens will be added to the liquidity in a single transaction."
            }
            style={{ marginTop: Spacing.small }}
        />
    );
};

const PriceInfo = ({ state }: { state: AddLiquidityState }) => {
    if (state.fromToken && state.toToken && !state.loading && !state.pair) {
        return <FirstProviderInfo state={state} />;
    } else {
        return <PairPriceInfo state={state} />;
    }
};

const FirstProviderInfo = ({ state }: { state: AddLiquidityState }) => {
    const { red, green } = useColors();
    const noAmount = isEmptyValue(state.fromAmount) || isEmptyValue(state.toAmount);
    const initialPrice = Fraction.from(
        parseBalance(state.toAmount, state.toToken!.decimals),
        parseBalance(state.fromAmount, state.fromToken!.decimals)
    ).toString(8);
    const zap = state.mode === "zapper";
    return (
        <View>
            {!zap && (
                <InfoBox style={{ marginTop: Spacing.normal }}>
                    <PriceMeta state={state} price={initialPrice} disabled={noAmount} />
                </InfoBox>
            )}
            <Notice
                text={
                    "You are the first liquidity provider.\n" +
                    (zap
                        ? "1-Click Zap is not supported when you're the first provider."
                        : "The ratio of tokens you add will set the price of this pool.")
                }
                color={zap ? red : green}
                style={{ marginTop: Spacing.small }}
            />
        </View>
    );
};

const PairPriceInfo = ({ state }: { state: AddLiquidityState }) => {
    const { fromAmount, toAmount, lpTokenAmount } = useAmountCalculator(state);
    const disabled = isEmptyValue(state.fromAmount) || isEmptyValue(state.toAmount);
    const price =
        state.pair && state.fromToken ? state.pair.priceOf(convertToken(state.fromToken)).toFixed(8) : undefined;
    const symbol = state.fromSymbol + "-" + state.toSymbol;
    return (
        <InfoBox>
            <AmountMeta amount={lpTokenAmount} suffix={symbol} disabled={disabled} />
            <Meta text={fromAmount?.toFixed()} label={state.fromSymbol || "1st Token"} disabled={disabled} />
            <Meta text={toAmount?.toFixed()} label={state.toSymbol || "2nd Token"} disabled={disabled} />
            <PriceMeta state={state} price={price} disabled={!state.fromSymbol || !state.toSymbol} />
            <Controls state={state} />
        </InfoBox>
    );
};

const useAmountCalculator = (state: AddLiquidityState) => {
    const [amount, setAmount] = useState<string>();
    const [fromAmount, setFromAmount] = useState<TokenAmount>();
    const [toAmount, setToAmount] = useState<TokenAmount>();
    const { calculateAmountOfLPTokenMinted } = useSDK();
    useAsyncEffect(async () => {
        if (state.pair && !isEmptyValue(state.fromAmount) && !isEmptyValue(state.toAmount)) {
            const from = new TokenAmount(
                convertToken(state.fromToken!),
                parseBalance(state.fromAmount, state.fromToken!.decimals)
                    .div(state.mode === "zapper" ? 2 : 1)
                    .toString()
            );
            setFromAmount(from);
            const to =
                state.mode === "zapper"
                    ? state.pair.getOutputAmount(from)[0]
                    : convertAmount(state.toToken!, state.toAmount);
            setToAmount(to);
            const minted = await calculateAmountOfLPTokenMinted(state.pair, from, to);
            setAmount(minted ? formatBalance(minted, state.pair.liquidityToken.decimals) : undefined);
        }
    }, [state.pair, state.fromAmount, state.toAmount]);
    return { fromAmount, toAmount, lpTokenAmount: amount };
};

const PriceMeta = ({ state, price, disabled }) => (
    <Meta label={"Ratio"} text={price} suffix={state.toSymbol + " = 1 " + state.fromSymbol} disabled={disabled} />
);

// tslint:disable-next-line:max-func-body-length
const Controls = ({ state }: { state: AddLiquidityState }) => {
    const [error, setError] = useState<MetamaskError>({});
    const { allowed, setAllowed, loading } = useZapTokenAllowance(state.fromToken);
    useAsyncEffect(() => setError({}), [state.fromSymbol, state.toSymbol, state.fromAmount]);
    const zap = state.mode === "zapper";
    const fromApproveRequired = state.fromSymbol !== "ETH" && ((zap && !allowed) || !state.fromTokenAllowed);
    const toApproveRequired = state.toSymbol !== "ETH" && !zap && !state.toTokenAllowed;
    const disabled =
        fromApproveRequired ||
        isEmptyValue(state.fromAmount) ||
        (!zap && (toApproveRequired || isEmptyValue(state.toAmount)));
    return (
        <View style={{ marginTop: Spacing.normal }}>
            {!state.fromToken || !state.toToken || isEmptyValue(state.fromAmount) || isEmptyValue(state.toAmount) ? (
                <SupplyButton state={state} onError={setError} disabled={true} />
            ) : state.loading || loading || !state.pair ? (
                <FetchingButton />
            ) : parseBalance(state.fromAmount, state.fromToken.decimals).gt(state.fromToken.balance) ? (
                <InsufficientBalanceButton symbol={state.fromSymbol} />
            ) : state.mode === "normal" &&
              parseBalance(state.toAmount, state.toToken.decimals).gt(state.toToken.balance) ? (
                <InsufficientBalanceButton symbol={state.toSymbol} />
            ) : (state.fromSymbol === "ETH" && state.toSymbol === "WETH") ||
              (state.fromSymbol === "WETH" && state.toSymbol === "ETH") ? (
                <UnsupportedButton state={state} />
            ) : (
                <>
                    <ApproveButton
                        token={state.fromToken}
                        spender={zap ? ZAP_IN : ROUTER}
                        onSuccess={() => (zap ? setAllowed(true) : state.setFromTokenAllowed(true))}
                        onError={setError}
                        hidden={!fromApproveRequired}
                    />
                    <ApproveButton
                        token={state.toToken}
                        spender={ROUTER}
                        onSuccess={() => state.setToTokenAllowed(true)}
                        onError={setError}
                        hidden={!toApproveRequired}
                    />
                    <SupplyButton state={state} onError={setError} disabled={disabled} />
                </>
            )}
            {error.message && error.code !== 4001 && <ErrorMessage error={error} />}
        </View>
    );
};

const useZapTokenAllowance = (zapToken?: Token) => {
    const { signer, getTokenAllowance } = useContext(EthersContext);
    const [allowed, setAllowed] = useState(false);
    const [loading, setLoading] = useState(false);
    useAsyncEffect(async () => {
        setAllowed(false);
        if (zapToken && signer) {
            setLoading(true);
            try {
                const minAllowance = ethers.BigNumber.from(2)
                    .pow(96)
                    .sub(1);
                if (zapToken.symbol !== "ETH") {
                    const fromAllowance = await getTokenAllowance(zapToken.address, ZAP_IN);
                    setAllowed(ethers.BigNumber.from(fromAllowance).gte(minAllowance));
                }
            } finally {
                setLoading(false);
            }
        }
    }, [zapToken, signer]);
    return { allowed, setAllowed, loading };
};

const SupplyButton = ({
    state,
    onError,
    disabled
}: {
    state: AddLiquidityState;
    onError: (e) => void;
    disabled: boolean;
}) => {
    const goToRemoveLiquidity = useLinker("/liquidity/remove", "RemoveLiquidity");
    const onPress = useCallback(async () => {
        onError({});
        try {
            await state.onAdd();
            goToRemoveLiquidity();
        } catch (e) {
            onError(e);
        }
    }, [state.onAdd, onError]);
    return (
        <Button
            title={state.fromSymbol && state.toSymbol ? "Supply " + state.fromSymbol + "-" + state.toSymbol : "Supply"}
            disabled={disabled}
            loading={state.adding}
            onPress={onPress}
        />
    );
};

export default LiquidityScreen;
