import { Typography } from "@material-ui/core";
import Box from "@material-ui/core/Box/Box";
import { deleteDomainAction } from "actions/domains";
import { setSuccessNotificationAction } from "actions/notification";
import { push } from "connected-react-router";
import { BasePage } from "pages/BasePage";
import { CertificateInfo } from "pages/Domains/CertInfo";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouteMatch } from "react-router-dom";
import { RootState } from "reducers";
import CustomButton from "theme/Button";
import { Certificate } from "types/certificate";
import { DNSConfigItems } from "widgets/ACMEServer";
import { HelpIcon } from "widgets/Icon";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { KPanel } from "widgets/KPanel";
import { Loading } from "widgets/Loading";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";

const DomainDetailPageRaw: React.FC = () => {
  const { domains, isLoading, isFirstLoaded, certificates, canEditCluster } = useSelector((state: RootState) => {
    return {
      isLoading: state.domains.isLoading,
      isFirstLoaded: state.domains.isFirstLoaded,
      domains: state.domains.domains,
      certificates: state.certificates.certificates,
      canEditCluster: state.auth.permissionMethods.canEditCluster,
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

  let cert: Certificate | undefined;

  cert = certificates.find((x) => x.domains.length === 1 && x.domains[0] === domain.domain);
  if (!cert) {
    cert = certificates.find((x) => !!x.domains.find((y) => y === domain.domain));
  }

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
          ]}
        />
      </>
    );
  };

  return (
    <BasePage
      secondHeaderRight={
        canEditCluster() ? (
          <>
            <CustomButton
              startIcon={<HelpIcon />}
              color="primary"
              variant="outlined"
              size="small"
              onClick={() => dispatch(push("/domains/" + domain.name + "/config"))}
            >
              Configure
            </CustomButton>

            <DeleteButtonWithConfirmPopover
              useText
              text="Delete"
              popupId="delete-Domain"
              popupContent={
                <Box>
                  This action cannot be undone. This will permanently delete{" "}
                  <Typography color={"primary"} align={"center"} component="span">
                    {domain.domain}
                  </Typography>
                </Box>
              }
              targetText={domain.domain}
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
            <Box mt={2}>
              {domain.name !== "default" && (
                <DNSConfigItems
                  items={[
                    {
                      domain: domain.domain,
                      type: domain.recordType,
                      cnameRecord: domain.target,
                    },
                  ]}
                />
              )}
            </Box>
          </Box>
        </KPanel>

        {cert ? (
          <Box mt={2}>
            <CertificateInfo cert={cert} />
          </Box>
        ) : null}
      </Box>
    </BasePage>
  );
};

export const DomainDetailPage = DomainDetailPageRaw;
