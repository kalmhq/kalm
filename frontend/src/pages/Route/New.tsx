import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { createRoute } from "actions/routes";
import { push } from "connected-react-router";
import { RouteForm } from "forms/Route";
import React from "react";
import { AllHttpMethods, HttpRouteForm, methodsModeAll, newEmptyRouteForm } from "types/route";
import { ApplicationViewDrawer } from "widgets/ApplicationViewDrawer";
import { BasePage } from "../BasePage";
import { Namespaces } from "widgets/Namespaces";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { setSuccessNotificationAction } from "actions/notification";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles>, WithNamespaceProps {}

class RouteNewRaw extends React.PureComponent<Props> {
  private route = newEmptyRouteForm();

  private onSubmit = async (route: HttpRouteForm) => {
    const { activeNamespaceName, dispatch } = this.props;

    try {
      if (route.get("methodsMode") === methodsModeAll) {
        route = route.set("methods", AllHttpMethods);
      }

      route = route.set("namespace", activeNamespaceName);
      await dispatch(createRoute(route.get("name"), activeNamespaceName, route));
      await dispatch(setSuccessNotificationAction("Create route successfully"))
    } catch (e) {
      console.log(e);
    }
  };

  private onSubmitSuccess = () => {
    const { dispatch, activeNamespaceName } = this.props;

    window.setTimeout(() => {
      dispatch(push("/applications/" + activeNamespaceName + "/routes"));
    }, 100);
  };

  public render() {
    return (
      <BasePage leftDrawer={<ApplicationViewDrawer />} secondHeaderLeft={<Namespaces />}>
        <Box p={2}>
          <RouteForm onSubmit={this.onSubmit} onSubmitSuccess={this.onSubmitSuccess} initialValues={this.route} />
        </Box>
      </BasePage>
    );
  }
}

export const RouteNew = withNamespace(withStyles(styles)(RouteNewRaw));
