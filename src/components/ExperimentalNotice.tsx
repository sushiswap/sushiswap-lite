import React from "react";
import { View } from "react-native";

import { Spacing } from "../constants/dimension";
import useLinker from "../hooks/useLinker";
import Notice from "./Notice";

const ExperimentalNotice = (props: { contractURL: string }) => {
    const onPressContract = useLinker(props.contractURL, "", "_blank");
    return (
        <View style={{ marginVertical: Spacing.tiny }}>
            <Notice
                text={
                    "This feature is in beta and contracts are unaudited. Read the contract yourself and use it at your own risk."
                }
                color={"orange"}
                buttonText={"View Contract"}
                onPressButton={onPressContract}
            />
        </View>
    );
};

export default ExperimentalNotice;
