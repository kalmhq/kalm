import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "types";
import { Loading } from "widgets/Loading";
import { getDisplayName } from "./utils";

const mapStateToProps = (state: RootState) => {
  const namespacesRoot = state.get("namespaces");
  const namespaces = namespacesRoot.get("namespaces");
  const activeNamespaceName = namespacesRoot.get("active");
  const isNamespacesLoading = namespacesRoot.get("isListLoading");
  const isNamespacesFirstLoaded = namespacesRoot.get("isFirstLoaded");
  const activeNamespace = namespacesRoot.get("namespaces").find(ns => ns.get("name") === activeNamespaceName);
  const isAdmin = state.get("auth").get("isAdmin");

  return {
    isAdmin,
    activeNamespaceName,
    namespaces,
    isNamespacesLoading,
    isNamespacesFirstLoaded,
    activeNamespace,
    hasRole: (role: string): boolean => {
      if (!role) {
        return true;
      }

      if (isNamespacesLoading && !isNamespacesFirstLoaded) {
        return false;
      }

      if (!activeNamespace || (!isAdmin && !activeNamespace.get("roles").find(x => x === role))) {
        return false;
      }

      return true;
    }
  };
};

export interface withNamespaceProps extends ReturnType<typeof mapStateToProps> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

export const withNamespace = (WrappedComponent: React.ComponentType<any>) => {
  return connect(mapStateToProps)(WrappedComponent);
};

interface Options {
  requiredRole: string;
}

export const RequireRoleInNamespce = ({ requiredRole }: Options) => (WrappedComponent: React.ComponentType<any>) => {
  const wrapper: React.ComponentType<withNamespaceProps> = class extends React.Component<withNamespaceProps> {
    render() {
      const { isAdmin, isNamespacesLoading, isNamespacesFirstLoaded, activeNamespace } = this.props;

      if (isNamespacesLoading && !isNamespacesFirstLoaded) {
        return <Loading />;
      }

      if (!activeNamespace || (!isAdmin && !activeNamespace.get("roles").find(x => x === requiredRole))) {
        return "Please select a namespace first";
      }

      return <WrappedComponent {...this.props} />;
    }
  };

  wrapper.displayName = `withNamespace(${getDisplayName(WrappedComponent)})`;

  return withNamespace(wrapper);
};

export const RequireNamespaceReader = (WrappedComponent: React.ComponentType<any>) =>
  RequireRoleInNamespce({ requiredRole: "reader" })(WrappedComponent);

export const RequireNamespaceWriter = (WrappedComponent: React.ComponentType<any>) =>
  RequireRoleInNamespce({ requiredRole: "writer" })(WrappedComponent);

class NamespaceVisibleContainerRaw extends React.Component<
  withNamespaceProps & { requiredRole?: string; children: React.ReactNode }
> {
  render() {
    const { hasRole, children, requiredRole } = this.props;
    return hasRole(requiredRole || "") ? children : null;
  }
}

export const NamespaceVisibleContainer = withNamespace(NamespaceVisibleContainerRaw);
