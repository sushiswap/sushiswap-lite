import React from "react";
import { View } from "react-native";

import { Link as NativeLink } from "@react-navigation/native";
import { Spacing } from "../constants/dimension";
import FlexView from "./FlexView";
import Text from "./Text";

const Footer = () => (
    <View
        // @ts-ignore
        style={{
            position: "fixed",
            bottom: 0,
            width: "100%",
            margin: Spacing.content
        }}>
        <Text note={true}>
            © 2020 Built by <Link to={"https://levx.io"} text={"Team LevX"} />
        </Text>
        <FlexView style={{ marginLeft: Spacing.small }}>
            <Link to={"https://github.com/lev-x"} text={"GitHub"} />
            <Link to={"https://twitter.com/LevxApp"} text={"Twitter"} />
            <Link to={"mailto:team@levx.io"} text={"Email"} />
        </FlexView>
    </View>
);

const Link = ({ to, text }) => (
    <NativeLink to={to} target={"_blank"}>
        <Text note={true} style={{ textDecorationLine: "underline", marginRight: 8 }}>
            {text}
        </Text>
    </NativeLink>
);

export default Footer;
