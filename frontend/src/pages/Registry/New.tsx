import { createStyles, Theme, withStyles, WithStyles, Grid } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { createRegistryAction } from "actions/registries";
import { RegistryForm } from "forms/Registry";
import { newEmptyRegistry, RegistryType } from "types/registry";
import { BasePage } from "pages/BasePage";
import { H6 } from "widgets/Label";
import { push } from "connected-react-router";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles>, TDispatchProp {}

interface State {}

class RegistryNewPageRaw extends React.PureComponent<Props, State> {
  private submit = async (registryValue: RegistryType) => {
    const { dispatch } = this.props;
    await dispatch(createRegistryAction(registryValue));
  };

  private onSubmitSuccess = () => {
    this.props.dispatch(push("/cluster/registries"));
  };

  public render() {
    return (
      <BasePage secondHeaderRight={<H6>{"Add Registry"}</H6>}>
        <Grid container spacing={2}>
          <Grid item xs={8} sm={8} md={8}>
            <RegistryForm
              onSubmit={this.submit}
              onSubmitSuccess={this.onSubmitSuccess}
              initialValues={newEmptyRegistry()}
            />
          </Grid>
        </Grid>
      </BasePage>
    );
  }
}

export const RegistryNewPage = withStyles(styles)(connect()(RegistryNewPageRaw));
