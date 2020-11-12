import { push } from "connected-react-router";
import React from "react";
import { connect } from "react-redux";
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
  const HOC: React.ComponentType<WithUserAuthProps> = class extends React.PureComponent<WithUserAuthProps> {
    private canViewPage = () => {
      const { location, canEditTenant, canViewCluster, canViewTenant, canManageCluster } = this.props;
      if (location.pathname.includes("/certificates")) {
        return canEditTenant() || canViewCluster();
      } else if (location.pathname.includes("/ci")) {
        return canEditTenant();
      } else if (location.pathname.includes("/cluster/nodes")) {
        return canViewCluster();
      } else if (location.pathname.includes("/cluster/loadbalancer")) {
        return canViewTenant();
      } else if (location.pathname.includes("/cluster/disks")) {
        return canViewTenant();
      } else if (location.pathname.includes("/cluster/registries")) {
        return canEditTenant();
      } else if (location.pathname.includes("/sso")) {
        return canViewCluster();
      } else if (location.pathname.includes("/cluster/members")) {
        return canManageCluster();
      } else if (location.pathname.includes("/version")) {
        return canManageCluster();
      }
      return true;
    };

    componentDidMount() {
      if (!this.canViewPage()) {
        this.props.dispatch(push("/"));
      }
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };

  HOC.displayName = `withUserAuth(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(withRouter(HOC));
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
