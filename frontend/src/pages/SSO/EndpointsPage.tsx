import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { deleteProtectedEndpointAction } from "actions/sso";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { withSSO, WithSSOProps } from "hoc/withSSO";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
import { BasePage } from "pages/BasePage";
import React from "react";
import { Link } from "react-router-dom";
import { ProtectedEndpoint } from "types/sso";
import { CustomizedButton } from "widgets/Button";
import { EditIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { KRTable } from "widgets/KRTable";
import { Body } from "widgets/Label";
import { Loading } from "widgets/Loading";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles>, WithSSOProps, WithUserAuthProps, WithNamespaceProps {}

interface State {}

class EndpointsPageRaw extends React.PureComponent<Props, State> {
  private renderConfigDetails = () => {
    const { ssoConfig } = this.props;

    if (!ssoConfig) {
      return null;
    }

    return this.renderProtectedComponents();
  };

  private renderNamespace = (rowData: ProtectedEndpoint) => {
    return rowData.namespace;
  };

  private renderComponentName = (rowData: ProtectedEndpoint) => {
    return rowData.endpointName;
  };

  private renderComponentPorts = (rowData: ProtectedEndpoint) => {
    return !!rowData.ports && rowData.ports!.length > 0 ? rowData.ports!.join(", ") : "All";
  };

  private renderGrantedGroups = (rowData: ProtectedEndpoint) => {
    return !!rowData.groups && rowData.groups!.length > 0 ? rowData.groups!.join(", ") : "All";
  };

  private renderProtectedComponentActions = (rowData: ProtectedEndpoint) => {
    const { dispatch, canEditNamespace } = this.props;

    return canEditNamespace(rowData.name) ? (
      <>
        <IconButtonWithTooltip
          component={Link}
          to={"/endpoints/" + rowData.name + "/edit"}
          size="small"
          tooltipPlacement="top"
          tooltipTitle="Edit"
          aria-label="edit"
        >
          <EditIcon />
        </IconButtonWithTooltip>
        <DeleteButtonWithConfirmPopover
          popupId="delete-sso-popup"
          popupTitle="DELETE SSO?"
          confirmedAction={() => dispatch(deleteProtectedEndpointAction(rowData))}
        />
      </>
    ) : null;
  };

  private getKRTableColumns() {
    return [
      {
        Header: "Namespace",
        accessor: "namespace",
      },
      {
        Header: "Component",
        accessor: "component",
      },
      {
        Header: "Ports",
        accessor: "ports",
      },
      {
        Header: "Granted groups",
        accessor: "grantedGroups",
      },
      { Header: "Actions", accessor: "actions" },
    ];
  }

  private getKRTableData() {
    const { protectedEndpoints } = this.props;
    const data: any[] = [];

    protectedEndpoints.forEach((rowData, index) => {
      data.push({
        namespace: this.renderNamespace(rowData),
        component: this.renderComponentName(rowData),
        ports: this.renderComponentPorts(rowData),
        grantedGroups: this.renderGrantedGroups(rowData),
        actions: this.renderProtectedComponentActions(rowData),
      });
    });

    return data;
  }

  private renderKRTable() {
    return <KRTable columns={this.getKRTableColumns()} data={this.getKRTableData()} />;
  }

  private renderProtectedComponents() {
    return this.renderKRTable();
  }

  private renderEmptyText = () => {
    const { canEditCluster } = this.props;
    return (
      <Box>
        <Body>
          <strong>To use Protected Endpoints feature, you need enable Single Sign-on First.</strong>
        </Body>
        <Body>
          The <strong>single sign-on</strong> feature allows you to configure access permissions for private components.
          Only users with the permissions you configured can access the resources behind. <br />
          Kalm SSO will integrate with your existing user system, such as <strong>github</strong>,{" "}
          <strong>gitlab</strong>, <strong>google</strong>, etc.
        </Body>
        {canEditCluster() ? (
          <Box mt={2} width={300}>
            <CustomizedButton component={Link} to="/sso/config" variant="contained" color="primary">
              Enable Single Sign-on
            </CustomizedButton>
            {/*{loaded && ssoConfig ? <DangerButton>Delete Single Sign-On Config</DangerButton> : null}*/}
          </Box>
        ) : null}
      </Box>
    );
  };

  private renderSecondHeaderRight() {
    const { canEditNamespace, activeNamespaceName, canEditCluster, ssoConfig } = this.props;
    if (!ssoConfig) {
      return null;
    }

    return canEditNamespace(activeNamespaceName) || canEditCluster() ? (
      <CustomizedButton size="small" component={Link} to="/endpoints/new" variant="outlined" color="primary">
        New Protected Endpoint
      </CustomizedButton>
    ) : null;
  }

  public render() {
    const { ssoConfig, isSSOConfigLoaded } = this.props;

    if (!isSSOConfigLoaded) {
      return (
        <Box p={2}>
          <Loading />
        </Box>
      );
    }

    return (
      <BasePage secondHeaderRight={this.renderSecondHeaderRight()}>
        <Box p={2}>{!!ssoConfig ? this.renderConfigDetails() : this.renderEmptyText()}</Box>
      </BasePage>
    );
  }
}

export const EndpointsPage = withNamespace(withUserAuth(withStyles(styles)(withSSO(EndpointsPageRaw))));
