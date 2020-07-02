import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { RouteComponentProps } from "react-router";
import Immutable from "immutable";
import { HttpRoute } from "types/route";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { loadRoutes } from "actions/routes";

const mapStateToProps = (
  state: RootState,
  {
    activeNamespaceName,
    match: {
      params: { name },
    },
  }: RouteComponentProps<{ name?: string }> & WithNamespaceProps,
) => {
  const routeState = state.get("routes");
  const httpRoutes = routeState.get("httpRoutes");

  return {
    isRoutesLoading: routeState.get("isLoading"),
    isRoutesFirstLoaded: routeState.get("isFirstLoaded"),
    httpRoutes: httpRoutes.get(activeNamespaceName) || (Immutable.List() as Immutable.List<HttpRoute>),
    httpRoute:
      name && httpRoutes.get(activeNamespaceName)
        ? httpRoutes.get(activeNamespaceName)?.find((x) => x.get("name") === name)
        : undefined,
  };
};

export interface WithRoutesDataProps extends ReturnType<typeof mapStateToProps>, WithNamespaceProps {}

export const withRoutesData = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.ComponentType<WithRoutesDataProps> = class extends React.Component<WithRoutesDataProps> {
    componentDidMount() {
      const { dispatch, activeNamespaceName } = this.props;
      dispatch(loadRoutes(activeNamespaceName));
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };

  HOC.displayName = `WithRoutesData(${getDisplayName(WrappedComponent)})`;

  return withNamespace(connect(mapStateToProps)(HOC));
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
