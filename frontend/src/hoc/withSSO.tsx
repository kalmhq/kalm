import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";

const mapStateToProps = (state: RootState) => {
  const sso = state.get("sso");
  return {
    ssoConfig: sso.config,
    isSSOConfigLoaded: sso.loaded,
    isSSOConfigLoading: sso.isLoading,
    isProtectedEndpointsLoaded: sso.isProtectedEndpointsLoaded,
    isProtectedEndpointsLoading: sso.isProtectedEndpointsLoading,
    protectedEndpoints: sso.protectedEndpoints,
  };
};

export interface WithSSOProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export const withSSO = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.ComponentType<WithSSOProps> = class extends React.Component<WithSSOProps> {
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };

  HOC.displayName = `WithSSO(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(HOC);
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
