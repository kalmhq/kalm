import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";

const mapStateToProps = (state: RootState) => {
  const permissionMethods = state.get("auth").get("permissionMethods");
  return { ...permissionMethods };
};

export interface WithUserInfoProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export const withUserInfo = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.ComponentType<WithUserInfoProps> = class extends React.PureComponent<WithUserInfoProps> {
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };

  HOC.displayName = `WithUserInfo(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(HOC);
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
