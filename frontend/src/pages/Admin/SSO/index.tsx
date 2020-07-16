import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { BasePage } from "pages/BasePage";
import { AdminSidebar } from "pages/Admin/Sidebar";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

class AdminSSOPageRaw extends React.PureComponent<Props, State> {
  public render() {
    return (
      <BasePage leftDrawer={<AdminSidebar />}>
        <Box p={2}>123</Box>
      </BasePage>
    );
  }
}

export const AdminSSOPage = withStyles(styles)(connect(mapStateToProps)(AdminSSOPageRaw));
