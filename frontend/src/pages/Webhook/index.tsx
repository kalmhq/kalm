import { Box, createStyles, Link as KMLink, Theme, Typography, WithStyles, withStyles } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import { deleteDeployAccessTokenAction } from "actions/deployAccessToken";
import { blinkTopProgressAction } from "actions/settings";
import { withDeployAccessTokens, WithDeployAccessTokensProps } from "hoc/withDeployAccessTokens";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import CustomButton from "theme/Button";
import {
  DeployAccessToken,
  DeployAccessTokenScopeCluster,
  DeployAccessTokenScopeComponent,
  DeployAccessTokenScopeNamespace,
} from "types/deployAccessToken";
import sc from "utils/stringConstants";
import { CustomizedButton } from "widgets/Button";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { CIIcon, KalmDetailsIcon } from "widgets/Icon";
import { IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { InfoBox } from "widgets/InfoBox";
import { KRTable } from "widgets/KRTable";
import { Loading } from "widgets/Loading";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props
  extends WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    WithDeployAccessTokensProps,
    WithNamespaceProps {}

interface State {}

class WebhookPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private renderEmpty() {
    return (
      <EmptyInfoBox
        image={<CIIcon style={{ height: 120, width: 120, color: grey[300] }} />}
        title={sc.EMPTY_WEBHOOK_TITLE}
        content={sc.EMPTY_WEBHOOK_SUBTITLE}
        button={
          this.canEdit() ? (
            <CustomizedButton component={Link} variant="contained" to="/webhooks/keys/new" color="primary">
              New Webhook
            </CustomizedButton>
          ) : null
        }
      />
    );
  }

  private renderMemo = (rowData: DeployAccessToken) => {
    return <Typography variant="subtitle2">{rowData.memo}</Typography>;
  };

  private renderScope = (rowData: DeployAccessToken) => {
    switch (rowData.scope) {
      case DeployAccessTokenScopeCluster: {
        return "Cluster";
      }
      case DeployAccessTokenScopeNamespace: {
        return "Specific Applications";
      }
      case DeployAccessTokenScopeComponent: {
        return "Specific Components";
      }
    }
  };

  private renderResources = (rowData: DeployAccessToken) => {
    const resoureces = rowData.resources;

    switch (rowData.scope) {
      case DeployAccessTokenScopeCluster: {
        return "-";
      }
      case DeployAccessTokenScopeNamespace: {
        return resoureces.map((r) => <Box key={r}>{r}</Box>);
      }
      case DeployAccessTokenScopeComponent: {
        return resoureces.map((r) => <Box key={r}>{r}</Box>);
      }
    }
  };

  private renderActions = (rowData: DeployAccessToken) => {
    const { dispatch } = this.props;
    return this.canEdit() ? (
      <>
        <IconLinkWithToolTip
          onClick={() => {
            blinkTopProgressAction();
          }}
          // size="small"
          tooltipTitle="Details"
          to={`/webhooks/keys/${rowData.name}`}
        >
          <KalmDetailsIcon />
        </IconLinkWithToolTip>
        <DeleteButtonWithConfirmPopover
          popupId="delete-ci-popup"
          popupTitle="DELETE CI?"
          confirmedAction={() => dispatch(deleteDeployAccessTokenAction(rowData))}
        />
      </>
    ) : null;
  };

  private getKRTableColumns() {
    const columns = [
      {
        Header: "Memo",
        accessor: "memo",
      },
      {
        Header: "Scope",
        accessor: "scope",
      },
      {
        Header: "Resources",
        accessor: "resources",
      },
    ];

    if (this.canEdit()) {
      columns.push({
        Header: "Action",
        accessor: "actions",
      });
    }

    return columns;
  }

  private getKRTableData() {
    const { deployAccessTokens } = this.props;
    const data: any[] = [];

    deployAccessTokens &&
      deployAccessTokens.forEach((deployAccessToken, index) => {
        const rowData = deployAccessToken;
        data.push({
          memo: this.renderMemo(rowData),
          scope: this.renderScope(rowData),
          resources: this.renderResources(rowData),
          actions: this.renderActions(rowData),
        });
      });

    return data;
  }

  private renderKRTable() {
    return <KRTable showTitle={true} title="Webhook" columns={this.getKRTableColumns()} data={this.getKRTableData()} />;
  }

  private renderContent = () => {
    const { deployAccessTokens, isLoading, loaded } = this.props;

    if (!loaded && isLoading) {
      return (
        <Box p={2}>
          <Loading />
        </Box>
      );
    }

    return <Box p={2}>{deployAccessTokens.length === 0 ? this.renderEmpty() : this.renderKRTable()}</Box>;
  };

  private canEdit() {
    return true;
  }

  private renderInfoBox() {
    const title = "References";

    const options = [
      {
        title: (
          <KMLink href="https://docs.kalm.dev/crd/component" target="_blank">
            How a webhook works?
          </KMLink>
        ),
        draft: true,
        content: "",
      },
    ];

    return (
      <Box pl={2} pr={2}>
        <InfoBox title={title} options={options} />
      </Box>
    );
  }

  public render() {
    return (
      <BasePage
        secondHeaderRight={
          this.canEdit() ? (
            <>
              <CustomButton component={Link} color="primary" variant="outlined" size="small" to="/webhooks/keys/new">
                New Webhook
              </CustomButton>
            </>
          ) : null
        }
      >
        {this.renderContent()}
        {/* {this.renderInfoBox()} */}
      </BasePage>
    );
  }
}

export const WebhookPage = withNamespace(
  withStyles(styles)(withDeployAccessTokens(connect(mapStateToProps)(WebhookPageRaw))),
);
