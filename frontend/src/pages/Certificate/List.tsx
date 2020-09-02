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
import { Certificate, dns01Issuer } from "types/certificate";
import { formatDate } from "utils/date";
import sc from "utils/stringConstants";
import { PendingBadge } from "widgets/Badge";
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
import { KLink } from "widgets/Link";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    normalStatus: {
      color: theme.palette.success.main,
    },
    warningStatus: {
      color: theme.palette.warning.main,
    },
    domainsColumn: {
      minWidth: 200,
    },
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

  private renderName = (cert: Certificate) => {
    return (
      <Typography variant={"subtitle2"}>
        <KLink to={`/certificates/${cert.get("name")}`}>{cert.get("name")}</KLink>
      </Typography>
    );
  };

  private renderDomains = (cert: Certificate) => {
    const { classes } = this.props;
    const isWildcardDomain = cert.get("httpsCertIssuer") === dns01Issuer;
    const domainStatus = (domain: string) => {
      const cname = cert.get("wildcardCertDNSChallengeDomain");
      return isWildcardDomain ? (
        <DomainStatus mr={1} domain={domain} cnameDomain={cname} />
      ) : (
        <DomainStatus mr={1} domain={domain} />
      );
    };
    const prefix = isWildcardDomain ? "*." : "";
    return (
      <Box className={classes.domainsColumn}>
        {cert
          .get("domains")
          ?.map((domain) => {
            return (
              <FlexRowItemCenterBox key={domain}>
                {domainStatus(`${domain}`)}
                {`${prefix}${domain}`}
              </FlexRowItemCenterBox>
            );
          })
          .toArray()}
      </Box>
    );
  };

  private renderMoreActions = (cert: Certificate) => {
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
    const { classes } = this.props;
    const ready = cert.get("ready");

    if (ready === "True") {
      // why the ready field is a string value ?????
      return (
        <FlexRowItemCenterBox>
          <FlexRowItemCenterBox className={classes.normalStatus}>Normal</FlexRowItemCenterBox>
        </FlexRowItemCenterBox>
      );
    } else if (!!cert.get("reason")) {
      return (
        <FlexRowItemCenterBox>
          <FlexRowItemCenterBox mr={1}>
            <PendingBadge />
          </FlexRowItemCenterBox>
          <FlexRowItemCenterBox className={classes.warningStatus}>{cert.get("reason")}</FlexRowItemCenterBox>
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

    certificates.forEach((cert, index) => {
      data.push({
        name: this.renderName(cert),
        domains: this.renderDomains(cert),
        status: this.renderStatus(cert),
        isSelfManaged: this.renderType(cert),
        isSignedByTrustedCA: this.renderIsSignedByTrustedCA(cert),
        expireTimestamp: this.renderExpireTimestamp(cert),
        actions: this.renderMoreActions(cert),
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
            <Button
              color="primary"
              variant="outlined"
              size="small"
              component={Link}
              tutorial-anchor-id="upload-certificate"
              to="/certificates/upload"
            >
              Upload Certificate
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
