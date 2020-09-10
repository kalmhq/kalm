import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";

const mapStateToProps = (state: RootState) => {
  const deployKeys = state.deployKeys;

  return {
    deployKeys: deployKeys.deployKeys,
    loaded: deployKeys.loaded,
    isLoading: deployKeys.isLoading,
  };
};

export interface WithDeployKeysProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export const withDeployKeys = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.ComponentType<WithDeployKeysProps> = class extends React.Component<WithDeployKeysProps> {
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };

  HOC.displayName = `WithDeployKeys(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(HOC);
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
