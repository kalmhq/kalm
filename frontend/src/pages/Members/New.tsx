import React from "react";
import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { BasePage } from "pages/BasePage";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { Namespaces } from "widgets/Namespaces";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { MemberForm } from "forms/Member";
import { newEmptyRoleBinding, RoleBinding } from "types/member";
import { createRoleBindingsAction } from "actions/user";
import { setSuccessNotificationAction } from "actions/notification";
import { push } from "connected-react-router";
import { withRouter } from "react-router-dom";

const styles = (theme: Theme) => createStyles({});

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props
  extends WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    TDispatchProp,
    WithNamespaceProps {}

class MemberNewPageRaw extends React.PureComponent<Props> {
  private onSubmit = async (values: RoleBinding) => {
    const { dispatch, activeNamespaceName } = this.props;
    values.namespace = this.isClusterLevel() ? "kalm-system" : activeNamespaceName;
    await dispatch(createRoleBindingsAction(values));
    await dispatch(setSuccessNotificationAction("Successfully create role binding"));
    if (this.isClusterLevel()) {
      await dispatch(push("/cluster/members"));
    } else {
      await dispatch(push("/applications/" + activeNamespaceName + "/members"));
    }
  };

  private isClusterLevel() {
    const { location } = this.props;
    return location.pathname.startsWith("/cluster/members");
  }

  public render() {
    return (
      <BasePage
        secondHeaderLeft={this.isClusterLevel() ? null : <Namespaces />}
        leftDrawer={this.isClusterLevel() ? null : <ApplicationSidebar />}
      >
        <Box p={2}>
          <MemberForm initial={newEmptyRoleBinding()} onSubmit={this.onSubmit} isClusterLevel={this.isClusterLevel()} />
        </Box>
      </BasePage>
    );
  }
}

export const MemberNewPage = withStyles(styles)(withNamespace(connect(mapStateToProps)(withRouter(MemberNewPageRaw))));
