import Box from "@material-ui/core/Box/Box";
import Grid from "@material-ui/core/Grid/Grid";
import { Alert, AlertTitle } from "@material-ui/lab";
import { BasePage } from "pages/BasePage";
import { DomainStatus } from "pages/Domains/Status";
import React from "react";
import { useSelector } from "react-redux";
import { useRouteMatch } from "react-router-dom";
import { RootState } from "reducers";
import { CodeBlock } from "widgets/CodeBlock";
import { CollapseWrapper } from "widgets/CollapseWrapper";
import { KPanel } from "widgets/KPanel";
import { TextAndCopyButton } from "widgets/TextAndCopyButton";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";

const DomainDetailPageRaw: React.FC = () => {
  const { domains } = useSelector((state: RootState) => {
    return {
      domains: state.domains.domains,
    };
  });

  const router = useRouteMatch<{ name: string }>();
  const domain = domains.find((x) => x.name === router.params.name);

  if (!domain) {
    return <div>no such domain</div>;
  }

  const renderHelper = () => {
    return (
      <Box p={2}>
        <CollapseWrapper title="It's pending for a long time, how to debug?">
          <Box mt={2}>
            <p>Dig the your domain by executing following command in a terminal.</p>
            <Box ml={2}>
              <CodeBlock>
                <TextAndCopyButton text={`dig -t txt @8.8.8.8 ${domain.domain}`} />
              </CodeBlock>
              <p>
                if you can find a <strong>{domain.recordType}</strong> record in "ANSWER SECTION" with a value of{" "}
                <strong>{domain.target}</strong>, it means your DNS is added. The status will turn to "Ready" soon.
              </p>
              <p>
                Otherwise, your record is not working yet due to cache or misconfigured. Please check your DNS provider
                config.
              </p>
            </Box>
          </Box>
        </CollapseWrapper>
      </Box>
    );
  };

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
    <BasePage>
      <Box p={2}>
        <Grid container spacing={2}>
          <Grid item xs={8} sm={8} md={8}>
            <KPanel title="Domain Basic Info">
              <Box p={2}>{renderTable()}</Box>
            </KPanel>

            {!domain.isBuiltIn && (
              <Box mt={2}>
                <KPanel>
                  <Box>
                    {domain.status === "pending" ? (
                      <Alert square style={{ borderRadius: 0 }} severity="info">
                        <AlertTitle>Not finished yet</AlertTitle>
                        Add the following record in your DNS provider
                      </Alert>
                    ) : (
                      <Alert square style={{ borderRadius: 0 }} severity="success">
                        The following record is configured successfully
                      </Alert>
                    )}
                  </Box>

                  <Box p={2}>
                    <VerticalHeadTable
                      items={[
                        { name: "Name", content: <TextAndCopyButton text={domain.domain} /> },
                        { name: "Type", content: domain.recordType },
                        { name: "Record", content: <TextAndCopyButton text={domain.target} /> },
                      ]}
                    />
                  </Box>
                </KPanel>
              </Box>
            )}

            {domain.status === "pending" && (
              <Box mt={2}>
                <KPanel>{renderHelper()}</KPanel>
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    </BasePage>
  );
};

export const DomainDetailPage = DomainDetailPageRaw;
