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
    values.namespace = activeNamespaceName;
    await dispatch(createRoleBindingsAction(values));
    await dispatch(setSuccessNotificationAction("Successfully create role binding"));
    await dispatch(push("/applications/" + activeNamespaceName + "/members"));
  };

  public render() {
    return (
      <BasePage secondHeaderLeft={<Namespaces />} leftDrawer={<ApplicationSidebar />}>
        <Box p={2}>
          <MemberForm initial={newEmptyRoleBinding()} onSubmit={this.onSubmit} />
        </Box>
      </BasePage>
    );
  }
}

export const MemberNewPage = withStyles(styles)(withNamespace(connect(mapStateToProps)(MemberNewPageRaw)));
