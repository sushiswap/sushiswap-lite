import React, { FC } from "react";
import { Platform, SafeAreaView, ScrollView, ViewProps } from "react-native";

import { HEADER_HEIGHT } from "../constants/dimension";
import useColors from "../hooks/useColors";

export type ContainerProps = ViewProps;

// tslint:disable-next-line:max-func-body-length
const Container: FC<ContainerProps> = props => {
    const { background } = useColors();
    const Universal = Platform.select({
        web: () => (
            <ScrollView
                contentContainerStyle={{ flex: 1 }}
                style={[
                    {
                        backgroundColor: background,
                        marginTop: HEADER_HEIGHT
                    },
                    props.style
                ]}
                {...props}
            />
        ),
        default: () => (
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView
                    {...props}
                    style={[
                        {
                            backgroundColor: background
                        },
                        props.style
                    ]}
                />
            </SafeAreaView>
        )
    });
    return <Universal />;
};

export default Container;
