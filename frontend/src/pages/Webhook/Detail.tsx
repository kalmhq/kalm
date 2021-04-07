import { createStyles, Tab, Tabs, Theme, withStyles, WithStyles } from "@material-ui/core";
import Box from "@material-ui/core/Box";
import { deleteDeployAccessTokenAction } from "actions/deployAccessToken";
import { setSuccessNotificationAction } from "actions/notification";
import clsx from "clsx";
import { push } from "connected-react-router";
import copy from "copy-to-clipboard";
import { withDeployAccessTokens, WithDeployAccessTokensProps } from "hoc/withDeployAccessTokens";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import {
  DeployAccessToken,
  DeployAccessTokenScopeCluster,
  DeployAccessTokenScopeComponent,
  DeployAccessTokenScopeNamespace,
} from "types/deployAccessToken";
import { CodeBlock } from "widgets/CodeBlock";
import { CopyIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { KPanel } from "widgets/KPanel";
import { Body2, Subtitle2 } from "widgets/Label";
import { Loading } from "widgets/Loading";
import { ResourceNotFound } from "widgets/ResourceNotFound";
import { RichEditor } from "widgets/RichEditor";

const TAB_CURL = "curl";
const TAB_GITHUB_ACTION = "Github Action";
const TAB_CIRCLE_CI_ORD = "CircleCI orb";
const tabs = [TAB_CURL, TAB_GITHUB_ACTION, TAB_CIRCLE_CI_ORD];

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    // TODO. This is copy from componentLike form index.tsx. We need a tab widget.
    tabsRoot: {
      "& .MuiButtonBase-root": {
        minWidth: "auto",
      },
    },
    borderBottom: {
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
  });

const mapStateToProps = (_state: any, { location }: RouteComponentProps<{ name: string }>) => {
  const anchor = location.hash.replace("#", "");
  const currentTabIndex = tabs.map((t) => t.replace(/\s/g, "")).indexOf(`${anchor}`);

  return {
    currentTabIndex: currentTabIndex < 0 ? 0 : currentTabIndex,
  };
};

interface Props
  extends WithStyles<typeof styles>,
    WithDeployAccessTokensProps,
    ReturnType<typeof mapStateToProps>,
    RouteComponentProps<{ name: string }> {}

class DeployAccessTokenDetailPageRaw extends React.PureComponent<Props> {
  private handleDelete = () => {
    const { dispatch } = this.props;
    const deployAccessToken = this.getDeployAccessToken();

    if (!deployAccessToken) {
      return;
    }

    dispatch(deleteDeployAccessTokenAction(deployAccessToken));
  };

  private getDeployAccessToken = () => {
    const { deployAccessTokens, match } = this.props;
    return deployAccessTokens.find((x) => x.name === match.params.name);
  };

  private renderContent = () => {
    const deployAccessToken = this.getDeployAccessToken();

    if (!deployAccessToken) {
      return null;
    }

    return (
      <Box p={2}>
        <KPanel title={`Basic Info`}>
          <Box p={2}>
            <Box>
              <Body2>The key is the identity used to call the webhook to restart components.</Body2>
            </Box>
            <Box mt={2}>{this.renderDeployAccessTokenScope(deployAccessToken)}</Box>
            {this.renderCopy(deployAccessToken)}
          </Box>
        </KPanel>

        <Box mt={2}>
          <KPanel>
            {this.renderTabs()}
            <Box p={2}>
              <Box mt={2}>{this.renderTabDetails(deployAccessToken)}</Box>
            </Box>
          </KPanel>
        </Box>

        <Box mt={2}>
          <KPanel title={`Webhook api spec`}>
            <Box p={2}>
              <Box>
                <Body2>Send a POST http request to the webhook endpoint to restart a component.</Body2>
              </Box>
              <Box mt={2}>
                <Subtitle2>Endpoint</Subtitle2>
                <Box mt={2} ml={2}>
                  <CodeBlock>{`POST https://<your-kalm-host>/webhooks/components`}</CodeBlock>
                </Box>
              </Box>
              <Box mt={2}>
                <Subtitle2>Content-Type</Subtitle2>
                <Box mt={2} ml={2}>
                  <CodeBlock>application/json</CodeBlock>
                </Box>
              </Box>
              <Box mt={2}>
                <Subtitle2>Body Params</Subtitle2>
                <Box mt={2} ml={2}>
                  <CodeBlock>{`{
  "application":   "<application-name>",     // (Required) application name of this component.
  "componentName": "<component-name>",       // (Required) component name.
  "imageTag":      "v1.2"                    // (Optional) If not blank, the component image tag will be updated.
}`}</CodeBlock>
                </Box>
              </Box>
              <Box mt={2}>
                <Subtitle2>Response status code</Subtitle2>
                <Box mt={2} ml={2}>
                  <CodeBlock>
                    {`
                    200 Success.      The component is successfully restart.
                    401 Unauthorized. Wrong key or the key is not granted for the component.
                    404 Not Found.    The application or component doesn't exist.
                    `}
                  </CodeBlock>
                </Box>
              </Box>
            </Box>
          </KPanel>
        </Box>
      </Box>
    );
  };

