import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { createRoute } from "actions/routes";
import { push } from "connected-react-router";
import { RouteForm } from "forms/Route";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { HttpRouteForm, newEmptyRouteForm } from "types/route";
import { ApplicationViewDrawer } from "widgets/ApplicationViewDrawer";
import { RootState } from "../../reducers";
import { Actions } from "../../types";
import { BasePage } from "../BasePage";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: theme.spacing(2)
    }
  });

interface Props extends WithStyles<typeof styles> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

class RouteNewRaw extends React.PureComponent<Props> {
  private submit = async (route: HttpRouteForm) => {
    try {
      await this.props.dispatch(createRoute(route.get("name"), route.get("namespace"), route));
      this.props.dispatch(push("/routes"));
    } catch (e) {
      console.log(e);
    }
  };

  public render() {
    return (
      <BasePage leftDrawer={<ApplicationViewDrawer />}>
        <div className={this.props.classes.root}>
          <RouteForm onSubmit={this.submit} initialValues={newEmptyRouteForm()} />
        </div>
      </BasePage>
    );
  }
}

export const RouteNew = withStyles(styles)(connect()(RouteNewRaw));
