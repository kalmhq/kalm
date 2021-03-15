import { push } from "connected-react-router";
import React, { useEffect } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatchProp } from "types";

const mapStateToProps = (state: RootState) => {
  const permissionMethods = state.auth.permissionMethods;
  const impersonation = state.auth.impersonation;
  const impersonationType = state.auth.impersonationType;
  const authToken = state.auth.token;
  return { auth: state.auth, authToken, impersonation, impersonationType, ...permissionMethods };
};

export interface WithUserAuthProps extends ReturnType<typeof mapStateToProps>, TDispatchProp, RouteComponentProps {}

export const withUserAuth = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.FC<WithUserAuthProps> = (props) => {
    const dispatch = useDispatch();
    const { location, canEditCluster, canViewCluster, canManageCluster } = props;

    const didMount = () => {
      const canViewPage = () => {
        if (location.pathname.includes("/certificates")) {
          return canManageCluster();
        } else if (location.pathname.includes("/domains")) {
          return canManageCluster();
        } else if (location.pathname.includes("/webhooks")) {
          return canEditCluster();
        } else if (location.pathname.includes("/cluster/nodes")) {
          return canViewCluster();
        } else if (location.pathname.includes("/cluster/loadbalancer")) {
          return canViewCluster();
        } else if (location.pathname.includes("/cluster/disks")) {
          return true;
        } else if (location.pathname.includes("/cluster/pull-secrets")) {
          return canEditCluster();
        } else if (location.pathname.includes("/sso")) {
          return canManageCluster();
        } else if (location.pathname.includes("/members")) {
          return canManageCluster();
        } else if (location.pathname.includes("/version")) {
          return canViewCluster();
        }
        return true;
      };

      if (!canViewPage()) {
        dispatch(push("/"));
      }
    };

    useEffect(didMount, [dispatch, location, canEditCluster, canViewCluster, canManageCluster]);

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
