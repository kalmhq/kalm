import { push } from "connected-react-router";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "types";
import { loadLoginStatusAction } from "actions/auth";
import { RootState } from "reducers";
import { Loading } from "widgets/Loading";
import { getDisplayName } from "./utils";
import { Box } from "@material-ui/core";

const mapStateToProps = (state: RootState) => {
  const auth = state.auth;
  const authorized = auth.authorized;
  const firstLoaded = auth.firstLoaded;
  const isLoading = auth.isLoading;
  const policies = auth.policies;

  return {
    isLoading,
    authorized,
    firstLoaded,
    policies,
  };
};

interface Props extends ReturnType<typeof mapStateToProps> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

interface Options {
  mustAuthorized?: boolean;
  mustNotAuthorized?: boolean;
}

export const Authorizated = ({ mustAuthorized, mustNotAuthorized }: Options) => (
  WrappedComponent: React.ComponentType<any>,
) => {
  const wrapper: React.ComponentType<Props> = class extends React.Component<Props> {
    componentDidMount() {
      const { firstLoaded } = this.props;

      if (!firstLoaded) {
        this.props.dispatch(loadLoginStatusAction(false));
      }
    }

    componentDidUpdate() {
      const { firstLoaded, authorized, isLoading, policies } = this.props;

      if (isLoading && !firstLoaded) {
        return;
      }

      if (!authorized && mustAuthorized) {
        this.props.dispatch(push("/login"));
      }

      if (authorized && mustNotAuthorized) {
        this.props.dispatch(push("/"));
      }

      if (authorized && policies === "") {
        this.props.dispatch(push("/profile"));
      }
    }

    render() {
      const { firstLoaded, authorized, isLoading } = this.props;

      if (!firstLoaded && isLoading) {
        return (
          <Box flex="1">
            <Loading />
          </Box>
        );
      }

      if ((!authorized && mustAuthorized) || (authorized && mustNotAuthorized)) {
        return null;
      }

      return <WrappedComponent {...this.props} />;
    }
  };

  wrapper.displayName = `Authorizated(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(wrapper);
};

export const RequireAuthorizated = (WrappedComponent: React.ComponentType<any>) =>
  Authorizated({ mustAuthorized: true })(WrappedComponent);

export const RequireNotAuthorizated = (WrappedComponent: React.ComponentType<any>) =>
  Authorizated({ mustNotAuthorized: true })(WrappedComponent);
