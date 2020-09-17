import React, { FC, useCallback, useState } from "react";
import { Image, TouchableHighlight, View } from "react-native";
import { Hoverable } from "react-native-web-hover";

import { useNavigation } from "@react-navigation/native";
import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import ApproveButton from "../components/ApproveButton";
import Button from "../components/Button";
import CloseIcon from "../components/CloseIcon";
import Column from "../components/Column";
import Container from "../components/Container";
import Content from "../components/Content";
import ErrorMessage from "../components/ErrorMessage";
import FetchingButton from "../components/FetchingButton";
import FlexView from "../components/FlexView";
import InsufficientBalanceButton from "../components/InsufficientBalanceButton";
import LPTokenSelect, { LPTokenItemProps } from "../components/LPTokenSelect";
import Meta from "../components/Meta";
import Notice from "../components/Notice";
import SelectIcon from "../components/SelectIcon";
import Text from "../components/Text";
import TokenInput from "../components/TokenInput";
import { Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import useFarmingState, { FarmingState } from "../hooks/useFarmingState";
import { MASTER_CHEF } from "../hooks/useSDK";
import LPToken from "../types/LPToken";
import MetamaskError from "../types/MetamaskError";
import { formatBalance, isEmptyValue, parseBalance } from "../utils";
import Screen from "./Screen";

const FarmingScreen = () => {
    return (
        <Screen>
            <Container>
                <Content>
                    <View style={{ alignItems: "center", marginBottom: Spacing.large }}>
                        <StartFarming />
                    </View>
                </Content>
            </Container>
        </Screen>
    );
};

const StartFarming = () => {
    const state = useFarmingState();
    return (
        <>
            <Column>
                <Text h4={true} style={{ textAlign: "center" }}>
                    🌾 Start Farming
                </Text>
            </Column>
            <LPTokenSelect
                state={state}
                title={"1. Select the pool you want to FARM from:"}
                emptyText={"Temporarily unable to load LP tokens."}
                Item={TokenItem}
            />
            <TokenInput
                title={"2. How many tokens would you DEPOSIT?"}
                token={state.selectedLPToken}
                hidden={!state.selectedLPToken || state.selectedLPToken.balance.isZero()}
                amount={state.amount}
                onAmountChanged={state.setAmount}
            />
            <DepositInfo state={state} />
            <AddLiquidityNotice token={state.selectedLPToken} />
            <Controls state={state} />
        </>
    );
};

const TokenItem: FC<LPTokenItemProps> = props => {
    const { background, backgroundHovered, textMedium } = useColors();
    const amount = formatBalance(props.token.totalDeposited || "0", props.token.decimals, 4);
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
                                <Text style={{ textAlign: "right", fontSize: 15 }}>Total Deposited</Text>
                                <Text light={true} style={{ textAlign: "right", fontSize: 22, color: textMedium }}>
                                    {amount}
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

const DepositInfo = ({ state }: { state: FarmingState }) => {
    if (!state.selectedLPToken || state.selectedLPToken.balance.isZero()) {
        return <Column noTopMargin={true} />;
    }
    const balance = formatBalance(state.selectedLPToken.balance, state.selectedLPToken.decimals);
    const sushiReward =
        state.expectedSushiRewardPerBlock && state.amount
            ? formatBalance(
                  state.expectedSushiRewardPerBlock
                      .mul(parseBalance(state.amount, 18))
                      .div(ethers.BigNumber.from(10).pow(18)),
                  18
              )
            : null;
    return (
        <Column noTopMargin={true}>
            <Meta label={"My Balance"} text={balance} />
            {!isEmptyValue(state.amount) && <Meta label={"SUSHI Reward per Block"} text={sushiReward || "…"} />}
        </Column>
    );
};

const AddLiquidityNotice = ({ token }: { token?: LPToken }) => {
    if (!token || !token.balance.isZero()) {
        return <Column noTopMargin={true} />;
    }
    const { navigate } = useNavigation();
    const onPress = useCallback(() => {
        navigate("Liquidity");
    }, [navigate]);
    return (
        <Column noTopMargin={true}>
            <Notice
                text={
                    "You need some " +
                    token.tokenA.symbol +
                    "-" +
                    token.tokenB.symbol +
                    " LP token to start farming.\n" +
                    "Add liquidity to get the LP token."
                }
            />
            <Button
                type={"outline"}
                title={"Add Liquidity"}
                containerStyle={{ marginTop: Spacing.small }}
                onPress={onPress}
            />
        </Column>
    );
};

// tslint:disable-next-line:max-func-body-length
const Controls = ({ state }: { state: FarmingState }) => {
    const [error, setError] = useState<MetamaskError>({});
    useAsyncEffect(() => setError({}), [state.selectedLPToken]);
    if (!state.selectedLPToken) {
        return <Column noTopMargin={true} />;
    }
    const approveRequired = !state.selectedLPTokenAllowed;
    const disabled = approveRequired || isEmptyValue(state.amount);
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
                        spender={MASTER_CHEF}
                        onSuccess={() => state.setSelectedLPTokenAllowed(true)}
                        onError={setError}
                        hidden={!approveRequired}
                    />
                    <DepositButton state={state} onError={setError} disabled={disabled} />
                </>
            )}
            {error.message && error.code !== 4001 && <ErrorMessage error={error} />}
        </Column>
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
    return <Button size={"large"} title={"Remove"} disabled={disabled} loading={state.depositing} onPress={onPress} />;
};

export default FarmingScreen;
