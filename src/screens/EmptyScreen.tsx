import React from "react";
import { View } from "react-native";

import Container from "../components/Container";
import Content from "../components/Content";
import Loading from "../components/Loading";
import WebHeader from "../components/web/WebHeader";
import WebSubMenu from "../components/web/WebSubMenu";
import useColors from "../hooks/useColors";
import Screen from "./Screen";

const EmptyScreen = () => {
    const { background } = useColors();
    return (
        <View style={{ width: "100%", height: "100%", backgroundColor: background }}>
            <Screen>
                <WebSubMenu items={[]} />
                <Container>
                    <Content>
                        <Loading />
                    </Content>
                </Container>
            </Screen>
            <WebHeader />
        </View>
    );
};

export default EmptyScreen;
