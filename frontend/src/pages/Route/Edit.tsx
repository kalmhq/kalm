import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { updateRoute } from "actions/routes";
import { push } from "connected-react-router";
import { RouteForm } from "forms/Route";
import React from "react";
import { connect } from "react-redux";
import { match } from "react-router";
import { ThunkDispatch } from "redux-thunk";
import { HttpRouteForm, methodsModeAll, methodsModeSpecific, AllHttpMethods } from "types/route";
import { ApplicationViewDrawer } from "widgets/ApplicationViewDrawer";
import { Loading } from "widgets/Loading";
import { RootState } from "../../reducers";
import { Actions } from "../../types";
import { BasePage } from "../BasePage";
import { Namespaces } from "widgets/Namespaces";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: theme.spacing(2)
    }
  });

const mapStateToProps = (state: RootState, ownProps: any) => {
  const matchResult = ownProps.match as match<{ name: string }>;
  const routes = state.get("routes");

  return {
    isFirstLoaded: routes.get("isFirstLoaded"),
    isLoading: routes.get("isLoading"),
    route: routes.get("httpRoutes").find(x => x.get("name") === matchResult.params.name),
    routeName: matchResult.params.name
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

class RouteEditRaw extends React.PureComponent<Props> {
  private submit = async (route: HttpRouteForm) => {
    try {
      if (route.get("methodsMode") === methodsModeAll) {
        route = route.set("methods", AllHttpMethods);
      }
      this.props.dispatch(updateRoute(route.get("name"), route.get("namespace"), route));
      this.props.dispatch(push("/routes"));
    } catch (e) {
      console.log(e);
    }
  };

  private renderContent() {
    const { isFirstLoaded, isLoading, route } = this.props;

    if (isLoading && !isFirstLoaded) {
      return <Loading />;
    }

    if (!route) {
      return "No route found";
    }

    let routeForm = route as HttpRouteForm;
    routeForm = routeForm.set("methodsMode", route.get("methods").size >= 7 ? methodsModeAll : methodsModeSpecific);

    return <RouteForm onSubmit={this.submit} initialValues={routeForm} />;
  }

  public render() {
    return (
      <BasePage leftDrawer={<ApplicationViewDrawer />} secondHeaderLeft={<Namespaces />}>
        <div className={this.props.classes.root}>{this.renderContent()}</div>
      </BasePage>
    );
  }
}

export const RouteEdit = withStyles(styles)(connect(mapStateToProps)(RouteEditRaw));
