import React from "react";
import { PendingBadge } from "widgets/Badge";
import { FlexRowItemCenterBox } from "widgets/Box";
import { SuccessColorText, WarningColorText } from "widgets/Text";

export const DomainStatus = ({ status }: { status: "pending" | "ready" }) => {
  if (status === "ready") {
    // why the ready field is a string value ?????
    return (
      <FlexRowItemCenterBox>
        <FlexRowItemCenterBox>
          <SuccessColorText>Normal</SuccessColorText>
        </FlexRowItemCenterBox>
      </FlexRowItemCenterBox>
    );
  } else if (status === "pending") {
    return (
      <FlexRowItemCenterBox>
        <FlexRowItemCenterBox mr={1}>
          <PendingBadge />
        </FlexRowItemCenterBox>
        <FlexRowItemCenterBox>
          <WarningColorText>Pending</WarningColorText>
        </FlexRowItemCenterBox>
      </FlexRowItemCenterBox>
    );
  } else {
    return <PendingBadge />;
  }
};
