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
import { RoleBinding } from "types/member";
import { deleteRoleBindingsAction, updateRoleBindingsAction } from "actions/user";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import { setSuccessNotificationAction } from "actions/notification";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { InfoBox } from "widgets/InfoBox";
import { KLink } from "widgets/Link";
import { impersonate } from "api/realApi";
import produce from "immer";

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
          Add member
        </Button>
      </>
    );
  };

  private renderEmpty() {
    const { dispatch, activeNamespaceName } = this.props;

    return (
      <EmptyInfoBox
        image={<PeopleIcon style={{ height: 120, width: 120, color: indigo[200] }} />}
        title={"This App doesn't have any members yet."}
        content="Authorize other members to manage this application together."
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
            Add member
          </CustomizedButton>
        }
      />
    );
  }

  private getKRTableColumns() {
    return [
      {
        Header: "Subject",
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

  private renderActions = (roleBinding: RoleBinding) => {
    const { dispatch } = this.props;
    return (
      <>
        <IconButtonWithTooltip
          onClick={async () => {
            impersonate(roleBinding.subject);
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
          <KLink to="#" target="_blank">
            How kalm permission works?
          </KLink>
        ),
        content: "",
      },
      {
        title: (
          <KLink to="#" target="_blank">
            What's the permissions of a role?
          </KLink>
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
