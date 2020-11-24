import React from "react";

import BackgroundImage from "../components/BackgroundImage";
import Container from "../components/Container";
import Content from "../components/Content";
import Title from "../components/Title";
import WebSubMenu from "../components/web/WebSubMenu";
import Screen from "./Screen";

const EmptyScreen = () => {
    return (
        <Screen>
            <Container>
                <BackgroundImage />
                <Content>
                    <Title text={"Loading..."} />
                </Content>
            </Container>
            <WebSubMenu items={[]} />
        </Screen>
    );
};

export default EmptyScreen;
