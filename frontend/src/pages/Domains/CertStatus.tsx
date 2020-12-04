import React from "react";
import { Certificate } from "types/certificate";
import { PendingBadge } from "widgets/Badge";
import { FlexRowItemCenterBox } from "widgets/Box";
import { SuccessColorText, WarningColorText } from "widgets/Text";

export const CertStatus = ({ cert }: { cert: Certificate }) => {
  if (cert.ready === "True") {
    return (
      <FlexRowItemCenterBox>
        <FlexRowItemCenterBox>
          <SuccessColorText>Normal</SuccessColorText>
        </FlexRowItemCenterBox>
      </FlexRowItemCenterBox>
    );
  } else {
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
  }
};
