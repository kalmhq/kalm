import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { createRouteAction } from "actions/routes";
import { push } from "connected-react-router";
import { RouteForm } from "forms/Route";
import React from "react";
import { AllHttpMethods, HttpRouteFormType, methodsModeAll, newEmptyRouteForm, HttpRoute } from "types/route";
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
  private onSubmit = async (routeForm: HttpRouteFormType) => {
    const { activeNamespaceName, dispatch } = this.props;
    let route = Immutable.fromJS(routeForm) as HttpRoute;
    try {
      if (route.get("methodsMode") === methodsModeAll) {
        route = route.set("methods", AllHttpMethods);
      }
      route = route.set("namespace", activeNamespaceName);

      await dispatch(createRouteAction(route));
      await dispatch(setSuccessNotificationAction("Create route successfully"));
      dispatch(push("/routes"));
    } catch (e) {
      console.log(e);
    }
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
