import { Box, Button, createStyles, WithStyles, withStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { RootState } from "reducers";
import { ValidatorRequired, RequireString } from "forms/validator";
import { Prompt } from "widgets/Prompt";
import { DEPLOY_ACCESS_TOKEN_ID } from "../formIDs";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import {
  DeployAccessToken,
  DeployAccessTokenScopeCluster,
  DeployAccessTokenScopeComponent,
  DeployAccessTokenScopeNamespace,
  newEmptyDeployAccessToken,
} from "types/deployAccessToken";
import { KPanel } from "widgets/KPanel";
import { KAutoCompleteOption, KFormikAutoCompleteMultipleSelectField } from "forms/Basic/autoComplete";
import { KRenderDebounceFormikTextField } from "forms/Basic/textfield";
import { KFormikRadioGroupRender } from "forms/Basic/radio";
import { ApplicationComponentDetails } from "types/application";
import { Loading } from "widgets/Loading";
import sc from "utils/stringConstants";
import { Field, Form, FormikProps, withFormik } from "formik";
import { object } from "yup";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  const fieldValues =
    (getFormValues(DEPLOY_ACCESS_TOKEN_ID)(state) as DeployAccessToken) || (Immutable.Map() as DeployAccessToken);

  return {
    allComponents: state.get("components").get("components"),
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
    InjectedFormProps<DeployAccessToken, Props>,
    ReturnType<typeof mapStateToProps>,
    WithStyles<typeof styles> {}

class DeployAccessTokenFormRaw extends React.PureComponent<FinalProps> {
  public componentDidUpdate(prevProps: FinalProps) {
    if (prevProps.fieldValues.get("scope") !== this.props.fieldValues.get("scope")) {
      this.props.dispatch(change(this.props.form, "resources", Immutable.List()));
      this.props.dispatch(untouch(this.props.form, "resources"));
    }
  }

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
      const components = (allComponents.get(application.get("name")) || Immutable.List()) as Immutable.List<
        ApplicationComponentDetails
      >;

      components.forEach((component) => {
        componentOptions.push({
          label: `${application.get("name")}/${component.get("name")}`,
          value: `${application.get("name")}/${component.get("name")}`,
          group: application.get("name"),
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
              name="memo"
              label="Memo"
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
                  value: DeployAccessTokenScopeCluster,
                  label: "Cluster - Can update all components on this cluster",
                },
                {
                  value: DeployAccessTokenScopeNamespace,
                  label: "Specific Applications - Can update all components in selected applications",
                },

                {
                  value: DeployAccessTokenScopeComponent,
                  label: "Specific Components - Can only update selected components",
                },
              ]}
            />

            <Box mt={2}>
              {fieldValues.get("scope") === DeployAccessTokenScopeNamespace ? (
                <KAutoCompleteMultipleSelectField
                  name="resources"
                  label="Applications"
                  options={applicationOptions}
                  id="certificate-resources"
                  placeholder={"Select an application"}
                  helperText={""}
                />
              ) : null}

              {fieldValues.get("scope") === DeployAccessTokenScopeComponent ? (
                <KAutoCompleteMultipleSelectField
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

export const DeployAccessTokenForm = reduxForm<DeployAccessToken, Props>({
  form: DEPLOY_ACCESS_TOKEN_ID,
  initialValues: newEmptyDeployAccessToken(),
  onSubmitFail: (...args) => {
    console.log("submit failed", args);
  },
})(connect(mapStateToProps)(withNamespace(withStyles(styles)(DeployAccessTokenFormRaw))));
