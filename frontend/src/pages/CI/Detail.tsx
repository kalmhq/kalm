import React from "react";
import { Button, createStyles, Tab, Tabs, Theme, withStyles, WithStyles } from "@material-ui/core";
import { withDeployKeys, WithDeployKeysProps } from "hoc/withDeployKeys";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { Loading } from "widgets/Loading";
import Box from "@material-ui/core/Box";
import { BasePage } from "pages/BasePage";
import { deleteDeployKeyAction } from "actions/deployKey";
import { KPanel } from "widgets/KPanel";
import { Body2, Subtitle2 } from "widgets/Label";
import { DeployKey, DeployKeyScopeCluster, DeployKeyScopeComponent, DeployKeyScopeNamespace } from "types/deployKey";
import { push } from "connected-react-router";
import { connect } from "react-redux";
import clsx from "clsx";
import { RichEdtor } from "widgets/RichEditor";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import copy from "copy-to-clipboard";
import { setSuccessNotificationAction } from "actions/notification";
import { CopyIcon } from "widgets/Icon";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";

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
      borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
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
    WithDeployKeysProps,
    ReturnType<typeof mapStateToProps>,
    RouteComponentProps<{ name: string }> {}

class DeployKeyDetailPageRaw extends React.PureComponent<Props> {
  private handleDelete = () => {
    const { dispatch } = this.props;
    const deployKey = this.getDeployKey();

    if (!deployKey) {
      return;
    }

    dispatch(deleteDeployKeyAction(deployKey));
  };

  private getDeployKey = () => {
    const { deployKeys, match } = this.props;
    return deployKeys.find((x) => x.get("name") === match.params.name);
  };

