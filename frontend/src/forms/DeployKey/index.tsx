import { Box, Button, createStyles, WithStyles, withStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles";
import { Field, Form, FormikProps, withFormik } from "formik";
import { KAutoCompleteOption, KFormikAutoCompleteMultipleSelectField } from "forms/Basic/autoComplete";
import { KFormikRadioGroupRender } from "forms/Basic/radio";
import { KRenderDebounceFormikTextField } from "forms/Basic/textfield";
import { RequireString, ValidatorRequired } from "forms/validator";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { Application, ApplicationComponentDetails } from "types/application";
import {
  DeployKeyFormTypeContent,
  DeployKeyScopeCluster,
  DeployKeyScopeComponent,
  DeployKeyScopeNamespace,
  newEmptyDeployKeyForm,
} from "types/deployKey";
import sc from "utils/stringConstants";
import { KPanel } from "widgets/KPanel";
import { Loading } from "widgets/Loading";
import { Prompt } from "widgets/Prompt";
import { object } from "yup";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {
    allComponents: state.get("components").components,
  };
};

interface OwnProps {
  isEdit?: boolean;
  onSubmit: any;
}

export interface ConnectedProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export interface Props
  extends ConnectedProps,
    OwnProps,
    WithNamespaceProps,
    FormikProps<DeployKeyFormTypeContent>,
    WithStyles<typeof styles> {}

const schema = object().shape({
  name: RequireString,
});

class DeployKeyFormikRaw extends React.PureComponent<Props> {
  public render() {
    const { classes, isNamespaceLoading, isNamespaceFirstLoaded, applications, allComponents } = this.props;

    if (isNamespaceLoading && !isNamespaceFirstLoaded) {
      return (
        <Box p={2}>
          <Loading />
        </Box>
      );
    }

    const applicationOptions = applications.map(
      (a: Application): KAutoCompleteOption => ({
        label: a.name,
        value: a.name,
        group: "",
      }),
    );

    let componentOptions: KAutoCompleteOption[] = [];

    applications.forEach((application: Application) => {
      const components = allComponents[application.name] || ([] as ApplicationComponentDetails[]);

      components.forEach((component) => {
        componentOptions.push({
          label: `${application.name}/${component.name}`,
          value: `${application.name}/${component.name}`,
          group: application.name,
        });
      });
    });

    const { values, dirty, setFieldValue, isSubmitting } = this.props;
    return (
      <Form className={classes.root} id="deployKey-form">
        <Prompt when={dirty && !isSubmitting} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
        <KPanel>
          <Box p={2}>
            <Field
              name="name"
              label="Name"
              autoFocus
              autoComplete="off"
              component={KRenderDebounceFormikTextField}
              id="deployKey-name"
              validate={ValidatorRequired}
            />

            <KFormikRadioGroupRender
              title="Permission Scope"
              name="scope"
              value={values.scope}
              onChange={(event: any, value: string) => {
                setFieldValue("scope", value);
                setFieldValue("resources", []);
              }}
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
              {values.scope === DeployKeyScopeNamespace ? (
                <Field
                  component={KFormikAutoCompleteMultipleSelectField}
                  name="resources"
                  label="Applications"
                  options={applicationOptions}
                  id="certificate-resources"
                  placeholder={"Select an application"}
                  helperText={""}
                />
              ) : null}

              {values.scope === DeployKeyScopeComponent ? (
                <Field
                  component={KFormikAutoCompleteMultipleSelectField}
                  name="resources"
                  label="Component"
                  options={componentOptions}
                  id="certificate-resources"
                  placeholder={"Select a component"}
                  helperText={""}
                />
              ) : null}
            </Box>
          </Box>
        </KPanel>

        <Box mt={2}>
          <Button id="save-deployKey-button" color="primary" variant="contained" type="submit">
            Create Deploy Key
          </Button>
        </Box>
        {process.env.REACT_APP_DEBUG === "true" ? (
          <Box mt={2}>
            <pre style={{ maxWidth: 1500, background: "#eee" }}>{JSON.stringify(values, undefined, 2)}</pre>
          </Box>
        ) : null}
      </Form>
    );
  }
}

const DeployKeyForm = withNamespace(connect(mapStateToProps)(withStyles(styles)(DeployKeyFormikRaw)));
export const DeployKeyFormik = withFormik<OwnProps, DeployKeyFormTypeContent>({
  mapPropsToValues: () => newEmptyDeployKeyForm,
  validationSchema: schema,
  handleSubmit: (values, bag) => {
    bag.props.onSubmit(values);
  },
  // @ts-ignore
})(DeployKeyForm);
