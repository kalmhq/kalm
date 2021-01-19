import { Box, Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { indigo } from "@material-ui/core/colors";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import { setSuccessNotificationAction } from "actions/notification";
import { blinkTopProgressAction } from "actions/settings";
import { deleteRoleBindingsAction, updateRoleBindingsAction } from "actions/user";
import { impersonate } from "api/api";
import { push } from "connected-react-router";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { WithRoleBindingProps, withRoleBindings } from "hoc/withRoleBinding";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
import produce from "immer";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { Link, withRouter } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { RoleBinding, SubjectTypeGroup, SubjectTypeUser } from "types/member";
import { BlankTargetLink } from "widgets/BlankTargetLink";
import { CustomizedButton } from "widgets/Button";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { ImpersonateIcon, PeopleIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { InfoBox } from "widgets/InfoBox";
import { KRTable } from "widgets/KRTable";
import { Namespaces } from "widgets/Namespaces";

const styles = (theme: Theme) => createStyles({});

const mapStateToProps = (state: RootState) => {
  const { newTenantUrl, isFrontendMembersManagementEnabled } = state.extraInfo.info;
  const tenant = state.auth.tenant;

  return {
    isFrontendMembersManagementEnabled,
    newTenantUrl,
    tenant,
  };
};

interface Props
  extends WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    TDispatchProp,
    WithNamespaceProps,
    WithUserAuthProps,
    WithRoleBindingProps {}

interface State {}

class RolesListPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private renderSecondHeaderRight = () => {
    const { activeNamespaceName, isFrontendMembersManagementEnabled } = this.props;
    const { newTenantUrl, tenant } = this.props;

    if (isFrontendMembersManagementEnabled) {
      return (
        <Button
          color="primary"
          size="small"
          variant="outlined"
          onClick={() => window.open(newTenantUrl + `/clusters/${tenant}/members`, "_blank")}
        >
          Manage Members
        </Button>
      );
    }

    return (
      <>
        <Button
          component={Link}
          color="primary"
          size="small"
          variant="outlined"
          to={this.isClusterLevel() ? `/cluster/members/new` : `/applications/${activeNamespaceName}/members/new`}
        >
          Grant permissions
        </Button>
      </>
    );
  };

  private renderEmpty = () => {
    const { dispatch, activeNamespaceName, isFrontendMembersManagementEnabled } = this.props;
    const { newTenantUrl, tenant } = this.props;
    const isClusterLevel = this.isClusterLevel();

    let link: string = "";

    if (isClusterLevel) {
      link = "/cluster/members/new";
    } else if (isFrontendMembersManagementEnabled) {
      link = newTenantUrl + `/clusters/${tenant}/members`;
    } else {
      link = `/applications/${activeNamespaceName}/members/new`;
    }

    return (
      <EmptyInfoBox
        image={<PeopleIcon style={{ height: 120, width: 120, color: indigo[200] }} />}
        title={
          isClusterLevel
            ? "Your cluster has not been authorized to other members"
            : "This application has not been authorized to other members"
        }
        content={
          isClusterLevel
            ? "Authorize other members to manage this cluster together."
            : "Authorize other members to manage this application together."
        }
        button={
          <CustomizedButton
            variant="contained"
            color="primary"
            onClick={() => {
              blinkTopProgressAction();

              if (link.startsWith("http")) {
                return window.open(link, "_blank");
              }

              dispatch(push(link));
            }}
          >
            Add members
          </CustomizedButton>
        }
      />
    );
  };

  private getKRTableColumns() {
    return [
      {
        Header: "Type",
        accessor: "type",
      },
      {
        Header: "Name",
        accessor: "subject",
      },
      {
        Header: "Role",
        accessor: "role",
      },
      {
        Header: "Action",
        accessor: "actions",
      },
    ];
  }

  private changeRole = async (roleBinding: RoleBinding, newRole: string) => {
    if (roleBinding.role === newRole) {
      return;
    }
    const { dispatch } = this.props;
    await dispatch(
      updateRoleBindingsAction(
        produce(roleBinding, (draft) => {
          draft.role = newRole;
        }),
      ),
    );
    await dispatch(setSuccessNotificationAction("Update role successfully"));
  };

  private renderRole = (roleBinding: RoleBinding) => {
    if (!this.props.isFrontendMembersManagementEnabled) {
      switch (roleBinding.role) {
        case "clusterViewer":
          return "Cluster Viewer";
        case "clusterEditor":
          return "Cluster Editor";
        case "clusterOwner":
          return "Cluster Owner";
        case "viewer":
          return "Viewer";
        case "editor":
          return "Editor";
        case "owner":
          return "Owner";
      }
    }

    const { canManageCluster, canManageNamespace, activeNamespaceName } = this.props;

    const items = this.isClusterLevel()
      ? [
          <MenuItem key="clusterViewer" value="clusterViewer">
            Cluster Viewer
          </MenuItem>,
          <MenuItem key="clusterEditor" value="clusterEditor">
            Cluster Editor
          </MenuItem>,
          <MenuItem key="clusterOwner" value="clusterOwner">
            Cluster Owner
          </MenuItem>,
        ]
      : [
          <MenuItem key="viewer" value="viewer">
            Viewer
          </MenuItem>,
          <MenuItem key="editor" value="editor">
            Editor
          </MenuItem>,
          <MenuItem key="owner" value="owner">
            Owner
          </MenuItem>,
        ];

    return (
      <TextField
        select
        label="Role"
        variant="outlined"
        size="small"
        SelectProps={{ displayEmpty: true }}
        value={roleBinding.role}
        disabled={this.isClusterLevel() ? !canManageCluster() : !canManageNamespace(activeNamespaceName)}
        onChange={(event) => this.changeRole(roleBinding, event.target.value)}
      >
        {items}
      </TextField>
    );
  };

  private getKRTableData() {
    const roleBindings = this.getRoleBindings();
    const data: any[] = [];

    roleBindings &&
      roleBindings.forEach((roleBinding) => {
        data.push({
          name: roleBinding.name,
          subject: roleBinding.subject,
          type: this.renderSubjectType(roleBinding),
          role: this.renderRole(roleBinding),
          actions: this.renderActions(roleBinding),
        });
      });

    return data;
  }

  private getRoleBindings = (): RoleBinding[] => {
    const { roleBindings, activeNamespaceName } = this.props;
    const filterNamespace = this.isClusterLevel() ? "kalm-system" : activeNamespaceName;
    return roleBindings.filter((x) => x.namespace === filterNamespace);
  };

  private renderSubjectType = (roleBinding: RoleBinding) => {
    if (roleBinding.subjectType === SubjectTypeUser) {
      return "User";
    } else if (roleBinding.subjectType === SubjectTypeGroup) {
      return "Group";
    } else {
      return "Unknown-" + roleBinding.subjectType;
    }
  };

  private renderActions = (roleBinding: RoleBinding) => {
    const { dispatch, isFrontendMembersManagementEnabled } = this.props;

    return (
      <>
        <IconButtonWithTooltip
          onClick={async () => {
            impersonate(roleBinding.subject, roleBinding.subjectType);
            await dispatch(push("/"));
            window.location.reload();
          }}
          tooltipTitle="Impersonate"
        >
          <ImpersonateIcon />
        </IconButtonWithTooltip>
        {isFrontendMembersManagementEnabled && (
          <DeleteButtonWithConfirmPopover
            popupId={`delete-member-${roleBinding.namespace}-${roleBinding.name}-popup`}
            popupTitle="DELETE Member"
            confirmedAction={() => dispatch(deleteRoleBindingsAction(roleBinding.namespace, roleBinding.name))}
          />
        )}
      </>
    );
  };

  private renderInfoBox = () => {
    const title = "References";

    const options = [
      {
        title: (
          <BlankTargetLink href="https://kalm.dev/docs/next/auth/overview">How kalm permission works?</BlankTargetLink>
        ),
        content: "",
      },
      {
        title: (
          <BlankTargetLink href="https://kalm.dev/docs/next/auth/roles">
            What's the permissions of a role?
          </BlankTargetLink>
        ),
        content: "",
      },
    ];

    return <InfoBox title={title} options={options} />;
  };

  private isClusterLevel() {
    const {
      location: { pathname },
    } = this.props;
    return pathname.startsWith("/cluster/members") || pathname.startsWith("/applications/kalm-system");
  }

  private renderContent() {
    const roleBindings = this.getRoleBindings();

    return roleBindings.length > 0 ? (
      <KRTable showTitle={true} title="Members" columns={this.getKRTableColumns()} data={this.getKRTableData()} />
    ) : (
      this.renderEmpty()
    );
  }

  public render() {
    return (
      <BasePage
        secondHeaderRight={this.renderSecondHeaderRight()}
        secondHeaderLeft={this.isClusterLevel() ? null : <Namespaces />}
        leftDrawer={this.isClusterLevel() ? null : <ApplicationSidebar />}
      >
        <Box p={2}>
          {this.renderContent()}
          <Box mt={2}>{this.renderInfoBox()}</Box>
        </Box>
      </BasePage>
    );
  }
}

export const RolesListPage = withStyles(styles)(
  withNamespace(withUserAuth(withRoleBindings(connect(mapStateToProps)(withRouter(RolesListPageRaw))))),
);
