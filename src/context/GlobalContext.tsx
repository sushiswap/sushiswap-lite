import React, { useState } from "react";
import { useColorScheme } from "react-native-appearance";

import * as Localization from "expo-localization";

import AsyncStorage from "@react-native-community/async-storage";

export const GlobalContext = React.createContext({
    load: async () => {},
    clear: async () => {},
    locale: "",
    setLocale: async (_locale: string) => {},
    darkMode: false,
    setDarkMode: async (_darkMode: boolean) => {},
    mnemonic: "",
    setMnemonic: (_mnemonic: string) => {}
});

// tslint:disable-next-line:max-func-body-length
export const GlobalContextProvider = ({ children }) => {
    const colorScheme = useColorScheme();
    const [locale, setLocale] = useState(Localization.locale);
    const [darkMode, setDarkMode] = useState(colorScheme === "dark");
    const [mnemonic, setMnemonic] = useState("");
    return (
        <GlobalContext.Provider
            value={{
                load: async () => {
                    setLocale((await AsyncStorage.getItem("locale")) || Localization.locale);
                    const mode = await AsyncStorage.getItem("dark_mode");
                    setDarkMode(mode === "true");
                    const mne = await AsyncStorage.getItem("mnemonic");
                    if (mne) {
                        setMnemonic(mne);
                    }
                },
                clear: async () => {
                    setDarkMode(false);
                    await AsyncStorage.removeItem("dark_mode");
                    await AsyncStorage.removeItem("mnemonic");
                },
                locale,
                setLocale: async (l: string) => {
                    await AsyncStorage.setItem("locale", l);
                    setLocale(l);
                },
                darkMode,
                setDarkMode: async (mode: boolean) => {
                    await AsyncStorage.setItem("dark_mode", String(mode));
                    setDarkMode(mode);
                },
                mnemonic,
                setMnemonic: async (mne: string) => {
                    await AsyncStorage.setItem("mnemonic", mne);
                    setMnemonic(mne);
                }
            }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const GlobalContextConsumer = GlobalContext.Consumer;
