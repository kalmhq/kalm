import { createStyles, Theme, withStyles, WithStyles, Grid } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { createRegistryAction } from "actions/registries";
import { RegistryForm } from "forms/Registry";
import { newEmptyRegistry, RegistryFormType } from "types/registry";
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
  private submit = async (registryValue: RegistryFormType) => {
    const { dispatch } = this.props;
    await dispatch(createRegistryAction(registryValue));
    this.props.dispatch(push("/cluster/registries"));
  };

  public render() {
    return (
      <BasePage secondHeaderRight={<H6>{"Add Registry"}</H6>}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={8}>
            <RegistryForm onSubmit={this.submit} initial={newEmptyRegistry()} />
          </Grid>
        </Grid>
      </BasePage>
    );
  }
}

export const RegistryNewPage = withStyles(styles)(connect()(RegistryNewPageRaw));
