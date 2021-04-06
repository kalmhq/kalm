import { Box } from "@material-ui/core";
import { setCurrentNamespaceAction } from "actions/namespaces";
import { LEFT_SECTION_OPEN_WIDTH } from "layout/Constants";
import { BasePage } from "pages/BasePage";
import React, { useEffect } from "react";
import { connect, useDispatch } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { RootState } from "store";
import { TDispatchProp } from "types";
import { Loading } from "widgets/Loading";
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
  const HOC: React.FC<WithNamespaceProps> = (props) => {
    const dispatch = useDispatch();

    const { isNamespaceFirstLoaded, applications, applicationNameParam, activeNamespaceName } = props;

    const updateCurrent = () => {
      dispatch(setCurrentNamespaceAction(activeNamespaceName, false));
    };

    useEffect(updateCurrent, [activeNamespaceName, dispatch]);

    if (!isNamespaceFirstLoaded) {
      return (
        <Box flex="1" width={LEFT_SECTION_OPEN_WIDTH}>
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
                redirect={`/namespaces`}
                redirectText="Go back to Apps List"
              ></ResourceNotFound>
            </Box>
          </BasePage>
        );
      }
    }

    return <WrappedComponent {...props} />;
  };

  HOC.displayName = `WithNamespace(${getDisplayName(WrappedComponent)})`;

  return withRouter(connect(mapStateToProps)(HOC));
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
