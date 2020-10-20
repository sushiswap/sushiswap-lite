import React from "react";
import { ActivityIndicator } from "react-native";

import { Spacing } from "../constants/dimension";

const Loading = () => <ActivityIndicator size={"large"} style={{ marginVertical: Spacing.large }} />;

export default Loading;
