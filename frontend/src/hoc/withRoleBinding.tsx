import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";

const mapStateToProps = (state: RootState) => {
  const roles = state.get("roles");
  const roleBindings = roles.get("roleBindings");

  return {
    isRoleBindingsLoading: roles.get("isLoading"),
    isRoleBindingsFirstLoaded: roles.get("isFirstLoaded"),
    roleBindings: roleBindings,
  };
};

export interface WithRoleBindingProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export const withRoleBindings = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.ComponentType<WithRoleBindingProps> = class extends React.Component<WithRoleBindingProps> {
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };

  HOC.displayName = `WithRoleBindings(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(HOC);
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
