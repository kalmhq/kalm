import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";

const mapStateToProps = (state: RootState) => {
  const permissionMethods = state.get("auth").get("permissionMethods");
  return { ...permissionMethods };
};

export interface withUserAuthProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export const withUserAuth = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.ComponentType<withUserAuthProps> = class extends React.PureComponent<withUserAuthProps> {
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };

  HOC.displayName = `withUserAuth(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(HOC);
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
