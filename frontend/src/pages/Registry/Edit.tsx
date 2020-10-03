import { Box, createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { updateRegistryAction } from "actions/registries";
import { push } from "connected-react-router";
import { RegistryForm } from "forms/Registry";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { RegistryFormType } from "types/registry";
import { H6 } from "widgets/Label";
import { ResourceNotFound } from "widgets/ResourceNotFound";
import { Loading } from "widgets/Loading";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState, ownProps: any) => {
  return {
    initialValues: state.registries.registries.find((registry) => registry.name === ownProps.match.params.name),
    isLoading: state.registries.isLoading,
    isFirstLoaded: state.registries.isFirstLoaded,
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

class RegistryEditPageRaw extends React.PureComponent<Props, State> {
  private submit = async (registryValue: RegistryFormType) => {
    const { dispatch } = this.props;
    await dispatch(updateRegistryAction(registryValue));
    this.props.dispatch(push("/cluster/registries"));
  };

  public render() {
    const { initialValues, isLoading, isFirstLoaded } = this.props;
    if (isLoading && !isFirstLoaded) {
      return <Loading />;
    }

    if (!initialValues) {
      return (
        <BasePage>
          <Box p={2}>
            <ResourceNotFound
              text="Registry not found"
              redirect={`/cluster/registries`}
              redirectText="Go back to Registries List"
            ></ResourceNotFound>
          </Box>
        </BasePage>
      );
    }

    return (
      <BasePage secondHeaderRight={<H6>Edit Registry</H6>}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={8}>
            <RegistryForm isEdit onSubmit={this.submit} initial={initialValues as RegistryFormType} />
          </Grid>
        </Grid>
      </BasePage>
    );
  }
}

export const RegistryEditPage = withStyles(styles)(connect(mapStateToProps)(RegistryEditPageRaw));
