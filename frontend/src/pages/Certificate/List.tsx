import { Box, createStyles, Theme, WithStyles, withStyles, Button, Typography } from "@material-ui/core";
import { deleteCertificateAction, setEditCertificateModalAction } from "actions/certificate";
import { openDialogAction } from "actions/dialog";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { blinkTopProgressAction } from "actions/settings";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { Certificate } from "types/certificate";
import { customSearchForImmutable } from "utils/tableSearch";
import { PendingBadge, SuccessBadge } from "widgets/Badge";
import { FlexRowItemCenterBox } from "widgets/Box";
import { ConfirmDialog } from "widgets/ConfirmDialog";
import { DeleteIcon, EditIcon, KalmCertificatesIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { Loading } from "widgets/Loading";
import { KTable } from "widgets/Table";
import { CertificateDataWrapper, WithCertificatesDataProps } from "./DataWrapper";
import { addCertificateDialogId, NewModal } from "./New";
import { formatDate } from "utils/date";
import { CustomizedButton } from "widgets/Button";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { indigo } from "@material-ui/core/colors";
import { InfoBox } from "widgets/InfoBox";
import DomainStatus from "widgets/DomainStatus";
import sc from "utils/stringConstants";
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
    return rowData.get("name");
  };

  private renderDomains = (rowData: RowData) => {
    return (
      <>
        {rowData.get("domains")?.map((domain) => {
          return (
            <FlexRowItemCenterBox key={domain}>
              <DomainStatus domain={domain} />
              <Typography>{domain}</Typography>
            </FlexRowItemCenterBox>
          );
        })}
      </>
    );
  };

  private renderMoreActions = (rowData: RowData) => {
    const { dispatch } = this.props;
    return (
      <>
        {rowData.get("isSelfManaged") && (
          <IconButtonWithTooltip
            tooltipTitle="Edit"
            aria-label="edit"
            onClick={() => {
              blinkTopProgressAction();
              dispatch(openDialogAction(addCertificateDialogId));
              dispatch(setEditCertificateModalAction(rowData));
            }}
          >
            <EditIcon />
          </IconButtonWithTooltip>
        )}
        <IconButtonWithTooltip
          tooltipTitle="Delete"
          aria-label="delete"
          onClick={() => {
            blinkTopProgressAction();
            this.showDeleteConfirmDialog(rowData);
          }}
        >
          <DeleteIcon />
        </IconButtonWithTooltip>
      </>
    );
  };

  private renderDeleteConfirmDialog = () => {
    const { isDeleteConfirmDialogOpen, deletingCertificate } = this.state;
    const certName = deletingCertificate ? ` '${deletingCertificate.get("name")}'` : "";
    return (
      <ConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={this.closeDeleteConfirmDialog}
        title={`Are you sure you want to delete the certificate${certName}?`}
        content=""
        onAgree={this.confirmDelete}
      />
    );
  };

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

  private confirmDelete = async () => {
    const { dispatch } = this.props;
    try {
      const { deletingCertificate } = this.state;
      if (deletingCertificate) {
        const certName = deletingCertificate.get("name");
        await dispatch(deleteCertificateAction(certName));
        await dispatch(setSuccessNotificationAction(`Successfully deleted certificate '${certName}'`));
      }
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  private renderStatus = (rowData: RowData) => {
    const ready = rowData.get("ready");

    if (ready === "True") {
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
        title: "Name",
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

  private renderEmpty() {
    const { dispatch } = this.props;

    return (
      <EmptyInfoBox
        image={<KalmCertificatesIcon style={{ height: 120, width: 120, color: indigo[200] }} />}
        title={sc.EMPTY_CERT_TITLE}
        content={sc.EMPTY_CERT_SUBTITLE}
        button={
          <CustomizedButton
            variant="contained"
            color="primary"
            onClick={() => {
              blinkTopProgressAction();
              dispatch(openDialogAction(addCertificateDialogId));
              dispatch(setEditCertificateModalAction(null));
            }}
          >
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
    const { dispatch, isFirstLoaded, isLoading, certificates } = this.props;
    const tableData = this.getData();
    return (
      <BasePage
        secondHeaderRight={
          <>
            {/* <H6>Certificates</H6> */}
            <Button
              color="primary"
              variant="outlined"
              size="small"
              tutorial-anchor-id="add-certificate"
              onClick={() => {
                blinkTopProgressAction();
                dispatch(openDialogAction(addCertificateDialogId));
                dispatch(setEditCertificateModalAction(null));
              }}
            >
              New Certificate
            </Button>
          </>
        }
      >
        <NewModal />
        {this.renderDeleteConfirmDialog()}
        <Box p={2}>
          {isLoading && !isFirstLoaded ? (
            <Loading />
          ) : certificates && certificates.size > 0 ? (
            <KTable
              options={{
                paging: tableData.length > 20,
              }}
              columns={this.getColumns()}
              data={tableData}
              title=""
            />
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
