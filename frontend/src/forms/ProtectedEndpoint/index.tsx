import { Box, Button, createStyles, Grid, WithStyles, withStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles";
import { Field, Form, FormikProps, withFormik } from "formik";
import { KFreeSoloFormikAutoCompleteMultiValues } from "forms/Basic/autoComplete";
import { RenderFormikSelectField } from "forms/Basic/select";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { ProtectedEndpoint } from "types/sso";
import sc from "utils/stringConstants";
import { KPanel } from "widgets/KPanel";
import { Prompt } from "widgets/Prompt";
import { ValidatorRequired } from "../validator";
import { Application } from "types/application";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {
    allComponents: state.get("components").components,
  };
};

const normalizePorts = (values?: Array<string | number>) => {
  if (!values) return undefined;

  const valuesSet = new Set<number>();

  values.forEach((x) => {
    const val = parseInt(x.toString(), 10);

    // Check if the number has non-number suffix
    // e.g. "123,," will be parsed as 123, but it's still an invalid value
    if (x !== val && val.toString() !== x) {
      // the validator will raise errors
      return;
    }
    valuesSet.add(val);
  });

  return Array.from(valuesSet);
};

const validatePorts = (values?: number[]) => {
  if (!values || values.length === 0) {
    return undefined;
  }

  const errors = values.map((port) => {
    if (!port) {
      return "Invalid port";
    }

    return port > 65535 || port <= 0 ? "Port should be in range of (0,65536)" : undefined;
  });

  return errors.filter((x) => !!x).length > 0 ? errors : undefined;
};

export interface Props {
  isEdit?: boolean;
  onSubmit: any;
  initial: ProtectedEndpoint;
}

export interface FinalProps
  extends Props,
    WithNamespaceProps,
    FormikProps<ProtectedEndpoint>,
    ReturnType<typeof mapStateToProps>,
    WithStyles<typeof styles> {}

class ProtectedEndpointFormRaw extends React.PureComponent<FinalProps> {
  public componentDidUpdate(prevProps: FinalProps) {
    const { values, setFieldValue } = this.props;
    if (prevProps.values.namespace !== values.namespace) {
      setFieldValue("endpointName", "");
      setFieldValue("ports", []);
    }

    if (prevProps.values.endpointName !== values.endpointName) {
      setFieldValue("ports", []);
    }
  }

  private isEdit = () => {
    const { initialValues } = this.props;
    const initializeNamespace = initialValues.name;
    return initializeNamespace !== "";
  };

  public render() {
    const { classes, dirty, values, applications, allComponents, isSubmitting } = this.props;

    const applicationOptions = applications.map((a: Application) => ({
      value: a.name,
      text: a.name,
    }));

    let componentOptions: { value: string; text: string }[] = [];
    const selectApplication = values.namespace;

    if (selectApplication) {
      const components = allComponents[selectApplication];

      if (components) {
        componentOptions = components.map((c) => ({
          value: c.name,
          text: c.name,
        }));
      }
    }

    const isEdit = this.isEdit();

    return (
      <Form className={classes.root} id="protected-endpoint-form">
        <Prompt when={dirty && !isSubmitting} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
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
                    component={RenderFormikSelectField}
                    validate={ValidatorRequired}
                    options={applicationOptions}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    name="endpointName"
                    autoComplete="off"
                    key={values.namespace}
                    required
                    disabled={isEdit || !values.namespace}
                    label={!values.namespace ? "Please select an Application first" : "Choose a component"}
                    component={RenderFormikSelectField}
                    validate={ValidatorRequired}
                    options={componentOptions}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    component={KFreeSoloFormikAutoCompleteMultiValues}
                    label="Ports"
                    name="ports"
                    disabled={!values.endpointName}
                    placeholder={!values.endpointName ? "Please select a Component first" : "Select a port"}
                    normalize={normalizePorts}
                    validate={validatePorts}
                    helperText={sc.PROTECTED_ENDPOINT_PORT}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    component={KFreeSoloFormikAutoCompleteMultiValues}
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
            <pre style={{ maxWidth: 1500, background: "#eee" }}>{JSON.stringify(values, undefined, 2)}</pre>
          </Box>
        ) : null}
      </Form>
    );
  }
}

// export const ProtectedEndpointForm = reduxForm<ProtectedEndpoint, Props>({
//   form: PROTECTED_ENDPOINT_ID,
//   enableReinitialize: true,
//   keepDirtyOnReinitialize: false,
//   initialValues: Immutable.Map(),
//   onSubmitFail: (...args) => {
//     console.log("submit failed", args);
//   },
// })(connect(mapStateToProps)(withNamespace(withStyles(styles)(ProtectedEndpointFormRaw))));

const connectedForm = connect(mapStateToProps)(withNamespace(withStyles(styles)(ProtectedEndpointFormRaw)));

export const ProtectedEndpointForm = withFormik<Props, ProtectedEndpoint>({
  mapPropsToValues: (props) => {
    return props.initial;
  },
  validate: (values: ProtectedEndpoint) => {
    let errors = {};
    return errors;
  },
  handleSubmit: async (formValues, { props: { onSubmit } }) => {
    await onSubmit(formValues);
  },
})(connectedForm);
