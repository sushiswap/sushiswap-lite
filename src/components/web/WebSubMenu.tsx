import React, { FC } from "react";
import { View } from "react-native";
import { Link, useRouteMatch } from "react-router-dom";

import { HEADER_WIDTH, IS_DESKTOP, Spacing, SUB_MENU_HEIGHT } from "../../constants/dimension";
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
                title: "New Order",
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
            }
        ]}
    />
);

export const MigrateSubMenu = () => (
    <WebSubMenu
        items={[
            {
                title: "Migrate Liquidity",
                path: "/migrate"
            }
        ]}
    />
);

export const StakingSubMenu = () => (
    <WebSubMenu
        items={[
            {
                title: "Stake",
                path: "/staking"
            },
            {
                title: "Unstake",
                path: "/staking/unstake"
            }
        ]}
    />
);

export const FarmingSubMenu = () => (
    <WebSubMenu
        items={[
            {
                title: "Plant Seeds",
                path: "/farming/start"
            },
            {
                title: "Harvest SUSHI",
                path: "/farming/harvest"
            }
        ]}
    />
);

const WebSubMenu: FC<WebSubMenuProps> = props => {
    const { submenu } = useColors();
    return (
        <View
            style={{
                position: "absolute",
                top: 0,
                height: SUB_MENU_HEIGHT,
                width: "100%",
                backgroundColor: submenu
            }}>
            <FlexView
                style={{
                    width: IS_DESKTOP ? HEADER_WIDTH : "100%",
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
    const { accent, textLight } = useColors();
    const match = useRouteMatch(path);
    const active = match?.isExact;
    return (
        <Link
            to={path}
            style={{
                marginLeft: Spacing.small,
                paddingTop: Spacing.tiny,
                paddingBottom: Spacing.tiny,
                textDecoration: "none"
            }}>
            <Text
                fontWeight={active ? "regular" : "light"}
                style={{
                    fontSize: 13,
                    color: active ? accent : textLight
                }}>
                {title}
            </Text>
        </Link>
    );
};

export default WebSubMenu;
