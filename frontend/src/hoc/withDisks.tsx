import { RootState } from "configureStore";
import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { TDispatchProp } from "types";

const mapStateToProps = (state: RootState) => {
  const disksState = state.persistentVolumes;
  const disks = disksState.persistentVolumes;

  return {
    disks,
  };
};

export interface WithDisksProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export const withDisks = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.FC<WithDisksProps> = (props) => {
    return <WrappedComponent {...props} />;
  };

  HOC.displayName = `WithDisks(${getDisplayName(WrappedComponent)})`;

  return withRouter(connect(mapStateToProps)(HOC));
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
