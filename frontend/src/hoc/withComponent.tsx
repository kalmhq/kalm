import { Box } from "@material-ui/core";
import hoistNonReactStatics from "hoist-non-react-statics";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { RootState } from "reducers";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "types";
import { Namespaces } from "widgets/Namespaces";
import { ResourceNotFound } from "widgets/ResourceNotFound";
import { withNamespace, WithNamespaceProps } from "./withNamespace";

const mapStateToProps = (
  state: RootState,
  {
    components,
    match: {
      params: { applicationName, name },
    },
  }: WithNamespaceProps & RouteComponentProps<{ applicationName: string; name: string }>,
) => {
  return {
    applicationName,
    component: components?.find((c) => c.get("name") === name)!,
  };
};

export interface WithComponentProp extends ReturnType<typeof mapStateToProps>, WithNamespaceProps {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

export const withComponent = (WrappedComponent: React.ComponentType<any>) => {
  const withComponent: React.ComponentType<WithComponentProp> = class extends React.Component<WithComponentProp> {
    render() {
      if (!this.props.component) {
        return (
          <BasePage secondHeaderLeft={<Namespaces />} leftDrawer={<ApplicationSidebar />}>
            <Box p={2}>
              <ResourceNotFound
                text="Component not found"
                redirect={`/applications/${this.props.applicationName}/components`}
                redirectText="Go back to Components List"
              />
            </Box>
          </BasePage>
        );
      }

      return <WrappedComponent {...this.props} />;
    }
  };

  withComponent.displayName = `withComponent(${getDisplayName(WrappedComponent)})`;
  hoistNonReactStatics(withComponent, WrappedComponent);
  return withNamespace(connect(mapStateToProps)(withComponent));
};

function getDisplayName(WrappedComponent: React.ComponentType) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
