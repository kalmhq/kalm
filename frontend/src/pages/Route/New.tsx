import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { RouteForm } from "forms/Route";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { HttpRouteForm, newEmptyRouteForm, methodsModeAll } from "types/route";
import { RootState } from "../../reducers";
import { Actions } from "../../types";
import { BasePage } from "../BasePage";
import Immutable from "immutable";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: theme.spacing(2)
    }
  });

const res: HttpRouteForm = Immutable.fromJS({
  methodsMode: methodsModeAll,
  hosts: ["test.kapp.live", "test2.kapp.live"],
  schemes: ["http"],
  paths: ["/", "/test"],
  methods: [],
  conditions: [
    {
      type: "header",
      name: "test-user",
      operator: "equal",
      value: "123"
    },
    {
      type: "header",
      name: "test-user",
      operator: "matchRegexp",
      value: "123"
    }
  ],
  destinations: [
    {
      host: "service-v2:80",
      weight: 5
    },
    {
      host: "service-v1:80",
      weight: 5
    }
  ],
  timeout: 5,
  retries: {
    attempts: 3,
    perTtyTimeoutSeconds: 2,
    retryOn: ["gateway-error", "connect-failure", "refused-stream"]
  },
  mirror: {
    percentage: 50,
    destination: {
      host: "service-v2:80",
      weight: 50
    }
  },
  fault: {
    percentage: 50,
    errorStatus: 500
  },
  delay: {
    percentage: 50,
    delaySeconds: 3
  },
  cors: {
    allowOrigin: ["*"],
    allowMethods: ["*"],
    allowCredentials: true,
    allowHeaders: [],
    maxAgeSeconds: 86400
  }
});

interface Props extends WithStyles<typeof styles> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

class RouteNewRaw extends React.PureComponent<Props> {
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

export const RouteNew = withStyles(styles)(connect()(RouteNewRaw));
