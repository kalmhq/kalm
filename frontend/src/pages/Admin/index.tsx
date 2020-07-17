import { Box, Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { H4 } from "widgets/Label";
import { Link } from "react-router-dom";
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

class AdminPageRaw extends React.PureComponent<Props, State> {
  private renderSecondHeaderRight() {
    return (
      <>
        <H4>Overview</H4>
        <Button
          component={Link}
          color="primary"
          size="small"
          variant="outlined"
          to={`/applications/ponents/new`}
          id="add-component-button"
          tutorial-anchor-id="add-component-button"
        >
          xxxxxxx
        </Button>
      </>
    );
  }

  public render() {
    return (
      <BasePage leftDrawer={<AdminSidebar />}>
        <Box p={2}>123</Box>
      </BasePage>
    );
  }
}

export const AdminPage = withStyles(styles)(connect(mapStateToProps)(AdminPageRaw));
