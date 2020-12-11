import React from "react";

import BackgroundImage from "../components/BackgroundImage";
import Container from "../components/Container";
import Content from "../components/Content";
import Title from "../components/Title";
import WebSubMenu from "../components/web/WebSubMenu";
import useTranslation from "../hooks/useTranslation";
import Screen from "./Screen";

const EmptyScreen = () => {
    const t = useTranslation();
    return (
        <Screen>
            <Container>
                <BackgroundImage />
                <Content>
                    <Title text={t("loading")} />
                </Content>
            </Container>
            <WebSubMenu items={[]} />
        </Screen>
    );
};

export default EmptyScreen;
