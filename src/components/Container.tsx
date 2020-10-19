import React, { FC } from "react";
import { Platform, SafeAreaView, ScrollView, ViewProps } from "react-native";

export type ContainerProps = ViewProps;

// tslint:disable-next-line:max-func-body-length
const Container: FC<ContainerProps> = props => {
    const Universal = Platform.select({
        web: () => (
            <ScrollView
                contentContainerStyle={{ flex: 1 }}
                style={[
                    {
                        flex: 1
                    },
                    props.style
                ]}
                {...props}
            />
        ),
        default: () => (
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView {...props} />
            </SafeAreaView>
        )
    });
    return <Universal />;
};

export default Container;
