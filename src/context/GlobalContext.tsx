import React, { useState } from "react";
import { useColorScheme } from "react-native-appearance";

import { DeviceType, getDeviceTypeAsync } from "expo-device";

import AsyncStorage from "@react-native-community/async-storage";
import useAsyncEffect from "use-async-effect";

export const GlobalContext = React.createContext({
    load: async () => {},
    clear: async () => {},
    deviceType: undefined as DeviceType | undefined,
    darkMode: false as boolean,
    setDarkMode: async darkMode => {},
    mnemonic: "",
    setMnemonic: (mnemonic: string) => {}
});

// tslint:disable-next-line:max-func-body-length
export const GlobalContextProvider = ({ children }) => {
    const colorScheme = useColorScheme();
    const [deviceType, setDeviceType] = useState<DeviceType>();
    const [darkMode, setDarkMode] = useState(colorScheme === "dark");
    const [mnemonic, setMnemonic] = useState("");
    useAsyncEffect(async () => {
        setDeviceType(await getDeviceTypeAsync());
    }, []);
    return (
        <GlobalContext.Provider
            value={{
                load: async () => {
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
                deviceType,
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
