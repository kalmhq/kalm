import { Button } from "@material-ui/core";
import Box from "@material-ui/core/Box/Box";
import Step from "@material-ui/core/Step";
import StepContent from "@material-ui/core/StepContent";
import StepLabel from "@material-ui/core/StepLabel";
import Stepper from "@material-ui/core/Stepper";
import { boolean } from "@storybook/addon-knobs";
import { BasePage } from "pages/BasePage";
import { CertStatus } from "pages/Domains/CertStatus";
import { DomainStatus } from "pages/Domains/Status";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useRouteMatch } from "react-router-dom";
import { RootState } from "reducers";
import { DNSConfigItems } from "widgets/ACMEServer";
import { CodeBlock } from "widgets/CodeBlock";
import { CollapseWrapper } from "widgets/CollapseWrapper";
import { KPanel } from "widgets/KPanel";
import { Body2, Subtitle1 } from "widgets/Label";
import { Loading } from "widgets/Loading";
import { TextAndCopyButton } from "widgets/TextAndCopyButton";

const DomainTourPageRaw: React.FC = () => {
  const { domains, isLoading, isFirstLoaded, certificates } = useSelector((state: RootState) => {
    return {
      isLoading: state.domains.isLoading,
      isFirstLoaded: state.domains.isFirstLoaded,
      domains: state.domains.domains,
      certificates: state.certificates.certificates,
    };
  });

  const router = useRouteMatch<{ name: string }>();
  const domain = domains.find((x) => x.name === router.params.name);

  const [checkTXT, setCheckTXT] = useState(false);
  const [checkCNAME, setCheckCNAME] = useState(false);

  if (isLoading && !isFirstLoaded) {
    return <Loading />;
  }

  if (!domain) {
    return <Box p={2}>no such domain</Box>;
  }

  const cert = certificates.find((x) => x.domains.length === 1 && x.domains[0] === domain.domain);

  const renderHelper = (domain: string, type: string, target: string) => {
    return (
      <CollapseWrapper title="How to check if I have configured the record correctly">
        <Box mt={2}>
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

  const steps: { title: string; content: React.ReactNode; completed: boolean }[] = [
    {
      title: "Open your domain DNS config panel",
      content: <Box>Log in to your registrar account, and navigate to DNS config panel.</Box>,
      completed: false,
    },
    {
      title: `Verify your domain by adding a TXT record.`,
      content: (
        <Box>
          <Box mt={2}>Add a TXT Record in your DNS config panel you just open.</Box>
          <Box mt={2}>
            <DNSConfigItems
              items={[
                {
                  domain: domain.domain,
                  type: "TXT",
                  cnameRecord: domain.txt,
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

          <Box mt={2}>{renderHelper(domain.domain, "TXT", domain.txt)}</Box>
          <Box mt={2} display="flex" flexDirection="row">
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => {
                setCheckTXT(true);
              }}
            >
              Check TXT Status
            </Button>
            {checkTXT && (
              <Box pl={2} display="flex">
                <DomainStatus status={domain.txtStatus} />
              </Box>
            )}
          </Box>
        </Box>
      ),
      completed: domain.txtStatus === "ready",
    },
  ];

  if (domain.domain.startsWith("*") && cert) {
    const certDomains = cert.wildcardCertDNSChallengeDomainMap;
    if (certDomains) {
      const firsKey = Object.keys(certDomains)[0];
      const firstDomain = `_acme-challenge.${Object.keys(certDomains)[0]}`;
      const firstTarget = certDomains[firsKey];
      steps.push({
        title: `Apply a certificate`,
        content: (
          <Box>
            <Box mt={2}>Add a CNAME Record in your DNS config panel.</Box>
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
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => {
                  setCheckCNAME(true);
                }}
              >
                Check CNAME Status
              </Button>
              {checkCNAME && (
                <Box pl={2} display="flex">
                  <CertStatus cert={cert} />
                </Box>
              )}
            </Box>
          </Box>
        ),
        completed: cert.ready === "True",
      });
    }
  }

  steps.push({
    title: `Configure ${domain.recordType} record to allow traffic to enter your cluster.`,
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
                cnameRecord: domain.target,
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

        <Box mt={2}>{renderHelper(domain.domain, domain.recordType, domain.target)}</Box>
      </Box>
    ),
    completed: domain.status === "ready",
  });

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