  // TODO. PushToTab, renderTabs, renderTabDetails are copied from componentLike form index.tsx. We need a tab widget.
  private pushToTab(tabIndex: number) {
    const tab = tabs[tabIndex];
    const {
      dispatch,
      location: { pathname },
    } = this.props;

    dispatch(push(`${pathname}#${tab ? tab.replace(/\s/g, "") : ""}`));
  }

  private renderTabs() {
    const { classes, currentTabIndex } = this.props;
    return (
      <Tabs
        className={clsx(classes.borderBottom, classes.tabsRoot)}
        value={currentTabIndex}
        variant="scrollable"
        scrollButtons="auto"
        indicatorColor="primary"
        textColor="primary"
        onChange={(event: React.ChangeEvent<{}>, value: number) => {
          this.pushToTab(value);
        }}
        aria-label="component form tabs"
      >
        {tabs.map((tab) => {
          return <Tab key={tab} label={tab} />;
        })}
      </Tabs>
    );
  }

  private renderCopy = (deployAccessToken: DeployAccessToken) => {
    const { dispatch } = this.props;
    const key = deployAccessToken.token;
    return (
      <Box mt={2}>
        <Subtitle2>Copy key</Subtitle2>
        {"****" + key.slice(key.length - 4)}
        <Box ml={2} mt={2} display="inline-block">
          <IconButtonWithTooltip
            tooltipTitle="Copy"
            size="small"
            aria-label="copy"
            onClick={() => {
              copy(key);
              dispatch(setSuccessNotificationAction("Copied successful!"));
            }}
          >
            <CopyIcon fontSize="small" />
          </IconButtonWithTooltip>
        </Box>
      </Box>
    );
  };

  private renderTabDetails(deployAccessToken: DeployAccessToken) {
    const { currentTabIndex } = this.props;

    const curl = `curl -X POST \\
    -H "Content-Type: application/json" \\
    -H "Authorization: Bearer ${deployAccessToken.token}" \\
    -d '{
      "application":   "<application-name>",
      "componentName": "<component-name>",
      "imageTag":      "<image-tag>"
    }' \\
    https://<your-kalm-host>/webhooks/components`;

    const githubAction = `name: Call Kalm Deploy Webhook

on:
  push:
    branches:
      - master

jobs:
  deploy_job:
    runs-on: ubuntu-latest
    name: A job to deploy new Kalm Component
    steps:
      - name: Use Deploy Action
        uses: kalmhq/kalm-deploy-action@v0.0.3
        id: deploy
        with:
          KALM_API_ADDRESS: \${{ secrets.KALM_API_ADDRESS }}
          KALM_DEPLOY_KEY: \${{ secrets.KALM_DEPLOY_KEY }}
          KALM_APP: <application-name>
          KALM_COMPONENT: <component-name>
          KALM_COMPONENT_IMG_TAG: <image-tag>
      - name: output of step deploy
        run: echo 'The callback response was \${{ steps.deploy.outputs.resp }}.'
`;

    const circleCIOrb = `orbs:
  deploy-orb: kalmhq-ns1/deploy-orb@dev:0.0.3
jobs:
  # ... other jobs
  deploy:
    executor: deploy-orb/default
    steps:
      - deploy-orb/deploy:
          KALM_API_ADDRESS: $KALM_API_ADDRESS
          KALM_DEPLOY_KEY: $KALM_DEPLOY_KEY
          KALM_APP: <application-name>
          KALM_COMPONENT: <component-name>
          KALM_COMPONENT_IMG_TAG: <image-tag>
workflows:
  version: 2
  dashboard:
    jobs:
      # ... other jobs
      - deploy:
          context: deploy-context
`;

    return (
      <>
        <Box display={tabs[currentTabIndex] === TAB_CURL ? "block" : "none"}>
          <Body2>
            Copy the following command and modify the content in angle brackets. Then try the edited command in a shell.
          </Body2>
          <Box mt={2}>
            <RichEditor mode="bash" value={curl} height="280px" wrapEnabled />
          </Box>
        </Box>
        <Box display={tabs[currentTabIndex] === TAB_GITHUB_ACTION ? "block" : "none"}>
          <Body2>
            Copy the following action configs into your github action workflow. Remember to add{" "}
            <strong>KALM_API_ADDRESS</strong> and <strong>KALM_DEPLOY_KEY</strong> into your github project secrets. Set{" "}
            <strong>{`<application-name>`}</strong>, <strong>{`<component-name>`}</strong> and{" "}
            <strong>{`<image-tag>`}</strong> as needed.
          </Body2>
          {this.renderCopy(deployAccessToken)}
          <Box mt={2}>
            <RichEditor mode="yaml" value={githubAction} height="400px" wrapEnabled tabSize={2} />
          </Box>
        </Box>
        <Box display={tabs[currentTabIndex] === TAB_CIRCLE_CI_ORD ? "block" : "none"}>
          <Body2>
            Copy the following job config into your Circle CI workflow. In the example, you need to create a context
            called <strong>deploy-context</strong>, then set <strong>KALM_API_ADDRESS</strong> and{" "}
            <strong>KALM_DEPLOY_KEY</strong> as environment variables. Set <strong>{`<application-name>`}</strong>,{" "}
            <strong>{`<component-name>`}</strong> and <strong>{`<image-tag>`}</strong> as needed.
          </Body2>
          {this.renderCopy(deployAccessToken)}
          <Box mt={2}>
            <RichEditor mode="yaml" value={circleCIOrb} height="350px" wrapEnabled tabSize={2} />
          </Box>
        </Box>
      </>
    );
  }

