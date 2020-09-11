import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { Loading } from "widgets/Loading";
import { setCurrentNamespaceAction } from "actions/namespaces";
import { Box } from "@material-ui/core";
import { BasePage } from "pages/BasePage";
import { ResourceNotFound } from "widgets/ResourceNotFound";

const mapStateToProps = (
  state: RootState,
  {
    match: {
      params: { applicationName },
    },
  }: RouteComponentProps<{ applicationName: string }>,
) => {
  const applicationsState = state.applications;
  const activeNamespaceName = applicationName || state.namespaces.active;
  const applications = applicationsState.applications;
  const activeNamespace = applications.find((x) => x.name === activeNamespaceName);

  return {
    applicationNameParam: applicationName,
    activeNamespaceName,
    activeNamespace,
    applications,
    components: state.components.components[activeNamespaceName], // application details page need components and withRoutesData
    isNamespaceLoading: applicationsState.isListLoading,
    isNamespaceFirstLoaded: applicationsState.isListFirstLoaded,
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
        console.log(this.props.applications.length);
        this.props.dispatch(setCurrentNamespaceAction(this.props.activeNamespaceName, false));
      }
    }

    render() {
      const { isNamespaceFirstLoaded, applications, applicationNameParam } = this.props;

      if (!isNamespaceFirstLoaded) {
        return (
          <Box flex="1">
            <Loading />
          </Box>
        );
      }

      if (applications.length > 0 && applicationNameParam) {
        let foundApp = false;
        applications.forEach((app) => {
          if (app.name === applicationNameParam) {
            foundApp = true;
          }
        });

        if (!foundApp) {
          return (
            <BasePage>
              <Box p={2}>
                <ResourceNotFound
                  text="App not found"
                  redirect={`/applications`}
                  redirectText="Go back to Apps List"
                ></ResourceNotFound>
              </Box>
            </BasePage>
          );
        }
      }

      return <WrappedComponent {...this.props} />;
    }
  };

  HOC.displayName = `WithNamespace(${getDisplayName(WrappedComponent)})`;

  return withRouter(connect(mapStateToProps)(HOC));
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
