import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { loadApplicationsAction } from "actions/application";

const mapStateToProps = (state: RootState) => {
  return {
    clusterInfo: state.get("cluster").get("info"),
  };
};

export interface WithClusterInfoProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export const withClusterInfo = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.ComponentType<WithClusterInfoProps> = class extends React.Component<WithClusterInfoProps> {
    componentDidMount() {
      this.props.dispatch(loadApplicationsAction());
    }

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
