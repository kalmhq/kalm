import { createStyles, Theme, withStyles, WithStyles, Grid } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { updateRegistryAction } from "actions/registries";
import { RegistryForm } from "forms/Registry";
import { RegistryType } from "types/registry";
import { BasePage } from "pages/BasePage";
import { H6 } from "widgets/Label";
import { push } from "connected-react-router";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState, ownProps: any) => {
  return {
    initialValues: state
      .get("registries")
      .get("registries")
      .find((registry) => registry.get("name") === ownProps.match.params.name),
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

class RegistryEditPageRaw extends React.PureComponent<Props, State> {
  private submit = async (registryValue: RegistryType) => {
    const { dispatch } = this.props;
    await dispatch(updateRegistryAction(registryValue));
  };

  private onSubmitSuccess = () => {
    this.props.dispatch(push("/cluster/registries"));
  };

  public render() {
    const { initialValues } = this.props;
    return (
      <BasePage secondHeaderRight={<H6>Edit Registry</H6>}>
        <Grid container spacing={2}>
          <Grid item xs={8} sm={8} md={8}>
            <RegistryForm
              isEdit
              onSubmit={this.submit}
              onSubmitSuccess={this.onSubmitSuccess}
              initialValues={initialValues}
            />
          </Grid>
        </Grid>
      </BasePage>
    );
  }
}

export const RegistryEditPage = withStyles(styles)(connect(mapStateToProps)(RegistryEditPageRaw));
