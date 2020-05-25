import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { RouteForm } from "forms/Route";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { HttpRouteForm, newEmptyRouteForm } from "types/route";
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

class RouteEditRaw extends React.PureComponent<Props> {
  private submit = async (route: HttpRouteForm) => {
    console.log(route);
  };

  public render() {
    return (
      <BasePage>
        <div className={this.props.classes.root}>
          <RouteForm onSubmit={this.submit} initialValues={newEmptyRouteForm()} />
        </div>
      </BasePage>
    );
  }
}

export const RouteEdit = withStyles(styles)(connect()(RouteEditRaw));
