import { push } from "connected-react-router";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "types";
import { getDisplayName } from "./utils";
import { Loading } from "widgets/Loading";

const mapStateToProps = (state: RootState) => {
  const namespaces = state.get("namespaces");

  return {
    isAdmin: state.get("auth").get("isAdmin"),
    activeNamespaceName: namespaces.get("active"),
    namespaces: namespaces.get("namespaces"),
    isNamespacesLoading: namespaces.get("isListLoading"),
    isNamespacesFirstLoaded: namespaces.get("isFirstLoaded"),
    activeNamespace: namespaces.get("namespaces").find(ns => ns.get("name") === namespaces.get("active"))
  };
};

export interface NamespaceHocProps extends ReturnType<typeof mapStateToProps> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

interface Options {
  requiredRole: string;
}

export const NamespaceHoc = ({ requiredRole }: Options) => (WrappedComponent: React.ComponentType<any>) => {
  const wrapper: React.ComponentType<NamespaceHocProps> = class extends React.Component<NamespaceHocProps> {
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

  wrapper.displayName = `NamespaceHoc(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(wrapper);
};

export const RequireNamespaceReader = (WrappedComponent: React.ComponentType<any>) =>
  NamespaceHoc({ requiredRole: "reader" })(WrappedComponent);

export const RequireNamespaceWriter = (WrappedComponent: React.ComponentType<any>) =>
  NamespaceHoc({ requiredRole: "writer" })(WrappedComponent);
