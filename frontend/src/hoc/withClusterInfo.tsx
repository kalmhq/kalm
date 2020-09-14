import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";

const mapStateToProps = (state: RootState) => {
  return {
    clusterInfo: state.cluster.info,
    isClusterInfoLoading: state.cluster.isLoading,
    isClusterInfoLoaded: state.cluster.isFirstLoaded,
  };
};

export interface WithClusterInfoProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export const withClusterInfo = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.ComponentType<WithClusterInfoProps & any> = class extends React.Component<WithClusterInfoProps> {
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };

  HOC.displayName = `WithClusterInfo(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(HOC);
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
