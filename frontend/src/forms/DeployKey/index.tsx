import { Box, Button, createStyles, WithStyles, withStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { change, InjectedFormProps, untouch } from "redux-form";
import { Field, getFormValues, reduxForm } from "redux-form/immutable";
import { RootState } from "reducers";
import { ValidatorRequired } from "../validator";
import { Prompt } from "widgets/Prompt";
import { DEPLOY_KEY_ID } from "../formIDs";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import {
  DeployKey,
  DeployKeyScopeCluster,
  DeployKeyScopeComponent,
  DeployKeyScopeNamespace,
  newEmptyDeployKey,
} from "types/deployKey";
import { KPanel } from "widgets/KPanel";
import { KAutoCompleteMultipleSelectField, KAutoCompleteOption } from "forms/Basic/autoComplete";
import { KRenderDebounceTextField } from "forms/Basic/textfield";
import { KRadioGroupRender } from "forms/Basic/radio";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  const fieldValues = (getFormValues(DEPLOY_KEY_ID)(state) as DeployKey) || (Immutable.Map() as DeployKey);

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
    InjectedFormProps<DeployKey, Props>,
    ReturnType<typeof mapStateToProps>,
    WithStyles<typeof styles> {}

class DeployKeyFormRaw extends React.PureComponent<FinalProps> {
  public componentDidUpdate(prevProps: FinalProps) {
    if (prevProps.fieldValues.get("scope") !== this.props.fieldValues.get("scope")) {
      this.props.dispatch(change(this.props.form, "resources", Immutable.List()));
      this.props.dispatch(untouch(this.props.form, "resources"));
    }
  }

  public render() {
    const { handleSubmit, classes, dirty, submitSucceeded, fieldValues, applications, allComponents } = this.props;

    const applicationOptions = applications
      .map(
        (a): KAutoCompleteOption => ({
          label: a.get("name"),
          value: a.get("name"),
          group: "",
        }),
      )
      .toArray();

    let componentOptions: KAutoCompleteOption[] = [];

    applications.forEach((application) => {
      const components = allComponents.get(application.get("name"))!;
      components.forEach((component) => {
        componentOptions.push({
          label: `${application.get("name")}/${component.get("name")}`,
          value: `${application.get("name")}/${component.get("name")}`,
          group: application.get("name"),
        });
      });
    });

    return (
      <form onSubmit={handleSubmit} className={classes.root}>
        <Prompt when={dirty && !submitSucceeded} message="Are you sure to leave without saving changes?" />
        <KPanel>
          <Box p={2}>
            <Field
              name="name"
              label="Name"
              autoFocus
              autoComplete="off"
              component={KRenderDebounceTextField}
              validate={ValidatorRequired}
            />

            <Field
              title="Permission Scope"
              component={KRadioGroupRender}
              name="scope"
              options={[
                {
                  value: DeployKeyScopeCluster,
                  label: "Cluster - Can update all components on this cluster",
                },
                {
                  value: DeployKeyScopeNamespace,
                  label: "Specific Applications - Can update all components in selected applications",
                },

                {
                  value: DeployKeyScopeComponent,
                  label: "Specific Components - Can only update selected components",
                },
              ]}
            />

            <Box mt={2}>
              {fieldValues.get("scope") === DeployKeyScopeNamespace ? (
                <KAutoCompleteMultipleSelectField
                  name="resources"
                  label="Applications"
                  validate={ValidatorRequired}
                  placeholder="Select an application"
                  options={applicationOptions}
                />
              ) : null}

              {fieldValues.get("scope") === DeployKeyScopeComponent ? (
                <KAutoCompleteMultipleSelectField
                  name="resources"
                  label="Component"
                  validate={ValidatorRequired}
                  placeholder="Select an component"
                  options={componentOptions}
                />
              ) : null}
            </Box>
          </Box>
        </KPanel>

        <Box mt={2}>
          <Button color="primary" variant="contained" type="submit">
            Create Deploy Key
          </Button>
        </Box>

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

export const DeployKeyForm = reduxForm<DeployKey, Props>({
  form: DEPLOY_KEY_ID,
  initialValues: newEmptyDeployKey(),
  onSubmitFail: (...args) => {
    console.log("submit failed", args);
  },
})(connect(mapStateToProps)(withNamespace(withStyles(styles)(DeployKeyFormRaw))));
