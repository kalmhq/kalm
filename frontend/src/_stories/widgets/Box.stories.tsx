import { action } from "@storybook/addon-actions";
import { select } from "@storybook/addon-knobs";
import React from "react";
import { ErrorBadge, PendingBadge, SuccessBadge } from "widgets/Badge";
import { FlexRowItemCenterBox } from "widgets/Box";
import { DeleteIcon, EditIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { KRTable } from "widgets/KRTable";

export default {
  title: "Widgets/Box",
  component: FlexRowItemCenterBox,
};

export const FlexRowItemCenterBoxExample = () => (
  <FlexRowItemCenterBox style={{ border: "1px solid red" }}>
    <ErrorBadge /> 2
  </FlexRowItemCenterBox>
);

interface Certificate {
  name: string;
  isSelfManaged: boolean;
  selfManagedCertContent: string;
  selfManagedCertPrivateKey: string;
  httpsCertIssuer: string;
  domains: string[];
  ready: string;
  reason: string;
}

const renderStatus = (rowData: Certificate) => {
  const ready = rowData.ready;

  if (ready === "True") {
    return (
      <FlexRowItemCenterBox>
        <FlexRowItemCenterBox mr={1} style={{ border: "1px solid red" }}>
          <SuccessBadge />
        </FlexRowItemCenterBox>
        <FlexRowItemCenterBox style={{ border: "1px solid red" }}>Normal</FlexRowItemCenterBox>
      </FlexRowItemCenterBox>
    );
  } else if (!!rowData.reason) {
    return (
      <FlexRowItemCenterBox style={{ border: "1px solid red" }}>
        <FlexRowItemCenterBox mr={1} style={{ border: "1px solid red" }}>
          <PendingBadge />
        </FlexRowItemCenterBox>
        <FlexRowItemCenterBox style={{ border: "1px solid red" }}>{rowData.reason}</FlexRowItemCenterBox>
      </FlexRowItemCenterBox>
    );
  } else {
    return <PendingBadge />;
  }
};

const renderName = (rowData: Certificate) => {
  return rowData.name;
};

const renderDomains = (rowData: Certificate) => {
  return (
    <>
      {rowData.domains?.map((domain) => {
        return <div key={domain}>{domain}</div>;
      })}
    </>
  );
};

const renderMoreActions = (rowData: Certificate) => {
  return (
    <>
      {rowData.isSelfManaged && (
        <IconButtonWithTooltip tooltipTitle="Edit" aria-label="edit" onClick={action("Edit")}>
          <EditIcon />
        </IconButtonWithTooltip>
      )}
      <IconButtonWithTooltip tooltipTitle="Delete" aria-label="delete" onClick={action("Delete")}>
        <DeleteIcon />
      </IconButtonWithTooltip>
    </>
  );
};

const renderType = (rowData: Certificate) => {
  return rowData.isSelfManaged ? "UPLOADED" : "MANAGED";
};

const getCertifiate = () => {
  const domains = ["kalm.dev"];
  return {
    name: "Certificates for Domains",
    domains: domains,
    isSelfManaged: true,
    ready: select("Ready status", ["True", "False"], "True", "Certificate"),
    reason: select("Reason", ["Pending Connect...", "Waiting Provider"], "Pending", "Certificate"),
  } as any;
};

const getKRTableColumns = () => {
  return [
    {
      Header: "Name",
      accessor: "name",
    },
    {
      Header: "Domains",
      accessor: "domains",
    },
    {
      Header: "Status",
      accessor: "status",
    },
    {
      Header: "Type",
      accessor: "isSelfManaged",
    },
    {
      Header: "Actions",
      accessor: "moreAction",
    },
  ];
};

const getKRTableData = () => {
  const data: any[] = [];

  const rowData = getCertifiate() as Certificate;

  data.push({
    name: renderName(rowData),
    domains: renderDomains(rowData),
    status: renderStatus(rowData),
    isSelfManaged: renderType(rowData),
    moreAction: renderMoreActions(rowData),
  });

  return data;
};

export const FlexRowItemCenterBoxWithTable = () => {
  return <KRTable columns={getKRTableColumns()} data={getKRTableData()} />;
};
