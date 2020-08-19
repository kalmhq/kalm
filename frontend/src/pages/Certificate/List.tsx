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

class CertificateListPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isDeleteConfirmDialogOpen: false,
      deletingCertificate: null,
    };
  }

  private renderName = (name: string) => {
    return <Typography variant={"subtitle2"}>{name}</Typography>;
  };

  private renderDomains = (cert: Certificate) => {
    return (
      <>
        {cert.get("domains")?.map((domain) => {
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

  private renderActions = (cert: Certificate) => {
    return (
      <>
        {cert.get("isSelfManaged") && (
          <IconLinkWithToolTip tooltipTitle="Edit" aria-label="edit" to={`/certificates/${cert.get("name")}/edit`}>
            <EditIcon />
          </IconLinkWithToolTip>
        )}
        <DeleteButtonWithConfirmPopover
          popupId="delete-certificate-popup"
          popupTitle="DELETE CERTIFICATE?"
          confirmedAction={() => this.confirmDelete(cert)}
        />
        {/* <IconButtonWithTooltip
          tooltipTitle="Delete"
          aria-label="delete"
          onClick={() => {
            blinkTopProgressAction();
            this.showDeleteConfirmDialog(cert);
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

  private confirmDelete = async (cert: Certificate) => {
    const { dispatch } = this.props;
    try {
      const certName = cert.get("name");
      await dispatch(deleteCertificateAction(certName));
      await dispatch(setSuccessNotificationAction(`Successfully deleted certificate '${certName}'`));
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  private renderStatus = (cert: Certificate) => {
    const ready = cert.get("ready");

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
    } else if (!!cert.get("reason")) {
      return (
        <FlexRowItemCenterBox>
          <FlexRowItemCenterBox mr={1}>
            <PendingBadge />
          </FlexRowItemCenterBox>
          <FlexRowItemCenterBox>{cert.get("reason")}</FlexRowItemCenterBox>
        </FlexRowItemCenterBox>
      );
    } else {
      return <PendingBadge />;
    }
  };

  private renderType = (cert: Certificate) => {
    return cert.get("isSelfManaged") ? "Externally Uploaded" : "Let's Encrypt";
  };

  private renderIsSignedByTrustedCA = (cert: Certificate) => {
    return cert.get("isSignedByTrustedCA") ? "Yes" : "No";
  };

  private renderExpireTimestamp = (cert: Certificate) => {
    return cert.get("expireTimestamp") ? formatDate(new Date(cert.get("expireTimestamp") * 1000)) : "-";
  };

  private getKRTableColumns() {
    return [
      {
        Header: "Cert Name",
        accessor: "name",
        Cell: ({ value }: { value: string }) => {
          return this.renderName(value);
        },
      },
      {
        Header: "Domains",
        accessor: "domains",
        Cell: ({ value }: { value: Certificate }) => {
          return this.renderDomains(value);
        },
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ value }: { value: Certificate }) => {
          return this.renderStatus(value);
        },
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
        Cell: ({ value }: { value: Certificate }) => {
          return this.renderActions(value);
        },
      },
    ];
  }

  private getKRTableData() {
    const { certificates } = this.props;
    const data: any[] = [];

    certificates.forEach((cert, index) => {
      // for data filter:
      // simple string field, should render in data.
      // react Element field, should render in columns.
      data.push({
        name: cert.get("name"),
        domains: cert,
        status: cert,
        isSelfManaged: this.renderType(cert),
        isSignedByTrustedCA: this.renderIsSignedByTrustedCA(cert),
        expireTimestamp: this.renderExpireTimestamp(cert),
        actions: cert,
      });
    });

    return data;
  }

  private renderKRTable() {
    return (
      <KRTable showTitle={true} title="Certificates" columns={this.getKRTableColumns()} data={this.getKRTableData()} />
    );
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
