import { Button } from "@material-ui/core";
import Box from "@material-ui/core/Box/Box";
import { createCertificateAction } from "actions/certificate";
import { deleteDomainAction } from "actions/domains";
import { setSuccessNotificationAction } from "actions/notification";
import { push } from "connected-react-router";
import { BasePage } from "pages/BasePage";
import { CertificateInfo } from "pages/Domains/CertInfo";
import { DomainStatus } from "pages/Domains/Status";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouteMatch } from "react-router-dom";
import { RootState } from "reducers";
import { issuerManaged } from "types/certificate";
import { DNSConfigItems } from "widgets/ACMEServer";
import { HelpIcon, KalmCertificatesIcon } from "widgets/Icon";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { KPanel } from "widgets/KPanel";
import { Loading } from "widgets/Loading";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";

const DomainDetailPageRaw: React.FC = () => {
  const { domains, isLoading, isFirstLoaded, certificates, canEditTenant } = useSelector((state: RootState) => {
    return {
      isLoading: state.domains.isLoading,
      isFirstLoaded: state.domains.isFirstLoaded,
      domains: state.domains.domains,
      certificates: state.certificates.certificates,
      canEditTenant: state.auth.permissionMethods.canEditTenant,
    };
  });

  const dispatch = useDispatch();
  const router = useRouteMatch<{ name: string }>();
  const domain = domains.find((x) => x.name === router.params.name);

  if (isLoading && !isFirstLoaded) {
    return <Loading />;
  }

  if (!domain) {
    return <Box p={2}>no such domain</Box>;
  }

  const cert = certificates.find((x) => x.domains.length === 1 && x.domains[0] === domain.domain);

  const applyCert = async () => {
    await dispatch(
      createCertificateAction(
        {
          name: "",
          domains: [domain.domain],
          managedType: issuerManaged,
          selfManagedCertContent: "",
          selfManagedCertPrivateKey: "",
        },
        false,
      ),
    );

    dispatch(push("/domains/" + domain.name + "/tour"));
  };

  const deleteDomain = async () => {
    await dispatch(deleteDomainAction(domain.name));
    dispatch(setSuccessNotificationAction(`Successfully deleted domain ${domain.domain}`));
    dispatch(push("/domains"));
  };

  const renderTable = () => {
    return (
      <>
        <VerticalHeadTable
          items={[
            { name: "Name", content: domain.name },
            { name: "Domain", content: domain.domain },
            { name: `TXT Record Status`, content: <DomainStatus status={domain.txtStatus} /> },
            // { name: `${domain.recordType} Record Status`, content: <DomainStatus status={domain.status} /> },
          ]}
        />
      </>
    );
  };

  return (
    <BasePage
      secondHeaderRight={
        canEditTenant() ? (
          <>
            {!cert && !domain.isBuiltIn && domain.txtStatus === "ready" && (
              <Button
                startIcon={<KalmCertificatesIcon />}
                color="primary"
                variant="outlined"
                size="small"
                tutorial-anchor-id="add-domain"
                onClick={applyCert}
              >
                Apply SSL Certificate
              </Button>
            )}

            {domain.status !== "ready" || domain.txtStatus !== "ready" || (cert && cert.ready !== "True") ? (
              <Button
                startIcon={<HelpIcon />}
                color="primary"
                variant="outlined"
                size="small"
                onClick={() => dispatch(push("/domains/" + domain.name + "/tour"))}
              >
                How to setup DNS records
              </Button>
            ) : null}

            <DeleteButtonWithConfirmPopover
              useText
              disabled={domain.isBuiltIn}
              text="Delete"
              popupId="delete-Domain"
              popupTitle="Are your sure to delete this domain?"
              confirmedAction={deleteDomain}
            />
          </>
        ) : null
      }
    >
      <Box p={2}>
        <KPanel title="Domain Info">
          <Box p={2}>
            {renderTable()}
            {!domain.isBuiltIn && (
              <Box mt={2}>
                <DNSConfigItems
                  items={[
                    {
                      domain: domain.domain,
                      type: "TXT",
                      txtRecord: domain.txt,
                    },
                    {
                      domain: domain.domain,
                      type: domain.recordType,
                      cnameRecord: domain.target,
                    },
                  ]}
                />
              </Box>
            )}
          </Box>
        </KPanel>

        {cert ? (
          <Box mt={2}>
            <CertificateInfo cert={cert} />
          </Box>
        ) : null}

        {/* {domain.status === "pending" && (
              <Box mt={2}>
                <KPanel>{renderHelper()}</KPanel>
              </Box>
            )} */}
      </Box>
    </BasePage>
  );
};

export const DomainDetailPage = DomainDetailPageRaw;
