import React, { useContext } from "react";
import { Platform } from "react-native";

import useAsyncEffect from "use-async-effect";
import { GlobalContext } from "../context/GlobalContext";
import AppScreens from "./app";
import WebScreens from "./web";

const Screens = () => {
    const { load } = useContext(GlobalContext);
    useAsyncEffect(load, []);
    return Platform.select({
        web: <WebScreens />,
        default: <AppScreens />
    });
};

export default Screens;
