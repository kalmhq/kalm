import { Button } from "@material-ui/core";
import Box from "@material-ui/core/Box/Box";
import Step from "@material-ui/core/Step";
import StepContent from "@material-ui/core/StepContent";
import StepLabel from "@material-ui/core/StepLabel";
import Stepper from "@material-ui/core/Stepper";
import { Alert, AlertTitle } from "@material-ui/lab";
import { createCertificateAction } from "actions/certificate";
import { BasePage } from "pages/BasePage";
import { CertStatus } from "pages/Domains/CertStatus";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouteMatch } from "react-router-dom";
import { RootState } from "reducers";
import { Certificate, issuerManaged } from "types/certificate";
import { DNSConfigItems } from "widgets/ACMEServer";
import { CodeBlock } from "widgets/CodeBlock";
import { CollapseWrapper } from "widgets/CollapseWrapper";
import { KPanel } from "widgets/KPanel";
import { Body2, Subtitle1 } from "widgets/Label";
import { Loading } from "widgets/Loading";
import { TextAndCopyButton } from "widgets/TextAndCopyButton";

interface StepOption {
  title: string;
  content: React.ReactNode;
  completed: boolean;
  isActive?: boolean;
}

const DomainTourPageRaw: React.FC = () => {
  const dispatch = useDispatch();
  const { domains, isLoading, isFirstLoaded, certificates, acmeServer } = useSelector((state: RootState) => {
    return {
      isLoading: state.domains.isLoading,
      isFirstLoaded: state.domains.isFirstLoaded,
      domains: state.domains.domains,
      certificates: state.certificates.certificates,
      acmeServer: state.certificates.acmeServer,
    };
  });

  const router = useRouteMatch<{ name: string }>();
  const domain = domains.find((x) => x.name === router.params.name);

  if (isLoading && !isFirstLoaded) {
    return <Loading />;
  }

  if (!domain) {
    return <Box p={2}>no such domain</Box>;
  }

  const isWildcard = domain.domain.startsWith("*");

  let cert: Certificate | undefined;

  cert = certificates.find((x) => x.domains.length === 1 && x.domains[0] === domain.domain);
  if (!cert) {
    cert = certificates.find((x) => !!x.domains.find((y) => y === domain.domain));
  }

  const renderHelper = (domain: string, type: string, target: string, proxyWarning: boolean = false) => {
    return (
      <CollapseWrapper title="How to check if I have configured the record correctly">
        <Box mt={2}>
          {proxyWarning && (
            <Alert severity="info">
              If you use an additional proxy when configuring domain name resolution (for example, using Cloudflare and
              record proxy is turned on), the following debug steps may not get the corresponding dns resolution
              results. As long as you configure it correctly, traffic can still reach your cluster.
            </Alert>
          )}
          <p>Dig the your domain by executing following command in a terminal.</p>
          <Box ml={2}>
            <CodeBlock>
              {type === "TXT" ? (
                <TextAndCopyButton text={`dig -t txt @8.8.8.8 "${domain}"`} />
              ) : (
                <TextAndCopyButton text={`dig @8.8.8.8 "${domain}"`} />
              )}
            </CodeBlock>
            <p>
              if you can find a <strong>{type}</strong> record in "ANSWER SECTION" with a value of{" "}
              <strong>{target}</strong>, it means your DNS is added. The status will turn to "Normal" soon.
            </p>
            <p>
              Otherwise, your record is not working yet due to cache or misconfigured. Please check your DNS provider
              config.
            </p>
          </Box>
        </Box>
      </CollapseWrapper>
    );
  };

  const step1: StepOption = {
    title: "Open your domain DNS config panel",
    content: <Box>Log in to your registrar account, and navigate to DNS config panel.</Box>,
    completed: false,
  };

  const steps: StepOption[] = [step1];

  const normalDomainNoCertStep = (): StepOption => {
    return {
      title: `Apply a certificate`,
      content: (
        <Box mt={2}>
          <Alert severity="info">
            Before applying, please ensure that the DNS records in the previous step have been configured correctly.
          </Alert>
          <Box mt={2}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => {
                dispatch(
                  createCertificateAction(
                    {
                      managedType: issuerManaged,
                      domains: [domain.domain],
                      name: "",
                      selfManagedCertContent: "",
                      selfManagedCertPrivateKey: "",
                    },
                    false,
                  ),
                );
              }}
            >
              Apply Certificate
            </Button>
          </Box>
        </Box>
      ),
      completed: false,
    };
  };

  const wildcardCertificateNoCertStep = (): StepOption => {
    return {
      title: `Apply a certificate`,
      content: (
        <Box mt={2}>
          {!acmeServer && (
            <Alert severity="info">
              <AlertTitle>ACME server is required</AlertTitle>
              The ACME server on the cluster is not configured. This component is a necessary dependency for processing
              wildcard certificates. Please go to the ACME Server page and follow the steps.
            </Alert>
          )}

          <Box mt={2}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              disabled={!acmeServer}
              onClick={() => {
                dispatch(
                  createCertificateAction(
                    {
                      managedType: issuerManaged,
                      domains: [domain.domain],
                      name: "",
                      selfManagedCertContent: "",
                      selfManagedCertPrivateKey: "",
                    },
                    false,
                  ),
                );
              }}
            >
              Apply Certificate
            </Button>
          </Box>
        </Box>
      ),
      completed: false,
    };
  };

  const wildcardDomainWithCertStep = (): StepOption | null => {
    if (!cert!.wildcardCertDNSChallengeDomainMap) {
      return null;
    }

    const certDomains = cert!.wildcardCertDNSChallengeDomainMap;
    const firsKey = Object.keys(certDomains)[0];
    const firstDomain = `_acme-challenge.${Object.keys(certDomains)[0]}`;
    const firstTarget = certDomains[firsKey];

    return {
      title: `Apply a certificate`,
      content: (
        <Box>
          <Box mt={2}>Add a CNAME Record in your DNS config panel.</Box>
          <Box mt={2}>
            <Alert severity="warning">
              <AlertTitle>
                If you are using <strong>Cloudflare</strong>, Please <strong>DO NOT</strong> enable Proxy for this
                record
              </AlertTitle>
              Using Cloudflare's CNAME proxy will cause CNAME records to fail verification.
            </Alert>
          </Box>
          <Box mt={2}>
            <DNSConfigItems
              items={Object.keys(certDomains).map((domain) => ({
                domain: `_acme-challenge.${domain}`,
                type: "CNAME",
                cnameRecord: certDomains[domain],
              }))}
            />
          </Box>

          <Box mt={2}>
            Check to make sure they’re correct, then <strong>Save the changes</strong>.
          </Box>

          <Box mt={2}>
            Wait for changes to take effect. Generally it will take effect within a few minutes to a few hours.
          </Box>

          <Box mt={2}>{renderHelper(firstDomain, "CNAME", firstTarget)}</Box>
          <Box mt={2} display="flex" flexDirection="row">
            <Box pl={2} display="flex">
              <CertStatus cert={cert!} />
            </Box>
          </Box>
        </Box>
      ),
      completed: cert!.ready === "True",
    };
  };

  const normalDomainWithCertStep = (): StepOption | null => {
    return {
      title: `Apply a certificate`,
      content: (
        <Box>
          <Box mt={2}>
            <Alert severity="info">
              This step will be completed automatically, please ensure that the DNS record in the previous step is
              configured correctly. Please wait.
            </Alert>
          </Box>
          <Box mt={2} display="flex">
            <CertStatus cert={cert!} />
          </Box>
        </Box>
      ),
      completed: cert!.ready === "True",
    };
  };

  let certStep: StepOption | null = null;

  if (cert) {
    if (isWildcard) {
      certStep = wildcardDomainWithCertStep();
    } else {
      certStep = normalDomainWithCertStep();
    }
  } else {
    if (isWildcard) {
      certStep = wildcardCertificateNoCertStep();
    } else {
      certStep = normalDomainNoCertStep();
    }
  }

  const trafficStep: StepOption = {
    title: `Configure ${domain.recordType} record to allow traffic to enter your cluster`,
    content: (
      <Box>
        <Box mt={2}>
          Add {domain.recordType === "A" ? "an" : "a"} {domain.recordType} Record in your DNS config panel you just
          open.
        </Box>
        <Box mt={2}>
          <DNSConfigItems
            items={[
              {
                domain: domain.domain,
                type: domain.recordType,
                aRecord: domain.recordType === "A" ? domain.target : undefined,
                cnameRecord: domain.recordType === "CNAME" ? domain.target : undefined,
              },
            ]}
          />
        </Box>
        <Box mt={2}>
          Check to make sure they’re correct, then <strong>Save the changes</strong>.
        </Box>

        <Box mt={2}>
          Wait for changes to take effect. Generally it will take effect within a few minutes to a few hours.
        </Box>

        <Box mt={2}>{renderHelper(domain.domain, domain.recordType, domain.target, true)}</Box>
      </Box>
    ),
    completed: !!cert && cert.ready === "True",
  };

  steps.push(trafficStep);
  if (certStep) steps.push(certStep);

  return (
    <BasePage>
      <Box p={2}>
        <KPanel>
          <Stepper orientation="vertical">
            {steps.map((step, index) => (
              <Step completed={step.completed} active={!step.completed} key={index}>
                <StepLabel>
                  <Subtitle1>{step.title}</Subtitle1>
                </StepLabel>
                <StepContent>
                  <Body2>{step.content}</Body2>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </KPanel>
      </Box>
    </BasePage>
  );
};

export const DomainTourPage = DomainTourPageRaw;
