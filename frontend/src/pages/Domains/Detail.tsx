import { Button } from "@material-ui/core";
import Box from "@material-ui/core/Box/Box";
import { Alert, AlertTitle } from "@material-ui/lab";
import { createCertificateAction } from "actions/certificate";
import { deleteDomainAction } from "actions/domains";
import { setSuccessNotificationAction } from "actions/notification";
import { push } from "connected-react-router";
import { BasePage } from "pages/BasePage";
import { CertificateInfo } from "pages/Certificate/Info";
import { DomainStatus } from "pages/Domains/Status";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouteMatch } from "react-router-dom";
import { RootState } from "reducers";
import { issuerManaged } from "types/certificate";
import { DNSConfigItems } from "widgets/ACMEServer";
import { KalmCertificatesIcon } from "widgets/Icon";
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

  const applyCert = () => {
    dispatch(
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
  };

  const deleteDomain = async () => {
    await dispatch(deleteDomainAction(domain.name));
    dispatch(setSuccessNotificationAction(`Successfully deleted domain ${domain.domain}`));
    dispatch(push("/domains"));
  };

  // const renderHelper = () => {
  //   return (
  //     <Box p={2}>
  //       <CollapseWrapper title="It's pending for a long time, how to debug?">
  //         <Box mt={2}>
  //           <p>Dig the your domain by executing following command in a terminal.</p>
  //           <Box ml={2}>
  //             <CodeBlock>
  //               <TextAndCopyButton text={`dig -t txt @8.8.8.8 ${domain.domain}`} />
  //             </CodeBlock>
  //             <p>
  //               if you can find a <strong>{domain.recordType}</strong> record in "ANSWER SECTION" with a value of{" "}
  //               <strong>{domain.target}</strong>, it means your DNS is added. The status will turn to "Ready" soon.
  //             </p>
  //             <p>
  //               Otherwise, your record is not working yet due to cache or misconfigured. Please check your DNS provider
  //               config.
  //             </p>
  //           </Box>
  //         </Box>
  //       </CollapseWrapper>
  //     </Box>
  //   );
  // };

  const renderTable = () => {
    return (
      <VerticalHeadTable
        items={[
          { name: "Name", content: domain.name },
          { name: "Domain", content: domain.domain },
          { name: "Status", content: <DomainStatus domain={domain} /> },
        ]}
      />
    );
  };

  return (
    <BasePage
      secondHeaderRight={
        canEditTenant() ? (
          <>
            {!cert && !domain.isBuiltIn && domain.status === "ready" && (
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
                <Box>
                  {domain.status === "pending" ? (
                    <Alert square style={{ borderRadius: 0 }} severity="info">
                      <AlertTitle>Not finished yet</AlertTitle>
                      Add the following record in your DNS provider.
                    </Alert>
                  ) : (
                    <Alert square style={{ borderRadius: 0 }} severity="success">
                      The following record is configured successfully.
                    </Alert>
                  )}
                </Box>

                <DNSConfigItems
                  items={[
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
