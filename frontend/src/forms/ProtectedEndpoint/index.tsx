import { Box, Button, createStyles, Grid, WithStyles, withStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { change, InjectedFormProps } from "redux-form";
import { Field, getFormValues, reduxForm } from "redux-form/immutable";
import { RootState } from "reducers";
import { ValidatorRequired } from "../validator";
import { Prompt } from "widgets/Prompt";
import { PROTECTED_ENDPOINT_ID } from "../formIDs";
import { ProtectedEndpoint } from "types/sso";
import { RenderSelectField } from "forms/Basic/select";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import sc from "utils/stringConstants";
import { KPanel } from "widgets/KPanel";
import { KFreeSoloAutoCompleteMultipleSelectStringField } from "forms/Basic/autoComplete";

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

const normalizePorts = (values?: Immutable.List<string | number>) => {
  if (!values) return undefined;

  return values
    .map((x) => {
      const val = parseInt(x.toString(), 10);

      // Check if the number has non-number suffix
      // e.g. "123,," will be parsed as 123, but it's still an invalid value
      if (x !== val && val.toString() !== x) {
        // the validator will raise errors
        return null;
      }

      return val;
    })
    .toSet()
    .toList();
};

const validatePorts = (values?: Immutable.List<number>) => {
  if (!values || values.size === 0) {
    return undefined;
  }

  const errors = values
    .map((port) => {
      if (!port) {
        return "Invalid port";
      }

      return port > 65535 || port <= 0 ? "Port should be in range of (0,65536)" : undefined;
    })
    .toArray();

  return errors.filter((x) => !!x).length > 0 ? errors : undefined;
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
      this.props.dispatch(change(PROTECTED_ENDPOINT_ID, "ports", Immutable.List()));
    }

    if (prevProps.fieldValues.get("endpointName") !== this.props.fieldValues.get("endpointName")) {
      this.props.dispatch(change(PROTECTED_ENDPOINT_ID, "ports", Immutable.List()));
    }
  }

  private isEdit = () => {
    const { initialValues } = this.props;
    const initializeNamespace = (initialValues as any).get("name");
    return initializeNamespace !== "";
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

    const isEdit = this.isEdit();

    return (
      <form onSubmit={handleSubmit} className={classes.root}>
        <Prompt when={dirty && !submitSucceeded} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
        <KPanel title={"Protected Endpoint"}>
          <Box p={2}>
            <Grid container spacing={2}>
              <Grid container item spacing={2} md={8}>
                <Grid item xs={12}>
                  <Field
                    name="namespace"
                    label="Application"
                    autoComplete="off"
                    disabled={isEdit}
                    required
                    component={RenderSelectField}
                    validate={ValidatorRequired}
                    options={applicationOptions}
                    helperText={sc.CANT_NOT_EDIT}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    name="endpointName"
                    autoComplete="off"
                    key={fieldValues.get("namespace")}
                    required
                    disabled={isEdit || !fieldValues.get("namespace")}
                    label={!fieldValues.get("namespace") ? "Please select an Application first" : "Choose a component"}
                    component={RenderSelectField}
                    validate={ValidatorRequired}
                    options={componentOptions}
                    helperText={sc.CANT_NOT_EDIT}
                  />
                </Grid>
                <Grid item xs={12}>
                  <KFreeSoloAutoCompleteMultipleSelectStringField
                    label="Ports"
                    name="ports"
                    disabled={!fieldValues.get("endpointName")}
                    placeholder={!fieldValues.get("endpointName") ? "Please select a Component first" : "Select a port"}
                    normalize={normalizePorts}
                    validate={validatePorts}
                    helperText={sc.PROTECTED_ENDPOINT_PORT}
                  />
                </Grid>
                <Grid item xs={12}>
                  <KFreeSoloAutoCompleteMultipleSelectStringField
                    label="Grant to specific groups"
                    name="groups"
                    placeholder="e.g. my-github-org:a-team-name. a-gitlab-group-name"
                    helperText={sc.PROTECTED_ENDPOINT_SPECIFIC_GROUPS}
                  />
                </Grid>
                <Grid item md={5}>
                  <Button color="primary" variant="outlined" type="submit" size="small">
                    {isEdit ? "Edit Protected Endpoint" : "New Protected Endpoint"}
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </KPanel>
        {process.env.REACT_APP_DEBUG === "true" ? (
          <Box mt={2}>
            <pre style={{ maxWidth: 1500, background: "#eee" }}>
              {JSON.stringify(this.props.fieldValues, undefined, 2)}
            </pre>
          </Box>
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
  onSubmitFail: (...args) => {
    console.log("submit failed", args);
  },
})(connect(mapStateToProps)(withNamespace(withStyles(styles)(ProtectedEndpointFormRaw))));
