import React, { FC } from "react";
import { Platform, RefreshControl, SafeAreaView, ScrollView, ViewProps } from "react-native";

import useColors from "../hooks/useColors";

export interface ContainerProps extends ViewProps {
    refreshing?: boolean;
    onRefresh?: () => void;
}

const Container: FC<ContainerProps> = props => {
    const { primary } = useColors();
    return Platform.select({
        web: (
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
        default: (
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView
                    {...props}
                    refreshControl={
                        <RefreshControl
                            colors={[primary]}
                            tintColor={primary}
                            refreshing={props.refreshing || false}
                            onRefresh={props.onRefresh}
                        />
                    }
                />
            </SafeAreaView>
        )
    });
};

export default Container;
