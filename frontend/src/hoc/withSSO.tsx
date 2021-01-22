import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";

const mapStateToProps = (state: RootState) => {
  const sso = state.sso;
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
  const HOC: React.FC<WithSSOProps> = (props) => {
    return <WrappedComponent {...props} {...useSelector(mapStateToProps)} dispatch={useDispatch()} />;
  };

  HOC.displayName = `WithSSO(${getDisplayName(WrappedComponent)})`;

  return HOC;
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
