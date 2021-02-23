import React, { useContext } from "react";
import { Image } from "react-native";

import { StatusBar } from "expo-status-bar";

import { HEADER_HEIGHT, Spacing } from "../../constants/dimension";
import { GlobalContext } from "../../context/GlobalContext";
import useColors from "../../hooks/useColors";
import FlexView from "../FlexView";

const AppHeader = () => {
    const { primary, header, borderDark } = useColors();
    return (
        <FlexView
            style={{
                width: "100%",
                height: HEADER_HEIGHT,
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: Spacing.small,
                backgroundColor: header,
                borderBottomWidth: 1,
                borderColor: borderDark
            }}>
            <Title />
            {/*{IS_DESKTOP ? <Menu /> : <MenuIcon onExpand={props.onExpandMenu} />}*/}
            <StatusBar translucent={false} backgroundColor={primary} />
        </FlexView>
    );
};

export const Title = () => {
    const { darkMode } = useContext(GlobalContext);
    const source = darkMode ? require("../../../assets/logo-dark.png") : require("../../../assets/logo-light.png");
    return <Image source={source} style={{ width: 256, height: 45 }} />;
};

export default AppHeader;
