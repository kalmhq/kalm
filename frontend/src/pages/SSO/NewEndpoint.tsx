import React from "react";
import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { ProtectedEndpointForm } from "forms/ProtectedEndpoint";
import { BasePage } from "pages/BasePage";
import { newEmptyProtectedEndpoint, ProtectedEndpoint } from "types/sso";
import { push } from "connected-react-router";
import { createProtectedEndpointAction } from "actions/sso";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

class NewEndpointPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private onSubmit = (values: ProtectedEndpoint) => {
    const { dispatch } = this.props;
    return dispatch(createProtectedEndpointAction(values));
  };

  private onSubmitSuccess = () => {
    this.props.dispatch(push("/sso"));
  };

  public render() {
    return (
      <BasePage>
        <Box p={2}>
          <ProtectedEndpointForm
            initialValues={newEmptyProtectedEndpoint()}
            onSubmit={this.onSubmit}
            onSubmitSuccess={this.onSubmitSuccess}
          />
        </Box>
      </BasePage>
    );
  }
}

export const NewEndpointPage = withStyles(styles)(connect(mapStateToProps)(NewEndpointPageRaw));