  private renderContent = () => {
    const deployKey = this.getDeployKey();

    if (!deployKey) {
      return null;
    }

    return (
      <Box p={2}>
        <KPanel title={`Basic Info`}>
          <Box p={2}>
            <Box>
              <Body2>The key is the identity used to call the webhook to restart components.</Body2>
            </Box>
            <Box mt={2}>{this.renderDeployKeyScope(deployKey)}</Box>
            {this.renderCopyKey(deployKey)}
          </Box>
        </KPanel>

        <Box mt={2}>
          <KPanel title={`Webhook`}>
            <Box p={2}>
              <Box>
                <Body2>Send a POST http request to the webhook endpoint to restart a component.</Body2>
              </Box>
              <Box mt={2}>
                <Subtitle2>Endpoint</Subtitle2>
                <Box mt={2} ml={2}>
                  <pre>{`POST https://<your-kalm-host>/webhook/components`}</pre>
                </Box>
              </Box>
              <Box mt={2}>
                <Subtitle2>Content-Type</Subtitle2>
                <Box mt={2} ml={2}>
                  <pre>application/json</pre>
                </Box>
              </Box>
              <Box mt={2}>
                <Subtitle2>Body Params</Subtitle2>
                <Box mt={2} ml={2}>
                  <pre>{`{
  "deployKey":     "<key>",                  // (Required) this key value.
  "application":   "<application-name>",     // (Required) application name of this component.
  "componentName": "<component-name>",       // (Required) component name.
  "imageTag":      "v1.2"                    // (Optional) If not blank, the component image tag will be updated.
}`}</pre>
                </Box>
              </Box>
              <Box mt={2}>
                <Subtitle2>Response status code</Subtitle2>
                <Box mt={2} ml={2}>
                  <pre>{`200 Success.      The component is successfully restart.`}</pre>
                  <pre>{`401 Unauthorized. Wrong key or the key is not granted for the component.`}</pre>
                  <pre>{`404 Not Found.    The application or component is not exist.`}</pre>
                </Box>
              </Box>
            </Box>
          </KPanel>
        </Box>

        <Box mt={2}>
          <KPanel>
            {this.renderTabs()}
            <Box p={2}>
              <Box mt={2}>{this.renderTabDetails(deployKey)}</Box>
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
          return <Tab key={tab} label={tab} tutorial-anchor-id={tab} />;
        })}
      </Tabs>
    );
  }

  private renderCopyKey = (deployKey: DeployKey) => {
    const { dispatch } = this.props;
    const key = deployKey.get("key");
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

  private renderTabDetails(deployKey: DeployKey) {
    const { currentTabIndex } = this.props;

    const curl = `curl -X POST \\
    -H "Content-Type: application/json" \\
    -d '{
      "deployKey":     "${deployKey.get("key")}",
      "application":   "<application-name>",
      "componentName": "<component-name>",
      "imageTag":      "<image-tag>"
    }' \\
    https://<your-kalm-host>/webhook/components`;

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
        uses: kalmhq/kalm-deploy-action@v0.0.2
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
  deploy-orb: kalmhq-ns1/deploy-orb@dev:0.0.2
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
            <RichEdtor mode="bash" value={curl} height="280px" wrapEnabled />
          </Box>
        </Box>
        <Box display={tabs[currentTabIndex] === TAB_GITHUB_ACTION ? "block" : "none"}>
          <Body2>
            Copy the following action configs into your github action workflow. Remember to add{" "}
            <strong>KALM_API_ADDRESS</strong> and <strong>KALM_DEPLOY_KEY</strong> into your github project secrets. Set{" "}
            <strong>{`<application-name>`}</strong>, <strong>{`<component-name>`}</strong> and{" "}
            <strong>{`<image-tag>`}</strong> as needed.
          </Body2>
          {this.renderCopyKey(deployKey)}
          <Box mt={2}>
            <RichEdtor mode="yaml" value={githubAction} height="400px" wrapEnabled tabSize={2} />
          </Box>
        </Box>
        <Box display={tabs[currentTabIndex] === TAB_CIRCLE_CI_ORD ? "block" : "none"}>
          <Body2>
            Copy the following job config into your Circle CI workflow. In the example, you need to create a context
            called <strong>deploy-context</strong>, then set <strong>KALM_API_ADDRESS</strong> and{" "}
            <strong>KALM_DEPLOY_KEY</strong> as environment variables. Set <strong>{`<application-name>`}</strong>,{" "}
            <strong>{`<component-name>`}</strong> and <strong>{`<image-tag>`}</strong> as needed.
          </Body2>
          {this.renderCopyKey(deployKey)}
          <Box mt={2}>
            <RichEdtor mode="yaml" value={circleCIOrb} height="350px" wrapEnabled tabSize={2} />
          </Box>
        </Box>
      </>
    );
  }

  private renderDeployKeyScope = (deployKey: DeployKey) => {
    if (deployKey.get("scope") === DeployKeyScopeCluster) {
      return (
        <Body2>
          Its granted scope is <strong>Cluster</strong>.
        </Body2>
      );
    } else if (deployKey.get("scope") === DeployKeyScopeNamespace) {
      return (
        <>
          <Body2>
            Its granted scope is <strong>Specific Applications</strong>:
          </Body2>
          <Box pl={2} mt={1}>
            {deployKey
              .get("resources")
              .map((x) => (
                <Box key={x}>
                  <strong>{x}</strong>
                </Box>
              ))
              .toArray()}
          </Box>
        </>
      );
    } else if (deployKey.get("scope") === DeployKeyScopeComponent) {
      return (
        <>
          <Body2>
            Its granted scope is <strong>Specific Components</strong>:
          </Body2>
          <Box pl={2} mt={1}>
            {deployKey
              .get("resources")
              .map((x) => (
                <Box key={x}>
                  <strong>{x}</strong>
                </Box>
              ))
              .toArray()}
          </Box>
        </>
      );
    }
  };

  public render() {
    const { deployKeys, isLoading, loaded, match } = this.props;

    if (!loaded && isLoading) {
      return (
        <Box p={2}>
          <Loading />
        </Box>
      );
    }

    const deployKey = deployKeys.find((x) => x.get("name") === match.params.name);

    if (!deployKey) {
      return <Box p={2}>Deploy key "${match.params.name}" not found.</Box>;
    }

    return (
      <BasePage
        secondHeaderRight={
          <>
            <Button
              component={Link}
              color="primary"
              variant="outlined"
              size="small"
              to={`/ci/keys/${deployKey.get("name")}/edit`}
            >
              Edit
            </Button>
            <DeleteButtonWithConfirmPopover
              useText
              popupId="delete-ci-popup"
              popupTitle="DELETE CI?"
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

export const DeployKeyDetailPage = withStyles(styles)(
  withRouter(connect(mapStateToProps)(withDeployKeys(DeployKeyDetailPageRaw))),
);
