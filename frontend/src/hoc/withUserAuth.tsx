import React from "react";
import { connect, useSelector } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { RootState } from "store";
import { TDispatchProp } from "types";

const mapStateToProps = (state: RootState) => {
  const impersonation = state.auth.impersonation;
  const impersonationType = state.auth.impersonationType;
  const authToken = state.auth.token;
  return { auth: state.auth, authToken, impersonation, impersonationType };
};

export interface WithUserAuthProps extends ReturnType<typeof mapStateToProps>, TDispatchProp, RouteComponentProps {}

export const withUserAuth = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.FC<WithUserAuthProps> = (props) => {
    return <WrappedComponent {...props} />;
  };

  HOC.displayName = `withUserAuth(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(withRouter(HOC));
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}

export const useAuth = () => {
  return useSelector(mapStateToProps);
};
