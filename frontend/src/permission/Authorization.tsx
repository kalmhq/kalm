import { push } from "connected-react-router";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "types";
import { loadLoginStatus } from "actions/auth";
import { RootState } from "reducers";
import { Loading } from "widgets/Loading";
import { getDisplayName } from "./utils";

const mapStateToProps = (state: RootState) => {
  const auth = state.get("auth");
  const authorized = auth.get("authorized");
  const firstLoaded = auth.get("firstLoaded");
  const isLoading = auth.get("isLoading");

  return {
    isLoading,
    authorized,
    firstLoaded,
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
        this.props.dispatch(loadLoginStatus());
      }
    }

    componentDidUpdate() {
      const { firstLoaded, authorized, isLoading } = this.props;

      if (isLoading && !firstLoaded) {
        return;
      }

      if (!authorized && mustAuthorized) {
        this.props.dispatch(push("/login"));
      }

      if (authorized && mustNotAuthorized) {
        this.props.dispatch(push("/"));
      }
    }

    render() {
      const { firstLoaded, authorized, isLoading } = this.props;

      if (!firstLoaded && isLoading) {
        return <Loading />;
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
