import React from "react";
import { View } from "react-native";

import { Spacing } from "../constants/dimension";
import useLinker from "../hooks/useLinker";
import useTranslation from "../hooks/useTranslation";
import Notice from "./Notice";

const ExperimentalNotice = (props: { contractURL: string }) => {
    const t = useTranslation();
    const onPressContract = useLinker(props.contractURL, "", "_blank");
    return (
        <View style={{ marginVertical: Spacing.tiny }}>
            <Notice
                text={t("experimental-notice")}
                color={"orange"}
                buttonText={"View Contract"}
                onPressButton={onPressContract}
            />
        </View>
    );
};

export default ExperimentalNotice;
