import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { setSuccessNotificationAction } from "actions/notification";
import { updateRouteAction } from "actions/routes";
import { push } from "connected-react-router";
import { RouteForm } from "forms/Route";
import { withRoutesData, WithRoutesDataProps } from "hoc/withRoutesData";
import React from "react";
import {
  AllHttpMethods,
  HttpRoute,
  HttpRouteForm,
  methodsModeAll,
  methodsModeSpecific,
  HttpRouteFormContent,
} from "types/route";
import { Loading } from "widgets/Loading";
import { ResourceNotFound } from "widgets/ResourceNotFound";
import { BasePage } from "../BasePage";

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

      await dispatch(updateRouteAction(route));
      await dispatch(setSuccessNotificationAction("Update route successfully"));
    } catch (e) {
      console.log(e);
    }
  };

  private onSubmitSuccess = async (_route: HttpRoute) => {
    this.props.dispatch(push("/routes"));
  };

  private renderContent() {
    const { isRoutesFirstLoaded, isRoutesLoading, httpRoute } = this.props;

    if (isRoutesLoading && !isRoutesFirstLoaded) {
      return (
        <Box flex="1">
          <Loading />
        </Box>
      );
    }

    if (!httpRoute) {
      return (
        <BasePage>
          <Box p={2}>
            <ResourceNotFound
              text="Route not found"
              redirect={`/routes`}
              redirectText="Go back to Routes List"
            ></ResourceNotFound>
          </Box>
        </BasePage>
      );
    }

    let routeForm = httpRoute as HttpRouteForm;
    routeForm = routeForm.set("methodsMode", httpRoute.get("methods").size >= 7 ? methodsModeAll : methodsModeSpecific);

    return <RouteForm isEdit onSubmit={this.onSubmit} initialValues={routeForm.toObject() as HttpRouteFormContent} />;
  }

  public render() {
    return (
      <BasePage>
        <div className={this.props.classes.root}>{this.renderContent()}</div>
      </BasePage>
    );
  }
}

export const RouteEditPage = withRoutesData(withStyles(styles)(RouteEditRaw));
