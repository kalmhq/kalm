import { Box, Button, Link as KMLink, Typography } from "@material-ui/core";
import { indigo } from "@material-ui/core/colors";
import { deleteDomainAction } from "actions/domains";
import { setSuccessNotificationAction } from "actions/notification";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
import { BasePage } from "pages/BasePage";
import { DomainStatus } from "pages/Domains/Status";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { Certificate } from "types/certificate";
import { Domain } from "types/domains";
import sc from "utils/stringConstants";
import { CustomizedButton } from "widgets/Button";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { KalmDetailsIcon, WebIcon } from "widgets/Icon";
import { IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { InfoBox } from "widgets/InfoBox";
import { KRTable } from "widgets/KRTable";
import { KLink } from "widgets/Link";
import { Loading } from "widgets/Loading";
import { SuccessColorText, WarningColorText } from "widgets/Text";

interface Props extends WithUserAuthProps {}

const DomainListPageRaw: React.FunctionComponent<Props> = (props) => {
  const dispatch = useDispatch();
  const { canEditTenant } = props;

  const { isFirstLoaded, isLoading, domains, certificates } = useSelector((state: RootState) => {
    return {
      isLoading: state.domains.isLoading,
      isFirstLoaded: state.domains.isFirstLoaded,
      domains: state.domains.domains,
      certificates: state.certificates.certificates,
    };
  });

  const certificatesMap: { [key: string]: Certificate } = {};

  certificates.forEach((certificate) => {
    certificatesMap[certificate.domains[0]] = certificate;
  });

  const deleteDomain = (domain: Domain) => {
    dispatch(deleteDomainAction(domain.name));
    dispatch(setSuccessNotificationAction(`Successfully deleted domain ${domain.domain}`));
  };

  const renderDomain = (domain: Domain) => {
    return <KLink to={`/domains/${domain.name}`}>{domain.domain}</KLink>;
  };
  // const renderType = (domain: Domain) => (domain.isBuiltIn ? "-" : domain.recordType);
  // const renderTarget = (domain: Domain) => (domain.isBuiltIn ? "-" : domain.target);
  const renderCertificate = (domain: Domain) => {
    if (domain.isBuiltIn) {
      return <SuccessColorText>Issued</SuccessColorText>;
    }

    const cert = certificatesMap[domain.domain];

    if (cert) {
      if (cert.ready === "True") {
        return <SuccessColorText>Issued</SuccessColorText>;
      } else {
        return <WarningColorText>Pending</WarningColorText>;
      }
    }

    if (domain.status === "ready") {
      return "Not-issued";
    }
  };
  const renderActions = (domain: Domain) => {
    return (
      <>
        {
          <IconLinkWithToolTip tooltipTitle="Details" to={`/domains/${domain.name}`}>
            <KalmDetailsIcon />
          </IconLinkWithToolTip>
        }
        {canEditTenant() && (
          <>
            <DeleteButtonWithConfirmPopover
              disabled={domain.isBuiltIn}
              popupId="delete-domain-popup"
              popupTitle="DELETE DOMAIN?"
              popupContent={
                <Box>
                  This action cannot be undone. This will permanently delete
                  <Typography color={"primary"} align={"center"}>
                    {domain.domain}
                  </Typography>
                </Box>
              }
              targetText={domain.domain}
              confirmedAction={() => deleteDomain(domain)}
            />
          </>
        )}
      </>
    );
  };

  const renderTxtRecordStatus = (domain: Domain) => {
    if (domain.isBuiltIn) {
      return <span>-</span>;
    }

    return <DomainStatus status={domain.txtStatus} />;
  };

  // const renderTrafficRecordStatus = (domain: Domain) => {
  //   if (domain.isBuiltIn) {
  //     return <span>-</span>;
  //   }

  //   return <DomainStatus status={domain.status} />;
  // };

  const getKRTableColumns = () => {
    const columns = [
      {
        Header: "Domain",
        accessor: "domain",
      },
      // {
      //   Header: "Type",
      //   accessor: "type",
      // },
      // {
      //   Header: "Target",
      //   accessor: "target",
      // },
      {
        Header: "TXT Record",
        accessor: "txtRecordStatus",
      },
      // {
      // Header: "Traffic Record",
      // accessor: "trafficRecordStatus",
      // },
      {
        Header: "Certificate Status",
        accessor: "certificate",
      },
    ];

    if (canEditTenant()) {
      columns.push({
        Header: "Actions",
        accessor: "actions",
      });
    }

    return columns;
  };

  const getKRTableData = () => {
    const data: any[] = [];

    domains.forEach((domain) => {
      data.push({
        domain: renderDomain(domain),
        txtRecordStatus: renderTxtRecordStatus(domain),
        // trafficRecordStatus: renderTrafficRecordStatus(domain),
        certificate: renderCertificate(domain),
        actions: renderActions(domain),
      });
    });

    return data;
  };

  const renderKRTable = () => {
    return <KRTable showTitle={true} title="Domains" columns={getKRTableColumns()} data={getKRTableData()} />;
  };

  const renderEmpty = () => {
    const { canEditTenant } = props;
    return (
      <EmptyInfoBox
        image={<WebIcon style={{ height: 120, width: 120, color: indigo[200] }} />}
        title={sc.EMPTY_DOMAIN_TITLE}
        content={sc.EMPTY_DOMAIN_SUBTITLE}
        button={
          canEditTenant() ? (
            <CustomizedButton variant="contained" color="primary" component={Link} to="/domains/new">
              New Domain
            </CustomizedButton>
          ) : null
        }
      />
    );
  };

  const renderInfoBox = () => {
    const title = "Domains";

    const options = [
      {
        title: (
          <KMLink href="https://kalm.dev/docs/certs" target="_blank">
            How to update my domain DNS records? (TODO)
          </KMLink>
        ),
        draft: true,
        content: "",
      },
      {
        title: (
          <KMLink href="https://kalm.dev/docs/certs" target="_blank">
            What's the difference between Domain and Certificate? (TODO)
          </KMLink>
        ),
        draft: true,
        content: "",
      },
    ];

    return <InfoBox title={title} options={options} />;
  };

  return (
    <BasePage
      secondHeaderRight={
        canEditTenant() ? (
          <>
            <Button
              color="primary"
              variant="outlined"
              size="small"
              component={Link}
              tutorial-anchor-id="add-domain"
              to="/domains/new"
            >
              New Domain
            </Button>
          </>
        ) : null
      }
    >
      <Box p={2}>
        <Box>
          {isLoading && !isFirstLoaded ? <Loading /> : domains && domains.length > 0 ? renderKRTable() : renderEmpty()}
        </Box>
        <Box mt={2}>{renderInfoBox()}</Box>
      </Box>
    </BasePage>
  );
};

export const DomainListPage = withUserAuth(DomainListPageRaw);
