import { RootState } from "configureStore";
import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router";
import { TDispatchProp } from "types";

const mapStateToProps = (
  state: RootState,
  {
    match: {
      params: { name },
    },
  }: RouteComponentProps<{ name?: string }>,
) => {
  const routeState = state.routes;
  const httpRoutes = routeState.httpRoutes;

  return {
    isRoutesLoading: routeState.isLoading,
    isRoutesFirstLoaded: routeState.isFirstLoaded,
    httpRoutes: httpRoutes,
    httpRoute: httpRoutes.find((x) => x.name === name),
  };
};

export interface WithRoutesDataProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export const withRoutesData = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.FC<WithRoutesDataProps> = (props) => {
    return <WrappedComponent {...props} />;
  };

  HOC.displayName = `WithRoutesData(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(HOC);
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
