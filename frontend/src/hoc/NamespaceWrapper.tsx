import queryString from "query-string";
import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router";
import { RootState } from "reducers";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "types";

const mapStateToProps = (state: RootState, ownProps: RouteComponentProps) => {
  const namespaces = state.get("namespaces");
  const queries = queryString.parse(ownProps.location.search);
  const queryNamespaceName = queries.namespace;
  const queryNamespace = namespaces.get("namespaces").find(ns => ns.get("name") === queryNamespaceName);

  return {
    queryNamespace,
    queryNamespaceName: queryNamespaceName
  };
};

export interface NamespaceQueryWrapperProps extends ReturnType<typeof mapStateToProps> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

export const NamespaceQueryWrapper = (WrappedComponent: React.ComponentType<any>) => {
  const wrapper: React.ComponentType<NamespaceQueryWrapperProps> = class extends React.Component<
    NamespaceQueryWrapperProps
  > {
    componentDidMount() {}

    componentDidUpdate() {}

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };

  wrapper.displayName = `wrapper(${getDisplayName(WrappedComponent)})`;

  return withRouter(connect(mapStateToProps)(wrapper));
};

function getDisplayName(WrappedComponent: React.ComponentType) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
