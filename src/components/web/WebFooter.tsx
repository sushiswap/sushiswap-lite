import React from "react";
import { Image, TouchableHighlight, View } from "react-native";

import Constants from "expo-constants";

import { Spacing } from "../../constants/dimension";
import useLinker from "../../hooks/useLinker";
import Column from "../Column";
import SocialIcons from "../SocialIcons";
import Text from "../Text";

const WebFooter = () => {
    const onPressAlchemy = useLinker(
        "https://dashboard.alchemyapi.io/signup?referral=429fb682-0d85-40ab-ad88-daf847cf7c63",
        "",
        "_blank"
    );
    return (
        <Column noTopMargin={true}>
            <View
                style={{
                    width: "100%",
                    padding: Spacing.normal,
                    alignItems: "center"
                }}>
                <SocialIcons />
                <TouchableHighlight onPress={onPressAlchemy}>
                    <Image
                        source={require("../../../assets/alchemy.png")}
                        style={{ width: 188, height: 40, marginTop: Spacing.tiny }}
                    />
                </TouchableHighlight>
                <Text note={true} style={{ marginTop: Spacing.tiny }}>
                    Built with ❤️ by SushiSwap (v{Constants.manifest.version})
                </Text>
            </View>
        </Column>
    );
};

export default WebFooter;
