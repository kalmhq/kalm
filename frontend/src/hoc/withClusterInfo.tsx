import React from "react";
import { useDispatch, useSelector } from "react-redux";
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
  const HOC: React.FC<WithClusterInfoProps & any> = (props) => {
    return <WrappedComponent {...props} {...useSelector(mapStateToProps)} dispatch={useDispatch()} />;
  };

  HOC.displayName = `WithClusterInfo(${getDisplayName(WrappedComponent)})`;

  return HOC;
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
