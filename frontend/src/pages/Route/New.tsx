import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { createRoute } from "actions/routes";
import { push } from "connected-react-router";
import { RouteForm } from "forms/Route";
import React from "react";
import { connect } from "react-redux";
import { AllHttpMethods, HttpRouteForm, methodsModeAll, newEmptyRouteForm } from "types/route";
import { ApplicationViewDrawer } from "widgets/ApplicationViewDrawer";
import { RootState } from "../../reducers";
import { TDispatchProp } from "../../types";
import { BasePage } from "../BasePage";
import { Namespaces } from "widgets/Namespaces";
import Container from "@material-ui/core/Container";
import queryString from "query-string";
import { RouteComponentProps } from "react-router";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: theme.spacing(2),
    },
  });

const mapStateToProps = (state: RootState, ownProps: RouteComponentProps) => {
  const query = queryString.parse(ownProps.location.search);
  const activeNamespace = state.get("namespaces").get("active");

  return {
    namespace: (query.namespace as string) || activeNamespace,
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

class RouteNewRaw extends React.PureComponent<Props> {
  private submit = async (route: HttpRouteForm) => {
    const { namespace, dispatch } = this.props;

    try {
      if (route.get("methodsMode") === methodsModeAll) {
        route = route.set("methods", AllHttpMethods);
      }
      route = route.set("namespace", namespace);
      await dispatch(createRoute(route.get("name"), route.get("namespace"), route));
      dispatch(push("/routes"));
    } catch (e) {
      console.log(e);
    }
  };

  public render() {
    return (
      <BasePage leftDrawer={<ApplicationViewDrawer />} secondHeaderLeft={<Namespaces />}>
        <Container className={this.props.classes.root} maxWidth="lg">
          <RouteForm onSubmit={this.submit} initialValues={newEmptyRouteForm()} />
        </Container>
      </BasePage>
    );
  }
}

export const RouteNew = withStyles(styles)(connect(mapStateToProps)(RouteNewRaw));
