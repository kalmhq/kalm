import React from "react";
import Immutable from "immutable";
import { select } from "@storybook/addon-knobs";
import { MTableBodyRow } from "material-table";
import { KTable } from "widgets/Table";
import { ImmutableMap } from "typings";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { FlexRowItemCenterBox } from "widgets/Box";
import { ErrorBadge, PendingBadge, SuccessBadge } from "widgets/Badge";
import { DeleteIcon, EditIcon } from "widgets/Icon";
import { action } from "@storybook/addon-actions";

export default {
  title: "Widgets/Box",
  component: FlexRowItemCenterBox,
};

export const FlexRowItemCenterBoxExample = () => (
  <FlexRowItemCenterBox style={{ border: "1px solid red" }}>
    <ErrorBadge /> 2
  </FlexRowItemCenterBox>
);

interface CertificateContent {
  name: string;
  isSelfManaged: boolean;
  selfManagedCertContent: string;
  selfManagedCertPrivateKey: string;
  httpsCertIssuer: string;
  domains: Immutable.List<string>;
  ready: string;
  reason: string;
}

type Certificate = ImmutableMap<CertificateContent>;

interface RowData extends Certificate {
  ready: boolean;
}

const renderStatus = (rowData: RowData) => {
  const ready = rowData.get("ready");

  if (ready === "True") {
    return (
      <FlexRowItemCenterBox>
        <FlexRowItemCenterBox mr={1} style={{ border: "1px solid red" }}>
          <SuccessBadge />
        </FlexRowItemCenterBox>
        <FlexRowItemCenterBox style={{ border: "1px solid red" }}>Normal</FlexRowItemCenterBox>
      </FlexRowItemCenterBox>
    );
  } else if (!!rowData.get("reason")) {
    return (
      <FlexRowItemCenterBox style={{ border: "1px solid red" }}>
        <FlexRowItemCenterBox mr={1} style={{ border: "1px solid red" }}>
          <PendingBadge />
        </FlexRowItemCenterBox>
        <FlexRowItemCenterBox style={{ border: "1px solid red" }}>{rowData.get("reason")}</FlexRowItemCenterBox>
      </FlexRowItemCenterBox>
    );
  } else {
    return <PendingBadge />;
  }
};

const renderName = (rowData: RowData) => {
  return rowData.get("name");
};

const renderDomains = (rowData: RowData) => {
  return (
    <>
      {rowData.get("domains")?.map((domain) => {
        return <div key={domain}>{domain}</div>;
      })}
    </>
  );
};

const renderMoreActions = (rowData: RowData) => {
  return (
    <>
      {rowData.get("isSelfManaged") && (
        <IconButtonWithTooltip tooltipTitle="Edit" aria-label="edit" size="small" onClick={action("Edit")}>
          <EditIcon />
        </IconButtonWithTooltip>
      )}
      <IconButtonWithTooltip tooltipTitle="Delete" aria-label="delete" size="small" onClick={action("Delete")}>
        <DeleteIcon />
      </IconButtonWithTooltip>
    </>
  );
};

const getColumns = () => {
  const columns = [
    // @ts-ignore
    {
      title: "Name",
      field: "name",
      sorting: false,
      render: renderName,
    },
    {
      title: "Domains",
      field: "domains",
      sorting: false,
      render: renderDomains,
    },
    {
      title: "Status",
      field: "status",
      sorting: false,
      render: renderStatus,
    },
    {
      title: "Type",
      field: "isSelfManaged",
      sorting: false,
      render: renderType,
    },
    {
      title: "Actions",
      field: "moreAction",
      sorting: false,
      searchable: false,
      render: renderMoreActions,
    },
  ];

  return columns;
};
const renderType = (rowData: RowData) => {
  return rowData.get("isSelfManaged") ? "UPLOADED" : "MANAGED";
};

const getCertifiate = () => {
  const domains = Immutable.List(["kalm.dev"]);
  return Immutable.Map({
    name: "Certificates for Domains",
    domains: domains,
    isSelfManaged: true,
    ready: select("Ready status", ["True", "False"], "True", "Certificate"),
    reason: select("Reason", ["Pending Connect...", "Waiting Provider"], "Pending", "Certificate"),
  }) as Certificate;
};

const getData = () => {
  const data: RowData[] = [];
  data.push(getCertifiate() as RowData);
  return data;
};

export const FlexRowItemCenterBoxWithTable = () => {
  return (
    <KTable
      options={{
        paging: false,
      }}
      components={{
        Row: (props: any) => (
          <MTableBodyRow tutorial-anchor-id={"applications-list-item-" + props.data.get("name")} {...props} />
        ),
      }}
      // @ts-ignore
      columns={getColumns()}
      data={getData()}
      title=""
    />
  );
};
