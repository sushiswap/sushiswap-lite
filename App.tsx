/* tslint:disable:ordered-imports */
import "./globals";
import React from "react";

import { OpenSans_300Light, OpenSans_400Regular, OpenSans_600SemiBold } from "@expo-google-fonts/open-sans";
import { AppLoading } from "expo";
import { useFonts } from "expo-font";

import { ContextProvider } from "./src/context";
import { Screens } from "./src/screens";
import { YellowBox } from "react-native";
import RollbarErrorTracking from './src/utils/rollbar'
import { ErrorBoundary } from 'react-error-boundary'

if (__DEV__) {
    YellowBox.ignoreWarnings(["Setting a timer", "VirtualizedLists should never be nested"]);
}

const ErrorFallback = (any: any) => {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{any.error.message}</pre>
    </div>
  )
}

const rollBarErrorHandler = (error: Error, info: { componentStack: string }) => {
  RollbarErrorTracking.logErrorInfo(info)
  RollbarErrorTracking.logErrorInRollbar(error)
}

const App = () => {
    const [fontsLoaded] = useFonts({
        light: OpenSans_300Light,
        regular: OpenSans_400Regular,
        bold: OpenSans_600SemiBold
    });
    if (!fontsLoaded) {
        return <AppLoading />;
    }
    return (
      <ErrorBoundary FallbackComponent={ErrorFallback} onError={rollBarErrorHandler}>
        <ContextProvider>
            <Screens />
        </ContextProvider>
      </ErrorBoundary>
    );
};

export default App;
