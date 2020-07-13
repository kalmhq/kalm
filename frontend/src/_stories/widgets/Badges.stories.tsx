import React from "react";
import { text } from "@storybook/addon-knobs";
import { SuccessBadge, PendingBadge, WarningBadge, ErrorBadge, UnknownBadge } from "widgets/Badge";

export default {
  title: "Widgets/Badges",
  component: SuccessBadge,
};

export const SuccessBadgeExample = () => <SuccessBadge text={text("SuccessLabel", "Success 1", "Badge")} />;

export const PendingBadgeExample = () => <PendingBadge text={text("PendingLabel", "Pending 2", "Badge")} />;

export const WarningBadgeExample = () => <WarningBadge text={text("WarningLabel", "Warning 3", "Badge")} />;

export const ErrorBadgeExample = () => <ErrorBadge text={text("ErrorLabel", "Error 4", "Badge")} />;

export const UnknownBadgeExample = () => <UnknownBadge text={text("UnknownLabel", "Unknown 5", "Badge")} />;
