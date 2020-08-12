import { Box, Button, createStyles, Theme, Typography, WithStyles, withStyles } from "@material-ui/core";
import { indigo } from "@material-ui/core/colors";
import { deleteCertificateAction } from "actions/certificate";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { Certificate } from "types/certificate";
import { formatDate } from "utils/date";
import sc from "utils/stringConstants";
import { customSearchForImmutable } from "utils/tableSearch";
import { PendingBadge, SuccessBadge } from "widgets/Badge";
import { FlexRowItemCenterBox } from "widgets/Box";
import { CustomizedButton } from "widgets/Button";
import DomainStatus from "widgets/DomainStatus";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { EditIcon, KalmCertificatesIcon } from "widgets/Icon";
import { IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { InfoBox } from "widgets/InfoBox";
import { KRTable } from "widgets/KRTable";
import { Loading } from "widgets/Loading";
import { CertificateDataWrapper, WithCertificatesDataProps } from "./DataWrapper";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {
    isLoading: state.get("certificates").get("isLoading"),
    isFirstLoaded: state.get("certificates").get("isFirstLoaded"),
    certificates: state.get("certificates").get("certificates"),
  };
};

interface Props
  extends WithCertificatesDataProps,
    WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    TDispatchProp {}

interface State {
  isDeleteConfirmDialogOpen: boolean;
  deletingCertificate: Certificate | null;
}

interface RowData extends Certificate {
  index: number;
}

class CertificateListPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isDeleteConfirmDialogOpen: false,
      deletingCertificate: null,
    };
  }

  private renderName = (rowData: RowData) => {
    return <Typography variant={"subtitle2"}>{rowData.get("name")}</Typography>;
  };

  private renderDomains = (rowData: RowData) => {
    return (
      <>
        {rowData.get("domains")?.map((domain) => {
          return (
            <FlexRowItemCenterBox key={domain}>
              <DomainStatus mr={1} domain={domain} />
              {domain}
            </FlexRowItemCenterBox>
          );
        })}
      </>
    );
  };

  private renderMoreActions = (rowData: RowData) => {
    return (
      <>
        {rowData.get("isSelfManaged") && (
          <IconLinkWithToolTip tooltipTitle="Edit" aria-label="edit" to={`/certificates/${rowData.get("name")}/edit`}>
            <EditIcon />
          </IconLinkWithToolTip>
        )}
        <DeleteButtonWithConfirmPopover
          popupId="delete-certificate-popup"
          popupTitle="DELETE CERTIFICATE?"
          confirmedAction={() => this.confirmDelete(rowData)}
        />
        {/* <IconButtonWithTooltip
          tooltipTitle="Delete"
          aria-label="delete"
          onClick={() => {
            blinkTopProgressAction();
            this.showDeleteConfirmDialog(rowData);
          }}
        >
          <DeleteIcon />
        </IconButtonWithTooltip> */}
      </>
    );
  };

  // private renderDeleteConfirmDialog = () => {
  //   const { isDeleteConfirmDialogOpen, deletingCertificate } = this.state;
  //   const certName = deletingCertificate ? ` '${deletingCertificate.get("name")}'` : "";
  //   return (
  //     <ConfirmDialog
  //       open={isDeleteConfirmDialogOpen}
  //       onClose={this.closeDeleteConfirmDialog}
  //       title={`Are you sure you want to delete the certificate${certName}?`}
  //       content=""
  //       onAgree={this.confirmDelete}
  //     />
  //   );
  // };

  private closeDeleteConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: false,
    });
  };

  private showDeleteConfirmDialog = (deletingCertificate: Certificate) => {
    this.setState({
      isDeleteConfirmDialogOpen: true,
      deletingCertificate,
    });
  };

  private confirmDelete = async (rowData: RowData) => {
    const { dispatch } = this.props;
    try {
      const certName = rowData.get("name");
      await dispatch(deleteCertificateAction(certName));
      await dispatch(setSuccessNotificationAction(`Successfully deleted certificate '${certName}'`));
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  private renderStatus = (rowData: RowData) => {
    const ready = rowData.get("ready");

    if (ready === "True") {
      // why the ready field is a string value ?????
      return (
        <FlexRowItemCenterBox>
          <FlexRowItemCenterBox mr={1}>
            <SuccessBadge />
          </FlexRowItemCenterBox>
          <FlexRowItemCenterBox>Normal</FlexRowItemCenterBox>
        </FlexRowItemCenterBox>
      );
    } else if (!!rowData.get("reason")) {
      return (
        <FlexRowItemCenterBox>
          <FlexRowItemCenterBox mr={1}>
            <PendingBadge />
          </FlexRowItemCenterBox>
          <FlexRowItemCenterBox>{rowData.get("reason")}</FlexRowItemCenterBox>
        </FlexRowItemCenterBox>
      );
    } else {
      return <PendingBadge />;
    }
  };

  private renderType = (rowData: RowData) => {
    return rowData.get("isSelfManaged") ? "Externally Uploaded" : "Let's Encrypt";
  };

  private renderIsSignedByTrustedCA = (rowData: RowData) => {
    return rowData.get("isSignedByTrustedCA") ? "Yes" : "No";
  };

  private renderExpireTimestamp = (rowData: RowData) => {
    return rowData.get("expireTimestamp") ? formatDate(new Date(rowData.get("expireTimestamp") * 1000)) : "-";
  };

  private getColumns() {
    const columns = [
      // @ts-ignore
      {
        title: "Cert Name",
        field: "name",
        sorting: false,
        render: this.renderName,
        customFilterAndSearch: customSearchForImmutable,
      },
      {
        title: "Domains",
        field: "domains",
        sorting: false,
        render: this.renderDomains,
      },
      {
        title: "Status",
        field: "status",
        sorting: false,
        render: this.renderStatus,
      },
      {
        title: "Type",
        field: "isSelfManaged",
        sorting: false,
        render: this.renderType,
      },
      {
        title: "Signed by Trusted CA",
        field: "isSignedByTrustedCA",
        sorting: false,
        render: this.renderIsSignedByTrustedCA,
      },
      {
        title: "Expiration Time",
        field: "expireTimestamp",
        sorting: false,
        render: this.renderExpireTimestamp,
      },
      {
        title: "Actions",
        field: "moreAction",
        sorting: false,
        searchable: false,
        render: this.renderMoreActions,
      },
    ];

    return columns;
  }

  private getData = () => {
    const { certificates } = this.props;
    const data: RowData[] = [];

    certificates.forEach((certificate, index) => {
      const rowData = certificate as RowData;
      rowData.index = index;
      data.push(rowData);
    });

    return data;
  };

  private getKRTableColumns() {
    return [
      {
        Header: "Cert Name",
        accessor: "name",
      },
      {
        Header: "Domains",
        accessor: "domains",
        sorting: false,
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
        Header: "Signed by Trusted CA",
        accessor: "isSignedByTrustedCA",
      },
      {
        Header: "Expiration Time",
        accessor: "expireTimestamp",
      },
      {
        Header: "Actions",
        accessor: "actions",
      },
    ];
  }

  private getKRTableData() {
    const { certificates } = this.props;
    const data: any[] = [];

    certificates &&
      certificates.forEach((certificate, index) => {
        const rowData = certificate as RowData;
        data.push({
          name: this.renderName(rowData),
          domains: this.renderDomains(rowData),
          status: this.renderStatus(rowData),
          isSelfManaged: this.renderType(rowData),
          isSignedByTrustedCA: this.renderIsSignedByTrustedCA(rowData),
          expireTimestamp: this.renderExpireTimestamp(rowData),
          actions: this.renderMoreActions(rowData),
        });
      });

    return data;
  }

  private renderKRTable() {
    return <KRTable columns={this.getKRTableColumns()} data={this.getKRTableData()} />;
  }

  private renderEmpty() {
    return (
      <EmptyInfoBox
        image={<KalmCertificatesIcon style={{ height: 120, width: 120, color: indigo[200] }} />}
        title={sc.EMPTY_CERT_TITLE}
        content={sc.EMPTY_CERT_SUBTITLE}
        button={
          <CustomizedButton variant="contained" color="primary" component={Link} to="/certificates/new">
            New Certificate
          </CustomizedButton>
        }
      />
    );
  }

  private renderInfoBox() {
    const title = "Certificates";

    return <InfoBox title={title} options={[]} guideLink="https://kalm.dev/docs/certs"></InfoBox>;
  }

  public render() {
    const { isFirstLoaded, isLoading, certificates } = this.props;
    return (
      <BasePage
        secondHeaderRight={
          <>
            {/* <H6>Certificates</H6> */}
            <Button
              color="primary"
              variant="outlined"
              size="small"
              component={Link}
              tutorial-anchor-id="add-certificate"
              to="/certificates/new"
            >
              New Certificate
            </Button>
          </>
        }
      >
        {/* {this.renderDeleteConfirmDialog()} */}
        <Box p={2}>
          {isLoading && !isFirstLoaded ? (
            <Loading />
          ) : certificates && certificates.size > 0 ? (
            this.renderKRTable()
          ) : (
            this.renderEmpty()
          )}
        </Box>
        <Box p={2}>{this.renderInfoBox()}</Box>
      </BasePage>
    );
  }
}

export const CertificateListPage = withStyles(styles)(
  connect(mapStateToProps)(CertificateDataWrapper(CertificateListPageRaw)),
);
