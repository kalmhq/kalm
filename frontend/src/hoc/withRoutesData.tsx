import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router";
import { RootState } from "reducers";
import { TDispatchProp } from "types";

const mapStateToProps = (
  state: RootState,
  {
    match: {
      params: { name },
    },
  }: RouteComponentProps<{ name?: string }>,
) => {
  const routeState = state.get("routes");
  const httpRoutes = routeState.get("httpRoutes");

  return {
    isRoutesLoading: routeState.get("isLoading"),
    isRoutesFirstLoaded: routeState.get("isFirstLoaded"),
    httpRoutes: httpRoutes,
    httpRoute: httpRoutes.find((x) => x.get("name") === name),
  };
};

export interface WithRoutesDataProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export const withRoutesData = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.ComponentType<WithRoutesDataProps> = class extends React.Component<WithRoutesDataProps> {
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };

  HOC.displayName = `WithRoutesData(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(HOC);
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
