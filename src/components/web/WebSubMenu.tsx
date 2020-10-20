import React, { FC } from "react";
import { View } from "react-native";
import { Link, useRouteMatch } from "react-router-dom";

import { HEADER_WIDTH, Spacing, SUB_MENU_HEIGHT } from "../../constants/dimension";
import useColors from "../../hooks/useColors";
import FlexView from "../FlexView";
import Text from "../Text";

export interface WebSubMenuItem {
    title: string;
    path: string;
}

export interface WebSubMenuProps {
    items: WebSubMenuItem[];
}

export const SwapSubMenu = () => (
    <WebSubMenu
        items={[
            {
                title: "Swap Tokens",
                path: "/swap"
            },
            {
                title: "My Orders",
                path: "/swap/my-orders"
            }
        ]}
    />
);

export const LiquiditySubMenu = () => (
    <WebSubMenu
        items={[
            {
                title: "Add Liquidity",
                path: "/liquidity"
            },
            {
                title: "Remove Liquidity",
                path: "/liquidity/remove"
            },
            {
                title: "Migrate",
                path: "/liquidity/migrate"
            }
        ]}
    />
);

const WebSubMenu: FC<WebSubMenuProps> = props => {
    const { textMedium } = useColors();
    return (
        <View
            style={{
                height: SUB_MENU_HEIGHT,
                width: "100%",
                backgroundColor: textMedium
            }}>
            <FlexView
                style={{
                    width: HEADER_WIDTH,
                    marginTop: 2,
                    paddingHorizontal: Spacing.normal,
                    alignSelf: "center",
                    justifyContent: "flex-end",
                    alignItems: "center"
                }}>
                {props.items.map(item => (
                    <MenuItem key={item.path} {...item} />
                ))}
            </FlexView>
        </View>
    );
};

const MenuItem = ({ title, path }) => {
    const { background, placeholder } = useColors();
    const match = useRouteMatch(path);
    const active = match?.isExact;
    return (
        <Link to={path} style={{ marginLeft: Spacing.tiny, padding: Spacing.tiny, textDecoration: "none" }}>
            <Text
                fontWeight={active ? "regular" : "light"}
                style={{
                    fontSize: 13,
                    color: active ? background : placeholder
                }}>
                {title}
            </Text>
        </Link>
    );
};

export default WebSubMenu;
