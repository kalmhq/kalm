import { Button, createStyles, Grid, WithStyles, withStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles";
import Immutable from "immutable";
import React, { Dispatch } from "react";
import { connect } from "react-redux";
import { change, InjectedFormProps, reset } from "redux-form";
import { Field, getFormValues, reduxForm } from "redux-form/immutable";
import { RootState } from "reducers";
import { ValidatorRequired } from "../validator";
import { Prompt } from "widgets/Prompt";
import { PROTECTED_ENDPOINT_ID } from "../formIDs";
import { ProtectedEndpoint } from "types/sso";
import { RenderSelectField } from "forms/Basic/select";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { createProtectedEndpointAction } from "actions/sso";
import sc from "utils/stringConstants";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  const fieldValues =
    (getFormValues(PROTECTED_ENDPOINT_ID)(state) as ProtectedEndpoint) || (Immutable.Map() as ProtectedEndpoint);

  return {
    fieldValues,
    allComponents: state.get("components").get("components"),
  };
};

export interface Props {
  isEdit?: boolean;
}
export interface FinalProps
  extends Props,
    WithNamespaceProps,
    InjectedFormProps<ProtectedEndpoint, Props>,
    ReturnType<typeof mapStateToProps>,
    WithStyles<typeof styles> {}

class ProtectedEndpointFormRaw extends React.PureComponent<FinalProps> {
  public componentDidUpdate(prevProps: FinalProps) {
    if (prevProps.fieldValues.get("namespace") !== this.props.fieldValues.get("namespace")) {
      this.props.dispatch(change(PROTECTED_ENDPOINT_ID, "endpointName", ""));
    }
  }

  private handleSubmit = async (values: ProtectedEndpoint) => {
    const { dispatch } = this.props;
    return dispatch(createProtectedEndpointAction(values));
  };

  public render() {
    const { handleSubmit, classes, dirty, submitSucceeded, fieldValues, applications, allComponents } = this.props;

    const applicationOptions = applications
      .map((a) => ({
        value: a.get("name"),
        text: a.get("name"),
      }))
      .toArray();

    let componentOptions: { value: string; text: string }[] = [];
    const selectApplication = fieldValues.get("namespace");

    if (selectApplication) {
      const components = allComponents.get(selectApplication);

      if (components) {
        componentOptions = components
          .map((c) => ({
            value: c.get("name"),
            text: c.get("name"),
          }))
          .toArray();
      }
    }

    return (
      <form onSubmit={handleSubmit(this.handleSubmit)} className={classes.root}>
        <Prompt when={dirty && !submitSucceeded} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
        <Grid container spacing={2}>
          <Grid item md={5}>
            <Field
              name="namespace"
              label="Application"
              autoComplete="off"
              component={RenderSelectField}
              validate={ValidatorRequired}
              options={applicationOptions}
            />
          </Grid>
          <Grid item md={5}>
            <Field
              name="endpointName"
              label="Component"
              autoComplete="off"
              key={fieldValues.get("namespace")}
              disabled={!fieldValues.get("namespace")}
              placeholder={!fieldValues.get("namespace") ? "Please select Application first" : "Choose a component"}
              component={RenderSelectField}
              validate={ValidatorRequired}
              options={componentOptions}
            />
          </Grid>
          <Grid item md={2} style={{ display: "flex", alignItems: "center" }}>
            <Button color="primary" variant="outlined" type="submit">
              New Protected Endpoint
            </Button>
          </Grid>
        </Grid>

        {process.env.REACT_APP_DEBUG === "true" ? (
          <pre style={{ maxWidth: 1500, background: "#eee" }}>
            {JSON.stringify(this.props.fieldValues, undefined, 2)}
          </pre>
        ) : null}
      </form>
    );
  }
}

export const ProtectedEndpointForm = reduxForm<ProtectedEndpoint, Props>({
  form: PROTECTED_ENDPOINT_ID,
  enableReinitialize: true,
  keepDirtyOnReinitialize: false,
  initialValues: Immutable.Map(),
  onSubmitSuccess(
    result: any,
    dispatch: Dispatch<any>,
    props: Props & InjectedFormProps<ProtectedEndpoint, Props, string>,
  ): void {
    dispatch(reset(props.form));
  },
  onSubmitFail: (...args) => {
    console.log("submit failed", args);
  },
})(connect(mapStateToProps)(withNamespace(withStyles(styles)(ProtectedEndpointFormRaw))));
