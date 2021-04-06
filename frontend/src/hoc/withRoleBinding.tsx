import { RootState } from "configureStore";
import React from "react";
import { connect, useSelector } from "react-redux";
import { TDispatchProp } from "types";

const mapStateToProps = (state: RootState) => {
  const roles = state.roles;
  const roleBindings = roles.roleBindings;

  return {
    isRoleBindingsLoading: roles.isLoading,
    isRoleBindingsFirstLoaded: roles.isFirstLoaded,
    roleBindings: roleBindings,
  };
};

export interface WithRoleBindingProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export const withRoleBindings = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.FC<WithRoleBindingProps> = (props) => {
    return <WrappedComponent {...props} />;
  };

  HOC.displayName = `WithRoleBindings(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(HOC);
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}

export const useRoleBindings = () => {
  return useSelector(mapStateToProps);
};
