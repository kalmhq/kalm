import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { createRouteAction } from "actions/routes";
import { push } from "connected-react-router";
import { RouteForm } from "forms/Route";
import React from "react";
import { AllHttpMethods, HttpRouteForm, methodsModeAll, newEmptyRouteForm, HttpRoute } from "types/route";
import { BasePage } from "../BasePage";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { setSuccessNotificationAction } from "actions/notification";
import Immutable from "immutable";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles>, WithNamespaceProps {}

class RouteNewRaw extends React.PureComponent<Props> {
  private onSubmit = async (routeArg: HttpRouteForm) => {
    const { activeNamespaceName, dispatch } = this.props;
    let route = Immutable.fromJS(routeArg) as HttpRoute;
    try {
      if (route.get("methodsMode") === methodsModeAll) {
        route = route.set("methods", AllHttpMethods);
      }
      route = route.set("namespace", activeNamespaceName);

      await dispatch(createRouteAction(route));
      await dispatch(setSuccessNotificationAction("Create route successfully"));
    } catch (e) {
      console.log(e);
    }
  };

  private onSubmitSuccess = () => {
    const { dispatch } = this.props;

    window.setTimeout(() => {
      dispatch(push("/routes"));
    }, 100);
  };

  public render() {
    return (
      <BasePage>
        <Box p={2}>
          <RouteForm onSubmit={this.onSubmit} initial={newEmptyRouteForm()} />
        </Box>
      </BasePage>
    );
  }
}

export const RouteNewPage = withNamespace(withStyles(styles)(RouteNewRaw));
