import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "types";
import { Loading } from "widgets/Loading";
import { getDisplayName } from "./utils";
import { setCurrentNamespaceAction } from "actions/namespaces";
import { BasePage } from "pages/BasePage";
import { Box } from "@material-ui/core";

const mapStateToProps = (state: RootState, props: any) => {
  const applicationsRoot = state.get("applications");
  const namespaces = applicationsRoot.get("applications").map((application) => application.get("name"));
  const activeNamespace =
    props.match && props.match.params && props.match.params.applicationName
      ? props.match.params.applicationName
      : state.get("namespaces").get("active");
  const isApplicationListLoading = applicationsRoot.get("isListLoading");
  const isApplicationListFirstLoaded = applicationsRoot.get("isListFirstLoaded");
  const activeApplication = applicationsRoot
    .get("applications")
    .find((application) => application.get("name") === activeNamespace);
  const isAdmin = state.get("auth").get("isAdmin");

  return {
    isAdmin,
    activeNamespace,
    namespaces,
    isApplicationListLoading,
    isApplicationListFirstLoaded,
    activeApplication,
    hasRole: (role: string): boolean => {
      if (!role) {
        return true;
      }

      if (isApplicationListLoading && !isApplicationListFirstLoaded) {
        return false;
      }

      if (!activeNamespace || (!isAdmin && !activeApplication!.get("roles").find((x) => x === role))) {
        return false;
      }

      return true;
    },
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
    public componentDidMount() {
      this.props.dispatch(setCurrentNamespaceAction(this.props.activeNamespace, false));
    }

    render() {
      const { isAdmin, isApplicationListLoading, isApplicationListFirstLoaded, activeApplication } = this.props;

      if (isApplicationListLoading && !isApplicationListFirstLoaded) {
        return (
          <Box flex="1">
            <Loading />
          </Box>
        );
      }

      if (!activeApplication || (!isAdmin && !activeApplication.get("roles").find((x) => x === requiredRole))) {
        return <BasePage>Please create a application first</BasePage>;
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

export const NamespaceVisibleContainer = connect(mapStateToProps, null, null, { forwardRef: true })(
  NamespaceVisibleContainerRaw,
);
