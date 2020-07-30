import React from "react";
import { Box, Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { BasePage } from "pages/BasePage";
import { CIIcon, CopyIcon } from "widgets/Icon";
import { indigo } from "@material-ui/core/colors";
import { CustomizedButton, DangerButton } from "widgets/Button";
import { Link } from "react-router-dom";
import { withDeployKeys, WithDeployKeysProps } from "hoc/withDeployKeys";
import { KTable } from "widgets/Table";
import { DeployKey, DeployKeyScopeCluster, DeployKeyScopeComponent, DeployKeyScopeNamespace } from "types/deployKey";
import { Loading } from "widgets/Loading";
import { deleteDeployKeyAction } from "actions/deployKey";
import copy from "copy-to-clipboard";
import { setSuccessNotificationAction } from "actions/notification";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { InfoBox } from "widgets/InfoBox";
import { BlankTargetLink } from "widgets/BlankTargetLink";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import sc from "utils/stringConstants";
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
    return rowData.get("name");
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
        return resoureces.map((r) => <Box>{r}</Box>).toArray();
      }
      case DeployKeyScopeComponent: {
        return resoureces.map((r) => <Box>{r}</Box>).toArray();
      }
    }
  };

  private renderActions = (rowData: DeployKey) => {
    const { dispatch } = this.props;
    return (
      <DangerButton
        variant="outlined"
        size="small"
        onClick={() => {
          dispatch(deleteDeployKeyAction(rowData));
        }}
      >
        Delete
      </DangerButton>
    );
  };

  private renderKey = (rowData: DeployKey) => {
    if (rowData.get("key") === "") {
      return <Loading />;
    }

    const key = rowData.get("key");
    return (
      <Box>
        {"****" + key.slice(key.length - 4)}
        <Box ml={1} display="inline-block">
          <IconButtonWithTooltip
            tooltipTitle="Copy"
            size="small"
            aria-label="copy"
            onClick={() => {
              copy(key);
              this.props.dispatch(setSuccessNotificationAction("Copied successful!"));
            }}
          >
            <CopyIcon fontSize="small" />
          </IconButtonWithTooltip>
        </Box>
      </Box>
    );
  };

  private renderInfoBox() {
    return (
      <Box mt={2}>
        <InfoBox
          title="You can call webhook directly. In addition, we also provide some out-of-the-box tools to help you connect with commonly used CI tools."
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
              title: "Key",
              field: "key",
              sorting: false,
              render: this.renderKey,
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
