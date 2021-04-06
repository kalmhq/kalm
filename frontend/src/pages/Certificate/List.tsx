import { Box, createStyles, Link as KMLink, Theme, Typography, withStyles, WithStyles } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import { deleteCertificateAction } from "actions/certificate";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "store";
import CustomButton from "theme/Button";
import { TDispatchProp } from "types";
import { Certificate } from "types/certificate";
import { formatDate } from "utils/date";
import sc from "utils/stringConstants";
import { ACMEServer } from "widgets/ACMEServer";
import { PendingBadge } from "widgets/Badge";
import { FlexRowItemCenterBox } from "widgets/Box";
import { CustomizedButton } from "widgets/Button";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { EditIcon, KalmCertificatesIcon } from "widgets/Icon";
import { IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { InfoBox } from "widgets/InfoBox";
import { KRTable } from "widgets/KRTable";
import { KLink } from "widgets/Link";
import { Loading } from "widgets/Loading";
import { CertificateDataWrapper, WithCertificatesDataProps } from "./DataWrapper";

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
    isLoading: state.certificates.isLoading,
    isFirstLoaded: state.certificates.isFirstLoaded,
    certificates: state.certificates.certificates,
  };
};

interface Props
  extends WithCertificatesDataProps,
    WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    TDispatchProp {}

const CertificateListPageRaw: React.FC<Props> = (props) => {
  const renderName = (cert: Certificate) => {
    return (
      <Typography variant={"subtitle2"}>
        <KLink to={`/certificates/${cert.name}`}>{cert.name}</KLink>
      </Typography>
    );
  };

  const renderDomains = (cert: Certificate) => {
    const { classes } = props;

    return (
      <Box className={classes.domainsColumn}>
        {cert.domains?.map((domain) => {
          return <FlexRowItemCenterBox key={domain}>{`${domain}`}</FlexRowItemCenterBox>;
        })}
      </Box>
    );
  };

  const renderActions = (cert: Certificate) => {
    return (
      <>
        {cert.isSelfManaged && (
          <IconLinkWithToolTip tooltipTitle="Edit" aria-label="edit" to={`/certificates/${cert.name}/edit`}>
            <EditIcon />
          </IconLinkWithToolTip>
        )}
        <DeleteButtonWithConfirmPopover
          popupId="delete-certificate-popup"
          popupTitle="DELETE CERTIFICATE?"
          confirmedAction={() => confirmDelete(cert)}
        />
      </>
    );
  };

  const confirmDelete = async (cert: Certificate) => {
    const { dispatch } = props;
    try {
      const certName = cert.name;
      await dispatch(deleteCertificateAction(certName));
      await dispatch(setSuccessNotificationAction(`Successfully deleted certificate '${certName}'`));
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  const renderStatus = (cert: Certificate) => {
    const { classes } = props;
    const ready = cert.ready;

    if (ready === "True") {
      // why the ready field is a string value ?????
      return (
        <FlexRowItemCenterBox>
          <FlexRowItemCenterBox className={classes.normalStatus}>Normal</FlexRowItemCenterBox>
        </FlexRowItemCenterBox>
      );
    } else if (!!cert.reason) {
      return (
        <FlexRowItemCenterBox>
          <FlexRowItemCenterBox mr={1}>
            <PendingBadge />
          </FlexRowItemCenterBox>
          <FlexRowItemCenterBox className={classes.warningStatus}>{cert.reason}</FlexRowItemCenterBox>
        </FlexRowItemCenterBox>
      );
    } else {
      return <PendingBadge />;
    }
  };

  const renderType = (cert: Certificate) => {
    return cert.isSelfManaged ? "Uploaded" : "Let's Encrypt";
  };

  const renderIsSignedByTrustedCA = (cert: Certificate) => {
    return cert.isSignedByTrustedCA ? "Yes" : "No";
  };

  const renderExpireTimestamp = (cert: Certificate) => {
    return cert.expireTimestamp ? formatDate(new Date(cert.expireTimestamp! * 1000)) : "-";
  };

  const getKRTableColumns = () => {
    const columns = [
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
    ];

    columns.push({
      Header: "Actions",
      accessor: "actions",
    });

    return columns;
  };

  const getKRTableData = () => {
    const { certificates } = props;
    const data: any[] = [];

    certificates.forEach((cert, index) => {
      data.push({
        name: renderName(cert),
        domains: renderDomains(cert),
        status: renderStatus(cert),
        isSelfManaged: renderType(cert),
        isSignedByTrustedCA: renderIsSignedByTrustedCA(cert),
        expireTimestamp: renderExpireTimestamp(cert),
        actions: renderActions(cert),
      });
    });

    return data;
  };

  const renderKRTable = () => {
    return <KRTable showTitle={true} title="Certificates" columns={getKRTableColumns()} data={getKRTableData()} />;
  };

  const renderEmpty = () => {
    return (
      <EmptyInfoBox
        image={<KalmCertificatesIcon style={{ height: 120, width: 120, color: grey[300] }} />}
        title={sc.EMPTY_CERT_TITLE}
        content={sc.EMPTY_CERT_SUBTITLE}
        button={
          <CustomizedButton variant="contained" color="primary" component={Link} to="/certificates/new">
            New Certificate
          </CustomizedButton>
        }
      />
    );
  };

  const renderInfoBox = () => {
    const title = "Certificates";

    const options = [
      {
        title: (
          <KMLink href="https://docs.kalm.dev/certs" target="_blank">
            Certificate Docs
          </KMLink>
        ),
        content: "",
      },
      {
        title: (
          <KMLink href="https://docs.kalm.dev/certs" target="_blank">
            What's an ACME DNS server?(TODO)
          </KMLink>
        ),
        draft: true,

        content: "",
      },
      {
        title: (
          <KMLink href="https://docs.kalm.dev/certs" target="_blank">
            HttpCert CRD
          </KMLink>
        ),
        draft: true,
        content: "",
      },
    ];

    return <InfoBox title={title} options={options} />;
  };

  const { isFirstLoaded, isLoading, certificates } = props;
  return (
    <BasePage
      secondHeaderRight={
        <>
          {/* <H6>Certificates</H6> */}
          <CustomButton
            color="primary"
            variant="outlined"
            size="small"
            component={Link}
            tutorial-anchor-id="add-certificate"
            to="/certificates/new"
          >
            New Certificate
          </CustomButton>
          <CustomButton
            color="primary"
            variant="outlined"
            size="small"
            component={Link}
            tutorial-anchor-id="upload-certificate"
            to="/certificates/upload"
          >
            Upload Certificate
          </CustomButton>
        </>
      }
    >
      <Box p={2}>
        <ACMEServer />
        <Box mt={2}>
          {isLoading && !isFirstLoaded ? (
            <Loading />
          ) : certificates && certificates.length > 0 ? (
            renderKRTable()
          ) : (
            renderEmpty()
          )}
        </Box>
        <Box mt={2}>{renderInfoBox()}</Box>
      </Box>
    </BasePage>
  );
};

export const CertificateListPage = withStyles(styles)(
  connect(mapStateToProps)(CertificateDataWrapper(CertificateListPageRaw)),
);
