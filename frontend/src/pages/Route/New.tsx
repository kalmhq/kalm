import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { setSuccessNotificationAction } from "actions/notification";
import { createRouteAction } from "actions/routes";
import { push } from "connected-react-router";
import { RouteForm } from "forms/Route";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import React from "react";
import { AllHttpMethods, HttpRoute, methodsModeAll, newEmptyRouteForm } from "types/route";
import { BasePage } from "../BasePage";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles>, WithNamespaceProps {}

class RouteNewRaw extends React.PureComponent<Props> {
  private onSubmit = async (route: HttpRoute) => {
    const { applications, dispatch } = this.props;

    try {
      if (route.methodsMode === methodsModeAll) {
        route.methods = AllHttpMethods;
      }

      // TODO: change this
      route.namespace = applications[0].name;

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
