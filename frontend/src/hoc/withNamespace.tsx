import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { loadApplicationsAction } from "actions/application";
import { RouteComponentProps } from "react-router";

const mapStateToProps = (
  state: RootState,
  {
    match: {
      params: { applicationName },
    },
  }: RouteComponentProps<{ applicationName: string }>,
) => {
  const applicationsState = state.get("applications");
  const activeNamespaceName = applicationName;
  const applications = applicationsState.get("applications");
  const activeNamespace = applications.find((x) => x.get("name") === activeNamespaceName);

  return {
    activeNamespaceName,
    activeNamespace,
    applications,
    isNamespaceLoading: applicationsState.get("isListLoading"),
    isNamespaceFirstLoaded: applicationsState.get("isListFirstLoaded"),
  };
};

export interface WithNamespaceProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export const withNamespace = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.ComponentType<WithNamespaceProps> = class extends React.Component<WithNamespaceProps> {
    componentDidMount() {
      this.props.dispatch(loadApplicationsAction());
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };

  HOC.displayName = `WithNamespace(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(HOC);
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
