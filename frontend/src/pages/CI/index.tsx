import React from "react";
import { Box, Button, createStyles, Theme, Typography, WithStyles, withStyles } from "@material-ui/core";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { BasePage } from "pages/BasePage";
import { CIIcon } from "widgets/Icon";
import { indigo } from "@material-ui/core/colors";
import { CustomizedButton } from "widgets/Button";
import { Link } from "react-router-dom";
import { withDeployKeys, WithDeployKeysProps } from "hoc/withDeployKeys";
import { KTable } from "widgets/Table";
import { DeployKey, DeployKeyScopeCluster, DeployKeyScopeComponent, DeployKeyScopeNamespace } from "types/deployKey";
import { Loading } from "widgets/Loading";
import { deleteDeployKeyAction } from "actions/deployKey";
import { InfoBox } from "widgets/InfoBox";
import { BlankTargetLink } from "widgets/BlankTargetLink";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import sc from "utils/stringConstants";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";

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
    return <Typography variant="subtitle2">{rowData.get("name")}</Typography>;
  };

  private renderScope = (rowData: DeployKey) => {
    switch (rowData.get("scope")) {
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
    const resoureces = rowData.get("resources");

    switch (rowData.get("scope")) {
      case DeployKeyScopeCluster: {
        return "-";
      }
      case DeployKeyScopeNamespace: {
        return resoureces.map((r) => <Box key={r}>{r}</Box>).toArray();
      }
      case DeployKeyScopeComponent: {
        return resoureces.map((r) => <Box key={r}>{r}</Box>).toArray();
      }
    }
  };

  private renderActions = (rowData: DeployKey) => {
    const { dispatch } = this.props;
    return (
      <>
        <Button
          component={Link}
          style={{ marginRight: 20 }}
          color="primary"
          size="small"
          variant="outlined"
          to={`/ci/keys/${rowData.get("name")}`}
        >
          Use
        </Button>
        <DeleteButtonWithConfirmPopover
          useText
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

  private renderDataTable = () => {
    const { deployKeys } = this.props;
    return (
      <>
        <KTable
          options={{
            paging: deployKeys.size > 20,
          }}
          columns={[
            {
              title: "Name",
              field: "name",
              sorting: false,
              render: this.renderName,
            },
            {
              title: "Scope",
              field: "scope",
              sorting: false,
              render: this.renderScope,
            },
            {
              title: "Resources",
              field: "resources",
              sorting: false,
              render: this.renderResources,
            },

            {
              title: "Action",
              field: "action",
              sorting: false,
              render: this.renderActions,
            },
          ]}
          data={deployKeys.toArray()}
        />
        {this.renderInfoBox()}
      </>
    );
  };

  private renderContent = () => {
    const { deployKeys, isLoading, loaded } = this.props;

    if (!loaded && isLoading) {
      return (
        <Box p={2}>
          <Loading />
        </Box>
      );
    }

    return <Box p={2}>{deployKeys.size === 0 ? this.renderEmpty() : this.renderDataTable()}</Box>;
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
