import React from "react";
import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { ProtectedEndpointForm } from "forms/ProtectedEndpoint";
import { BasePage } from "pages/BasePage";
import { withSSO, WithSSOProps } from "hoc/withSSO";
import { Loading } from "widgets/Loading";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { push } from "connected-react-router";
import { ProtectedEndpoint } from "types/sso";
import { updateProtectedEndpointAction } from "actions/sso";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles>, WithSSOProps, RouteComponentProps<{ name: string }> {}

interface State {}

class EditEndpointPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private onSubmit = async (values: ProtectedEndpoint) => {
    const { dispatch } = this.props;
    await dispatch(updateProtectedEndpointAction(values));
    this.props.dispatch(push("/sso"));
  };

  public render() {
    const { isProtectedEndpointsLoaded, isProtectedEndpointsLoading, protectedEndpoints, match } = this.props;

    if (!isProtectedEndpointsLoaded && isProtectedEndpointsLoading) {
      return (
        <Box p={2}>
          <Loading />
        </Box>
      );
    }

    const protectedEndpoint = protectedEndpoints.find((x) => x.name === match.params.name);

    if (!protectedEndpoint) {
      return <Box p={2}>No such endpoint.</Box>;
    }

    return (
      <BasePage>
        <Box p={2}>
          <ProtectedEndpointForm initial={protectedEndpoint} onSubmit={this.onSubmit} />
        </Box>
      </BasePage>
    );
  }
}

export const EditEndpointPage = withStyles(styles)(withRouter(withSSO(EditEndpointPageRaw)));
