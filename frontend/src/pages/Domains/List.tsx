import { Box, Button, Link as KMLink } from "@material-ui/core";
import { indigo } from "@material-ui/core/colors";
import { deleteCertificateAction } from "actions/certificate";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
import { BasePage } from "pages/BasePage";
import { DomainStatus } from "pages/Domains/Status";
import React, { memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { Domain } from "types/domains";
import sc from "utils/stringConstants";
import { CustomizedButton } from "widgets/Button";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { WebIcon } from "widgets/Icon";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { InfoBox } from "widgets/InfoBox";
import { KRTable } from "widgets/KRTable";
import { KLink } from "widgets/Link";
import { Loading } from "widgets/Loading";

interface Props extends WithUserAuthProps {}

const DomainListPageRaw: React.FunctionComponent<Props> = (props) => {
  const dispatch = useDispatch();
  const { canEditTenant } = props;
  const { isFirstLoaded, isLoading, domains } = useSelector((state: RootState) => {
    return {
      isLoading: state.domains.isLoading,
      isFirstLoaded: state.domains.isFirstLoaded,
      domains: state.domains.domains,
    };
  });

  const renderDomain = (domain: Domain) => {
    return <KLink to={`/domains/${domain.name}`}>{domain.domain}</KLink>;
  };
  const renderType = (domain: Domain) => (domain.isBuiltIn ? "-" : domain.recordType);
  const renderTarget = (domain: Domain) => (domain.isBuiltIn ? "-" : domain.target);
  const renderActions = (domain: Domain) => {
    const { canEditTenant } = props;
    return (
      <>
        {canEditTenant() && !domain.isBuiltIn && (
          <>
            <DeleteButtonWithConfirmPopover
              popupId="delete-domain-popup"
              popupTitle="DELETE DOMAIN?"
              confirmedAction={() => confirmDelete(domain)}
            />
          </>
        )}
      </>
    );
  };

  const confirmDelete = async (domain: Domain) => {
    try {
      const certName = domain.name;
      await dispatch(deleteCertificateAction(certName));
      await dispatch(setSuccessNotificationAction(`Successfully deleted certificate '${certName}'`));
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  const renderStatus = (domain: Domain) => {
    return <DomainStatus domain={domain} />;
  };

  const getKRTableColumns = () => {
    const columns = [
      {
        Header: "Domain",
        accessor: "domain",
      },
      {
        Header: "Type",
        accessor: "type",
      },
      {
        Header: "Target",
        accessor: "target",
      },
      {
        Header: "Status",
        accessor: "status",
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
        type: renderType(domain),
        target: renderTarget(domain),
        status: renderStatus(domain),
        actions: renderActions(domain),
      });
    });

    return data;
  };

  const renderKRTable = () => {
    return <KRTable showTitle={true} title="Certificates" columns={getKRTableColumns()} data={getKRTableData()} />;
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
            <CustomizedButton variant="contained" color="primary" component={Link} to="/domain/new">
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

export const DomainListPage = withUserAuth(memo(DomainListPageRaw));
