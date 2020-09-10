import { Box, Button, createStyles, Theme, Typography, WithStyles, withStyles } from "@material-ui/core";
import { indigo } from "@material-ui/core/colors";
import { deleteDeployKeyAction } from "actions/deployKey";
import { blinkTopProgressAction } from "actions/settings";
import { withDeployKeys, WithDeployKeysProps } from "hoc/withDeployKeys";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { DeployKey, DeployKeyScopeCluster, DeployKeyScopeComponent, DeployKeyScopeNamespace } from "types/deployKey";
import sc from "utils/stringConstants";
import { BlankTargetLink } from "widgets/BlankTargetLink";
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

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, WithDeployKeysProps {}

interface State {}

class CIPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private renderEmpty() {
    return (
      <EmptyInfoBox
        image={<CIIcon style={{ height: 120, width: 120, color: indigo[200] }} />}
        title={sc.EMPTY_CI_TITLE}
        content={sc.EMPTY_CI_SUBTITLE}
        button={
          <CustomizedButton component={Link} variant="contained" to="/ci/keys/new" color="primary">
            New Deploy Key
          </CustomizedButton>
        }
      />
    );
  }

  private renderName = (rowData: DeployKey) => {
    return <Typography variant="subtitle2">{rowData.name}</Typography>;
  };

  private renderScope = (rowData: DeployKey) => {
    switch (rowData.scope) {
      case DeployKeyScopeCluster: {
        return "Cluster";
      }
      case DeployKeyScopeNamespace: {
        return "Specific Applications";
      }
      case DeployKeyScopeComponent: {
        return "Specific Components";
      }
    }
  };

  private renderResources = (rowData: DeployKey) => {
    const resoureces = rowData.resources;

    switch (rowData.scope) {
      case DeployKeyScopeCluster: {
        return "-";
      }
      case DeployKeyScopeNamespace: {
        return resoureces.map((r) => <Box key={r}>{r}</Box>);
      }
      case DeployKeyScopeComponent: {
        return resoureces.map((r) => <Box key={r}>{r}</Box>);
      }
    }
  };

  private renderActions = (rowData: DeployKey) => {
    const { dispatch } = this.props;
    return (
      <>
        <IconLinkWithToolTip
          onClick={() => {
            blinkTopProgressAction();
          }}
          // size="small"
          tooltipTitle="Details"
          to={`/ci/keys/${rowData.name}`}
        >
          <KalmDetailsIcon />
        </IconLinkWithToolTip>
        <DeleteButtonWithConfirmPopover
          popupId="delete-ci-popup"
          popupTitle="DELETE CI?"
          confirmedAction={() => dispatch(deleteDeployKeyAction(rowData))}
        />
      </>
    );
  };

  private renderInfoBox() {
    return (
      <Box mt={2}>
        <InfoBox
          title={sc.CI_INFO_BOX_TEXT}
          options={[
            {
              title: <BlankTargetLink href="https://kalm.dev">Use webhook (fix the link)</BlankTargetLink>,
              content: "",
            },
            {
              title: <BlankTargetLink href="https://kalm.dev">Use Kalm orb in CircleCI (fix the link)</BlankTargetLink>,
              content: "",
            },
            {
              title: (
                <BlankTargetLink href="https://kalm.dev">
                  Use Kalm action in Github Actions (fix the link)
                </BlankTargetLink>
              ),
              content: "",
            },
          ]}
        />
      </Box>
    );
  }

  private getKRTableColumns() {
    return [
      {
        Header: "Name",
        accessor: "name",
      },
      {
        Header: "Scope",
        accessor: "scope",
      },
      {
        Header: "Resources",
        accessor: "resources",
      },
      {
        Header: "Action",
        accessor: "actions",
      },
    ];
  }

  private getKRTableData() {
    const { deployKeys } = this.props;
    const data: any[] = [];

    deployKeys &&
      deployKeys.forEach((deployKey, index) => {
        const rowData = deployKey;
        data.push({
          name: this.renderName(rowData),
          scope: this.renderScope(rowData),
          resources: this.renderResources(rowData),
          actions: this.renderActions(rowData),
        });
      });

    return data;
  }

  private renderKRTable() {
    return <KRTable showTitle={true} title="CI/CD" columns={this.getKRTableColumns()} data={this.getKRTableData()} />;
  }

  private renderContent = () => {
    const { deployKeys, isLoading, loaded } = this.props;

    if (!loaded && isLoading) {
      return (
        <Box p={2}>
          <Loading />
        </Box>
      );
    }

    return <Box p={2}>{deployKeys.length === 0 ? this.renderEmpty() : this.renderKRTable()}</Box>;
  };

  public render() {
    return (
      <BasePage
        secondHeaderRight={
          <>
            <Button component={Link} color="primary" variant="outlined" size="small" to="/ci/keys/new">
              New Deploy Key
            </Button>
          </>
        }
      >
        {this.renderContent()}
      </BasePage>
    );
  }
}

export const CIPage = withStyles(styles)(withDeployKeys(connect(mapStateToProps)(CIPageRaw)));
