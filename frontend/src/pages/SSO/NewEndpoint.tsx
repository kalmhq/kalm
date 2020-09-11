import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { createProtectedEndpointAction } from "actions/sso";
import { push } from "connected-react-router";
import { ProtectedEndpointForm } from "forms/ProtectedEndpoint";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { newEmptyProtectedEndpoint, ProtectedEndpointFormType } from "types/sso";

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

  private onSubmit = async (values: ProtectedEndpointFormType) => {
    const { dispatch } = this.props;
    await dispatch(createProtectedEndpointAction(values));
    this.props.dispatch(push("/sso"));
  };

  public render() {
    return (
      <BasePage>
        <Box p={2}>
          <ProtectedEndpointForm initial={newEmptyProtectedEndpoint()} onSubmit={this.onSubmit} />
        </Box>
      </BasePage>
    );
  }
}

export const NewEndpointPage = withStyles(styles)(connect(mapStateToProps)(NewEndpointPageRaw));
