import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";

const mapStateToProps = (state: RootState) => {
  const deployAccessTokens = state.get("deployAccessTokens");

  return {
    deployAccessTokens: deployAccessTokens.get("deployAccessTokens"),
    loaded: deployAccessTokens.get("loaded"),
    isLoading: deployAccessTokens.get("isLoading"),
  };
};

export interface WithDeployAccessTokensProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export const withDeployAccessTokens = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.ComponentType<WithDeployAccessTokensProps> = class extends React.Component<
    WithDeployAccessTokensProps
  > {
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };

  HOC.displayName = `WithDeployAccessTokens(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(HOC);
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
