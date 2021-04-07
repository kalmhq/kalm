import { Box } from "@material-ui/core";
import React from "react";
import { Certificate, dns01Issuer } from "types/certificate";
import { DNSConfigItems } from "widgets/ACMEServer";
import { PendingBadge } from "widgets/Badge";
import { BlankTargetLink } from "widgets/BlankTargetLink";
import { FlexRowItemCenterBox } from "widgets/Box";
import { KPanel } from "widgets/KPanel";
import { DNS01ChallengeLink } from "widgets/Link";
import { SuccessColorText } from "widgets/Text";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";

interface Props {
  cert: Certificate;
}

const CertificateInfoRaw: React.FC<Props> = (props) => {
  const renderStatus = (cert: Certificate) => {
    if (cert.ready === "True") {
      // why the ready field is a string value ?????
      return (
        <FlexRowItemCenterBox>
          <FlexRowItemCenterBox>
            <SuccessColorText>Normal</SuccessColorText>
          </FlexRowItemCenterBox>
        </FlexRowItemCenterBox>
      );
    } else if (!!cert.reason) {
      return (
        <FlexRowItemCenterBox>
          <FlexRowItemCenterBox mr={1}>
            <PendingBadge />
          </FlexRowItemCenterBox>
          <FlexRowItemCenterBox>{cert.reason}</FlexRowItemCenterBox>
        </FlexRowItemCenterBox>
      );
    } else {
      return <PendingBadge />;
    }
  };

  const { cert } = props;

  const isDNS01ChallengeType = !(!cert.isSelfManaged && cert.httpsCertIssuer === "default-http01-issuer");

  const renderDNSTables = () => {
    if (cert.httpsCertIssuer !== dns01Issuer) {
      return null;
    }

    const domains = cert.wildcardCertDNSChallengeDomainMap;

    if (domains) {
      return (
        <>
          <DNSConfigItems
            items={Object.keys(domains).map((domain) => ({
              domain: `_acme-challenge.${domain}`,
              type: "CNAME",
              cnameRecord: domains[domain],
            }))}
          />
        </>
      );
    }

    return null;
  };

  return (
    <KPanel title="Certificate Info">
      <Box p={2}>
        <VerticalHeadTable
          items={[
            { name: "Name", content: cert.name },
            {
              name: "Type",
              content: cert?.isSelfManaged ? "Uploaded" : "Let's Encrypt",
            },
            {
              name: "Challenge Type",
              content: !isDNS01ChallengeType ? (
                <BlankTargetLink href={"https://letsencrypt.org/docs/challenge-types/#http-01-challenge"}>
                  HTTP-01 challenge
                </BlankTargetLink>
              ) : (
                <DNS01ChallengeLink />
              ),
            },
            { name: "Status", content: renderStatus(cert) },
          ]}
        />
        <Box mt={2}>{renderDNSTables()}</Box>
      </Box>
    </KPanel>
  );
};

export const CertificateInfo = CertificateInfoRaw;
