import React from "react";
import { Domain } from "types/domains";
import { PendingBadge } from "widgets/Badge";
import { FlexRowItemCenterBox } from "widgets/Box";
import { SuccessColorText, WarningColorText } from "widgets/Text";

export const DomainTxtRecordStatus = ({ domain }: { domain: Domain }) => {
  if (!domain.txtReadyToCheck && domain.txtStatus === "pending") {
    return <span>Waiting for your config</span>;
  }

  if (domain.txtStatus === "ready") {
    // why the ready field is a string value ?????
    return (
      <FlexRowItemCenterBox>
        <FlexRowItemCenterBox>
          <SuccessColorText>Normal</SuccessColorText>
        </FlexRowItemCenterBox>
      </FlexRowItemCenterBox>
    );
  } else if (domain.txtStatus === "pending") {
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