  private renderDeployAccessTokenScope = (deployAccessToken: DeployAccessToken) => {
    if (deployAccessToken.scope === DeployAccessTokenScopeCluster) {
      return (
        <Body2>
          Its granted scope is <strong>Cluster</strong>.
        </Body2>
      );
    } else if (deployAccessToken.scope === DeployAccessTokenScopeNamespace) {
      return (
        <>
          <Body2>
            Its granted scope is <strong>Specific Applications</strong>:
          </Body2>
          <Box pl={2} mt={1}>
            {deployAccessToken.resources.map((x) => (
              <Box key={x}>
                <strong>{x}</strong>
              </Box>
            ))}
          </Box>
        </>
      );
    } else if (deployAccessToken.scope === DeployAccessTokenScopeComponent) {
      return (
        <>
          <Body2>
            Its granted scope is <strong>Specific Components</strong>:
          </Body2>
          <Box pl={2} mt={1}>
            {deployAccessToken.resources.map((x) => (
              <Box key={x}>
                <strong>{x}</strong>
              </Box>
            ))}
          </Box>
        </>
      );
    }
  };

  public render() {
    const { deployAccessTokens, isLoading, loaded, match } = this.props;

    if (!loaded && isLoading) {
      return (
        <Box p={2}>
          <Loading />
        </Box>
      );
    }

    const deployAccessToken = deployAccessTokens.find((x) => x.name === match.params.name);

    if (!deployAccessToken) {
      return (
        <BasePage>
          <Box p={2}>
            <ResourceNotFound
              text={`Webhook ${match.params.name} not found.`}
              redirect={`/applications`}
              redirectText="Go back to Apps List"
            ></ResourceNotFound>
          </Box>
        </BasePage>
      );
    }

    return (
      <BasePage
        secondHeaderRight={
          <>
            {/* <Button
              component={Link}
              color="primary"
              variant="outlined"
              size="small"
              to={`/webhooks/keys/${deployAccessToken.name}/edit`}
            >
              Edit
            </Button> */}
            <DeleteButtonWithConfirmPopover
              useText
              popupId="delete-webhook-popup"
              popupTitle="DELETE WEBHOOK?"
              confirmedAction={this.handleDelete}
            />
          </>
        }
      >
        {this.renderContent()}
      </BasePage>
    );
  }
}

export const DeployAccessTokenDetailPage = withStyles(styles)(
  withRouter(connect(mapStateToProps)(withDeployAccessTokens(DeployAccessTokenDetailPageRaw))),
);
