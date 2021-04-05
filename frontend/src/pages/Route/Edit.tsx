import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { setSuccessNotificationAction } from "actions/notification";
import { updateRouteAction } from "actions/routes";
import { push } from "connected-react-router";
import { RouteForm } from "forms/Route";
import { withRoutesData, WithRoutesDataProps } from "hoc/withRoutesData";
import produce from "immer";
import React from "react";
import { AllHttpMethods, HttpRoute, methodsModeAll, methodsModeSpecific } from "types/route";
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
  private onSubmit = async (route: HttpRoute) => {
    const { dispatch } = this.props;
    try {
      if (route.methodsMode === methodsModeAll) {
        route.methods = AllHttpMethods;
      }

      await dispatch(updateRouteAction(route));
      await dispatch(setSuccessNotificationAction("Update route successfully"));
      dispatch(push("/routes"));
    } catch (e) {
      console.log(e);
    }
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

    let initial = produce(httpRoute, (draft) => {
      if (httpRoute.methods.length >= 7) {
        draft.methodsMode = methodsModeAll;
      } else {
        draft.methodsMode = methodsModeSpecific;
      }
    });

    return <RouteForm isEditing onSubmit={this.onSubmit} initial={initial} />;
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
