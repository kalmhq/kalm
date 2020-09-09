import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatchProp } from "types";

const mapStateToProps = (state: RootState) => {
  const disksState = state.get("persistentVolumes");
  const disks = disksState.persistentVolumes;

  return {
    disks,
  };
};

export interface WithDisksProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export const withDisks = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.ComponentType<WithDisksProps> = class extends React.Component<WithDisksProps> {
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };

  HOC.displayName = `WithDisks(${getDisplayName(WrappedComponent)})`;

  return withRouter(connect(mapStateToProps)(HOC));
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
