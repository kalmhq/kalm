import { Box, Button, createStyles, WithStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles";
import { Field, FieldRenderProps, Form, FormRenderProps, FormSpy, FormSpyRenderProps } from "react-final-form";
import { ValidatorRequired } from "forms/validator";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import React from "react";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { Application, ApplicationComponentDetails } from "types/application";
import { OnChange } from "react-final-form-listeners";
import {
  DeployAccessToken,
  DeployAccessTokenScopeCluster,
  DeployAccessTokenScopeComponent,
  DeployAccessTokenScopeNamespace,
} from "types/deployAccessToken";
import sc from "utils/stringConstants";
import { KPanel } from "widgets/KPanel";
import { Loading } from "widgets/Loading";
import { Prompt } from "widgets/Prompt";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
import { FinalTextField } from "forms/Final/textfield";
import { AutoCompleteMultipleValue } from "forms/Final/autoComplete";
import { connect } from "react-redux";
import withStyles from "@material-ui/core/styles/withStyles";
import { FinalRadioGroupRender } from "forms/Final/radio";
import { FormDataPreview } from "forms/Final/util";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {
    allComponents: state.components.components,
  };
};

interface OwnProps {
  isEdit?: boolean;
  onSubmit: any;
  _initialValues: DeployAccessToken;
}

export interface ConnectedProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export interface Props
  extends ConnectedProps,
    OwnProps,
    WithNamespaceProps,
    WithUserAuthProps,
    WithStyles<typeof styles> {}

class DeployAccessTokenFormRaw extends React.PureComponent<Props> {
  public render() {
    const {
      _initialValues,
      isNamespaceLoading,
      isNamespaceFirstLoaded,
      applications,
      allComponents,
      canEditCluster,
      onSubmit,
    } = this.props;

    if (isNamespaceLoading && !isNamespaceFirstLoaded) {
      return (
        <Box p={2}>
          <Loading />
        </Box>
      );
    }

    const applicationOptions = applications.map((x) => x.name);

    let componentOptions: string[] = [];
    applications.forEach((application: Application) => {
      const components = allComponents[application.name] || ([] as ApplicationComponentDetails[]);

      components.forEach((component) => {
        componentOptions.push(`${application.name}/${component.name}`);
      });
    });

    const scopeOptions: { value: string; label: string; explain?: string }[] = [];
    if (canEditCluster()) {
      scopeOptions.push({
        value: DeployAccessTokenScopeCluster,
        label: "Cluster - Can update all components on this cluster",
      });
    }
    scopeOptions.push({
      value: DeployAccessTokenScopeNamespace,
      label: "Specific Applications - Can update all components in selected applications",
    });
    scopeOptions.push({
      value: DeployAccessTokenScopeComponent,
      label: "Specific Components - Can only update selected components",
    });

    return (
      <Form
        debug={process.env.REACT_APP_DEBUG === "true" ? console.log : undefined}
        initialValues={_initialValues}
        onSubmit={onSubmit}
        keepDirtyOnReinitialize
        render={({ handleSubmit, submitting, pristine, dirty, values }: FormRenderProps) => (
          <form onSubmit={handleSubmit} id="deployKey-form">
            <Prompt when={dirty && !submitting} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
            <KPanel>
              <Box p={2}>
                <Field
                  name="memo"
                  label="Memo"
                  autoFocus
                  autoComplete="off"
                  component={FinalTextField}
                  validate={ValidatorRequired}
                />

                <Field
                  title="Permission Scope"
                  name="scope"
                  render={(props: FieldRenderProps<string>) => (
                    <FinalRadioGroupRender {...props} options={scopeOptions} />
                  )}
                />

                <Box mt={2}>
                  {values.scope === DeployAccessTokenScopeNamespace ? (
                    <Field
                      render={(props: FieldRenderProps<string[]>) => {
                        console.log(values);
                        return <AutoCompleteMultipleValue {...props} options={applicationOptions} />;
                      }}
                      // parse={(options: AutoCompleteOption[]) => options.map((option) => option.value)}
                      name="resources"
                      label="Applications"
                      key="applications"
                      placeholder={"Select an application"}
                      validate={ValidatorRequired}
                      helperText={""}
                    />
                  ) : null}

                  {values.scope === DeployAccessTokenScopeComponent ? (
                    <Field
                      render={(props: FieldRenderProps<string[]>) => (
                        <AutoCompleteMultipleValue {...props} options={componentOptions} />
                      )}
                      name="resources"
                      key="Components"
                      label="Components"
                      placeholder={"Select a component"}
                      validate={ValidatorRequired}
                      helperText={""}
                    />
                  ) : null}
                </Box>
              </Box>
            </KPanel>

            <FormSpy>
              {({ form: { change } }: FormSpyRenderProps<DeployAccessToken>) => (
                <OnChange name="scope">
                  {(value: string, previous: string) => {
                    if (value !== previous) {
                      // has to use set timeout
                      // https://github.com/final-form/react-final-form-listeners/issues/25
                      setTimeout(() => change("resources", []), 30);
                    }
                  }}
                </OnChange>
              )}
            </FormSpy>

            <Box mt={2}>
              <Button id="save-deployKey-button" color="primary" variant="contained" type="submit">
                Create Deploy Key
              </Button>
            </Box>

            <FormDataPreview />
          </form>
        )}
      />
    );
  }
}

export const DeployAccessTokenForm = connect(mapStateToProps)(
  withUserAuth(withNamespace(withStyles(styles)(DeployAccessTokenFormRaw))),
);
