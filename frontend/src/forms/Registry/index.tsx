import { createStyles, Grid, WithStyles, withStyles, Box } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { change, InjectedFormProps } from "redux-form";
import { Field, getFormValues, reduxForm } from "redux-form/immutable";
import { RootState } from "reducers";
import { newEmptyRegistry, RegistryType } from "types/registry";
import { KRenderDebounceTextField } from "../Basic/textfield";
import { RequireNoSuffix, RequirePrefix, ValidatorName, ValidatorRequired } from "../validator";
import { Prompt } from "widgets/Prompt";
import { REGISTRY_FORM_ID } from "../formIDs";
import sc from "utils/stringConstants";
import { CustomizedButton } from "widgets/Button";
import { KPanel } from "widgets/KPanel";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2),
    },
  });

const mapStateToProps = (state: RootState) => {
  const fieldValues = (getFormValues(REGISTRY_FORM_ID)(state) as RegistryType) || (Immutable.Map() as RegistryType);

  return {
    fieldValues,
    isSubmittingRegistry: state.get("registries").get("isSubmittingRegistry"),
  };
};

export interface Props {
  isEdit?: boolean;
}

const validateName = [ValidatorRequired, ValidatorName];
const validateHost = (value: any, _allValues?: any, _props?: any, _name?: any) => {
  if (!value) return undefined;

  return RequirePrefix("https://")(value) || RequireNoSuffix("/")(value);
};

class RegistryFormRaw extends React.PureComponent<
  Props &
    InjectedFormProps<RegistryType, Props> &
    ReturnType<typeof mapStateToProps> &
    WithStyles<typeof styles> &
    DispatchProp
> {
  private setDockerRegistry = () => {
    this.props.dispatch(change(REGISTRY_FORM_ID, "host", "https://registry-1.docker.io"));
  };

  public render() {
    const { handleSubmit, classes, isEdit, dirty, submitSucceeded, isSubmittingRegistry } = this.props;

    return (
      <form onSubmit={handleSubmit} className={classes.root}>
        <Prompt when={dirty && !submitSucceeded} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
        <KPanel
          content={
            <Box p={2}>
              <Grid container spacing={2}>
                <Grid item md={12}>
                  <Field
                    name="name"
                    label="Name"
                    disabled={isEdit}
                    component={KRenderDebounceTextField}
                    validate={validateName}
                    helperText={isEdit ? "Can't modify name" : sc.NAME_RULE}
                    placeholder="Please type the registry name"
                  />
                </Grid>
                <Grid item md={12}>
                  <Field
                    name="username"
                    label="Username"
                    autoComplete="off"
                    component={KRenderDebounceTextField}
                    validate={ValidatorRequired}
                    placeholder="Please type the registry username"
                  />
                </Grid>
                <Grid item md={12}>
                  <Field
                    type="password"
                    name="password"
                    label="Password"
                    autoComplete="off"
                    component={KRenderDebounceTextField}
                    validate={ValidatorRequired}
                    placeholder="Please type the registry password"
                  />
                </Grid>
                <Grid item md={12}>
                  <Field
                    name="host"
                    label="Host"
                    component={KRenderDebounceTextField}
                    validate={validateHost}
                    placeholder="Please type the registry host"
                    helperText={<span>Leave blank for private docker hub registry</span>}
                  />
                </Grid>
              </Grid>

              {process.env.REACT_APP_DEBUG === "true" ? (
                <pre style={{ maxWidth: 1500, background: "#eee" }}>
                  {JSON.stringify(this.props.fieldValues, undefined, 2)}
                </pre>
              ) : null}
            </Box>
          }
        />
        <Box pt={2}>
          <CustomizedButton disabled={isSubmittingRegistry} onClick={handleSubmit} color="primary" variant="contained">
            Save
          </CustomizedButton>
        </Box>
      </form>
    );
  }
}

export const RegistryForm = reduxForm<RegistryType, Props>({
  form: REGISTRY_FORM_ID,
  enableReinitialize: true,
  keepDirtyOnReinitialize: false,
  initialValues: newEmptyRegistry(),
  onSubmitFail: (...args) => {
    console.log("submit failed", args);
  },
})(connect(mapStateToProps)(withStyles(styles)(RegistryFormRaw)));
