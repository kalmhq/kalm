import React from "react";
import { Box, Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { BasePage } from "pages/BasePage";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { Namespaces } from "widgets/Namespaces";
import { Link, withRouter } from "react-router-dom";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { indigo } from "@material-ui/core/colors";
import { CustomizedButton } from "widgets/Button";
import { blinkTopProgressAction } from "actions/settings";
import { push } from "connected-react-router";
import { ImpersonateIcon, PeopleIcon } from "widgets/Icon";
import { KRTable } from "widgets/KRTable";
import { WithRoleBindingProps, withRoleBindings } from "hoc/withRoleBinding";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { RoleBinding, SubjectTypeGroup, SubjectTypeUser } from "types/member";
import { deleteRoleBindingsAction, updateRoleBindingsAction } from "actions/user";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import { setSuccessNotificationAction } from "actions/notification";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { InfoBox } from "widgets/InfoBox";
import { impersonate } from "api/realApi";
import produce from "immer";
import { BlankTargetLink } from "widgets/BlankTargetLink";

const styles = (theme: Theme) => createStyles({});

const mapStateToProps = (state: RootState) => {
  return {
    // xxx: state.get("xxx").get("xxx"),
  };
};

interface Props
  extends WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    TDispatchProp,
    WithNamespaceProps,
    WithRoleBindingProps {}

interface State {}

class RolesListPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private renderSecondHeaderRight = () => {
    const { activeNamespaceName } = this.props;

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
    const { dispatch, activeNamespaceName } = this.props;
    const isClusterLevel = this.isClusterLevel();

    return (
      <EmptyInfoBox
        image={<PeopleIcon style={{ height: 120, width: 120, color: indigo[200] }} />}
        title={
          isClusterLevel
            ? "Your cluster has not been authorized to other members"
            : "This application has not been authorized to other members"
        }
        content="Authorize other members to manage this cluster together."
        button={
          <CustomizedButton
            variant="contained"
            color="primary"
            onClick={() => {
              blinkTopProgressAction();
              dispatch(
                push(
                  this.isClusterLevel() ? `/cluster/members/new` : `/applications/${activeNamespaceName}/members/new`,
                ),
              );
            }}
          >
            Grant permissions
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
      roleBindings.forEach((roleBinding, index) => {
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
    const { dispatch } = this.props;
    return (
      <>
        <IconButtonWithTooltip
          onClick={async () => {
            impersonate(roleBinding.subject, roleBinding.subjectType);
            await dispatch(push("/"));
            window.location.reload();
          }}
          // size="small"
          tooltipTitle="Impersonate"
        >
          <ImpersonateIcon />
        </IconButtonWithTooltip>
        <DeleteButtonWithConfirmPopover
          popupId={`delete-member-${roleBinding.namespace}-${roleBinding.name}-popup`}
          popupTitle="DELETE Member"
          confirmedAction={() => dispatch(deleteRoleBindingsAction(roleBinding.namespace, roleBinding.name))}
        />
      </>
    );
  };

  private renderInfoBox = () => {
    const title = "Member References";

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
    const { location } = this.props;
    return location.pathname.startsWith("/cluster/members");
  }

  public render() {
    const roleBindings = this.getRoleBindings();
    return (
      <BasePage
        secondHeaderRight={this.renderSecondHeaderRight()}
        secondHeaderLeft={this.isClusterLevel() ? null : <Namespaces />}
        leftDrawer={this.isClusterLevel() ? null : <ApplicationSidebar />}
      >
        <Box p={2}>
          {roleBindings.length > 0 ? (
            <KRTable showTitle={true} title="Members" columns={this.getKRTableColumns()} data={this.getKRTableData()} />
          ) : (
            this.renderEmpty()
          )}
          <Box mt={2}>{this.renderInfoBox()}</Box>
        </Box>
      </BasePage>
    );
  }
}

export const RolesListPage = withStyles(styles)(
  withNamespace(withRoleBindings(connect(mapStateToProps)(withRouter(RolesListPageRaw)))),
);
