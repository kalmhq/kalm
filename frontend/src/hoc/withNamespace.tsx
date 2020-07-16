import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { Loading } from "widgets/Loading";
import { setCurrentNamespaceAction } from "actions/namespaces";
import { Box } from "@material-ui/core";

const mapStateToProps = (
  state: RootState,
  {
    match: {
      params: { applicationName },
    },
  }: RouteComponentProps<{ applicationName: string }>,
) => {
  const applicationsState = state.get("applications");
  const activeNamespaceName = applicationName || state.getIn(["namespaces", "active"]);
  const applications = applicationsState.get("applications");
  const activeNamespace = applications.find((x) => x.get("name") === activeNamespaceName);

  return {
    activeNamespaceName,
    activeNamespace,
    applications,
    components: state.get("components").get("components").get(activeNamespaceName), // application details page need components and withRoutesData
    isNamespaceLoading: applicationsState.get("isListLoading"),
    isNamespaceFirstLoaded: applicationsState.get("isListFirstLoaded"),
  };
};

export interface WithNamespaceProps
  extends ReturnType<typeof mapStateToProps>,
    TDispatchProp,
    RouteComponentProps<{}> {}

export const withNamespace = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.ComponentType<WithNamespaceProps> = class extends React.Component<WithNamespaceProps> {
    componentDidMount() {
      this.props.dispatch(setCurrentNamespaceAction(this.props.activeNamespaceName, false));
    }

    componentDidUpdate(prevProps: any) {
      if (this.props.activeNamespaceName !== prevProps.activeNamespaceName) {
        this.props.dispatch(setCurrentNamespaceAction(this.props.activeNamespaceName, false));
      }
    }

    render() {
      const { isNamespaceFirstLoaded } = this.props;

      if (!isNamespaceFirstLoaded) {
        return (
          <Box flex="1">
            <Loading />
          </Box>
        );
      }

      // if (!activeNamespace) {
      //   return <BasePage>Please create a application first</BasePage>;
      // }

      return <WrappedComponent {...this.props} />;
    }
  };

  HOC.displayName = `WithNamespace(${getDisplayName(WrappedComponent)})`;

  return withRouter(connect(mapStateToProps)(HOC));
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
