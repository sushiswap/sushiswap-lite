import React from "react";
import { View } from "react-native";

import { Link } from "@react-navigation/native";
import { Spacing } from "../constants/dimension";
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
            © 2020 Built by{" "}
            <Link to={"https://levx.io"} target={"_blank"}>
                <Text note={true} style={{ textDecorationLine: "underline" }}>
                    LevX
                </Text>
            </Link>
        </Text>
    </View>
);
export default Footer;
