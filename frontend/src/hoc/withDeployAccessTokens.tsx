import { RootState } from "configureStore";
import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "types";

const mapStateToProps = (state: RootState) => {
  const deployAccessTokens = state.deployAccessTokens;

  return {
    deployAccessTokens: deployAccessTokens.deployAccessTokens,
    loaded: deployAccessTokens.loaded,
    isLoading: deployAccessTokens.isLoading,
  };
};

export interface WithDeployAccessTokensProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export const withDeployAccessTokens = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.FC<WithDeployAccessTokensProps> = (props) => {
    return <WrappedComponent {...props} />;
  };

  HOC.displayName = `WithDeployAccessTokens(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(HOC);
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
