import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { updateRoute } from "actions/routes";
import { push } from "connected-react-router";
import { RouteForm } from "forms/Route";
import React from "react";
import { AllHttpMethods, HttpRoute, HttpRouteForm, methodsModeAll, methodsModeSpecific } from "types/route";
import { ApplicationViewDrawer } from "widgets/ApplicationViewDrawer";
import { Loading } from "widgets/Loading";
import { BasePage } from "../BasePage";
import { Namespaces } from "widgets/Namespaces";
import { withRoutesData, WithRoutesDataProps } from "hoc/withRoutesData";
import { setSuccessNotificationAction } from "actions/notification";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: theme.spacing(2),
    },
  });

interface Props extends WithStyles<typeof styles>, WithRoutesDataProps {}

class RouteEditRaw extends React.PureComponent<Props> {
  private onSubmit = async (route: HttpRouteForm) => {
    const { dispatch } = this.props;
    try {
      if (route.get("methodsMode") === methodsModeAll) {
        route = route.set("methods", AllHttpMethods);
      }

      await dispatch(updateRoute(route.get("name"), route.get("namespace"), route));
      await dispatch(setSuccessNotificationAction("Update route successfully"));
    } catch (e) {
      console.log(e);
    }
  };

  private onSubmitSuccess = async (route: HttpRoute) => {
    this.props.dispatch(push("/applications/" + this.props.activeNamespaceName + "/routes"));
  };

  private renderContent() {
    const { isRoutesFirstLoaded, isRoutesLoading, httpRoute } = this.props;

    if (isRoutesLoading && !isRoutesFirstLoaded) {
      return <Loading />;
    }

    if (!httpRoute) {
      return "No route found";
    }

    let routeForm = httpRoute as HttpRouteForm;
    routeForm = routeForm.set("methodsMode", httpRoute.get("methods").size >= 7 ? methodsModeAll : methodsModeSpecific);

    return <RouteForm onSubmit={this.onSubmit} onSubmitSuccess={this.onSubmitSuccess} initialValues={routeForm} />;
  }

  public render() {
    return (
      <BasePage leftDrawer={<ApplicationViewDrawer />} secondHeaderLeft={<Namespaces />}>
        <div className={this.props.classes.root}>{this.renderContent()}</div>
      </BasePage>
    );
  }
}

export const RouteEdit = withRoutesData(withStyles(styles)(RouteEditRaw));
