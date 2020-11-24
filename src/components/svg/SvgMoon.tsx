import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

function SvgMoon(props: SvgProps) {
    return (
        <Svg
            viewBox="0 0 520 520"
            fillRule="evenodd"
            clipRule="evenodd"
            strokeLinejoin="round"
            strokeMiterlimit={2}
            {...props}>
            <Path fill="none" d="M0 0h519.851v519.851H0z" />
            <Path
                d="M248.7 44.15c-33.5 29.48-54.6 72.67-54.6 120.76 0 88.79 72 160.88 160.8 160.88 48.1 0 91.3-21.15 120.8-54.64-5.9 114.05-100.3 204.84-215.8 204.84-119.2 0-216.1-96.81-216.1-216.06C43.8 144.44 134.6 50 248.7 44.15z"
                fill="#fff"
            />
        </Svg>
    );
}

export default SvgMoon;
