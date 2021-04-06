import { Box, Link as KMLink, Typography } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import { deleteCertificateAction } from "actions/certificate";
import { deleteDomainAction } from "actions/domains";
import { setSuccessNotificationAction } from "actions/notification";
import { BasePage } from "pages/BasePage";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "store";
import CustomButton from "theme/Button";
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

interface Props {}

const DomainListPageRaw: React.FunctionComponent<Props> = (props) => {
  const dispatch = useDispatch();

  const { isFirstLoaded, isLoading, domains, certificates } = useSelector((state: RootState) => {
    return {
      isLoading: state.domains.isLoading,
      isFirstLoaded: state.domains.isFirstLoaded,
      domains: state.domains.domains,
      certificates: state.certificates.certificates,
    };
  });

  const findCert = (domain: Domain): Certificate | undefined => {
    let cert: Certificate | undefined;

    cert = certificates.find((x) => x.domains.length === 1 && x.domains[0] === domain.domain);
    if (!cert) {
      cert = certificates.find((x) => !!x.domains.find((y) => y === domain.domain));
    }

    return cert;
  };

  const deleteDomain = async (domain: Domain) => {
    const promises = [];
    promises.push(dispatch(deleteDomainAction(domain.name)));

    const cert = findCert(domain);

    if (cert) {
      promises.push(dispatch(deleteCertificateAction(cert.name)));
    }

    await Promise.all(promises);

    dispatch(setSuccessNotificationAction(`Successfully deleted domain ${domain.domain}`));
  };

  const renderDomain = (domain: Domain) => {
    return <KLink to={`/domains/${domain.name}`}>{domain.domain}</KLink>;
  };
  const renderCertificate = (domain: Domain) => {
    const cert = findCert(domain);

    if (cert) {
      if (cert.ready === "True") {
        return <SuccessColorText>Issued</SuccessColorText>;
      } else {
        return <WarningColorText>Pending</WarningColorText>;
      }
    }

    return <span>Not applied</span>;
  };
  const renderActions = (domain: Domain) => {
    return (
      <>
        {
          <IconLinkWithToolTip tooltipTitle="Details" to={`/domains/${domain.name}`}>
            <KalmDetailsIcon />
          </IconLinkWithToolTip>
        }
        <>
          <DeleteButtonWithConfirmPopover
            popupId="delete-domain-popup"
            popupTitle="DELETE DOMAIN?"
            popupContent={
              <Box>
                This action cannot be undone. This will permanently delete{" "}
                <Typography color={"primary"} align={"center"} component="span">
                  {domain.domain}
                </Typography>
              </Box>
            }
            targetText={domain.domain}
            confirmedAction={() => deleteDomain(domain)}
          />
        </>
      </>
    );
  };

  const getKRTableColumns = () => {
    const columns = [
      {
        Header: "Domain",
        accessor: "domain",
      },
      {
        Header: "Certificate Status",
        accessor: "certificate",
      },
    ];

    columns.push({
      Header: "Actions",
      accessor: "actions",
    });

    return columns;
  };

  const getKRTableData = () => {
    const data: any[] = [];

    domains.forEach((domain) => {
      data.push({
        domain: renderDomain(domain),
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
    return (
      <EmptyInfoBox
        image={<WebIcon style={{ height: 120, width: 120, color: grey[300] }} />}
        title={sc.EMPTY_DOMAIN_TITLE}
        content={sc.EMPTY_DOMAIN_SUBTITLE}
        button={
          <>
            <CustomizedButton variant="contained" color="primary" component={Link} to="/domains/new">
              New Domain
            </CustomizedButton>
          </>
        }
      />
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderInfoBox = () => {
    const title = "Domains";

    const options = [
      {
        title: (
          <KMLink href="https://docs.kalm.dev/TODO" target="_blank">
            How to update my domain DNS records? (TODO)
          </KMLink>
        ),
        draft: true,
        content: "",
      },
      {
        title: (
          <KMLink href="https://docs.kalm.dev/TODO" target="_blank">
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
        <>
          <CustomButton
            color="primary"
            variant="contained"
            size="small"
            component={Link}
            tutorial-anchor-id="add-domain"
            to="/domains/new"
          >
            New Domain
          </CustomButton>
          <CustomButton
            color="primary"
            variant="contained"
            size="small"
            component={Link}
            tutorial-anchor-id="add-domain"
            to="/domains/acme"
          >
            Manage ACME DNS server
          </CustomButton>
        </>
      }
    >
      <Box p={2}>
        <Box>
          {isLoading && !isFirstLoaded ? <Loading /> : domains && domains.length > 0 ? renderKRTable() : renderEmpty()}
        </Box>
        {/* <Box mt={2}>{renderInfoBox()}</Box> */}
      </Box>
    </BasePage>
  );
};

export const DomainListPage = DomainListPageRaw;
