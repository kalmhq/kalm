import { Box } from "@material-ui/core";
import { AutoCompleteMultipleValue } from "forms/Final/autoComplete";
import { FinalRadioGroupRender } from "forms/Final/radio";
import { FinalTextField } from "forms/Final/textfield";
import { FormDataPreview } from "forms/Final/util";
import { ValidatorRequired } from "forms/validator";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import React from "react";
import { Field, FieldRenderProps, Form, FormRenderProps, FormSpy, FormSpyRenderProps } from "react-final-form";
import { OnChange } from "react-final-form-listeners";
import { useSelector } from "react-redux";
import { RootState } from "reducers";
import { Application, ApplicationComponentDetails } from "types/application";
import {
  DeployAccessToken,
  DeployAccessTokenScopeCluster,
  DeployAccessTokenScopeComponent,
  DeployAccessTokenScopeNamespace,
} from "types/deployAccessToken";
import { SubmitButton } from "widgets/Button";
import { KPanel } from "widgets/KPanel";
import { Loading } from "widgets/Loading";
import { Prompt } from "widgets/Prompt";

// const useStyles = makeStyles((theme: Theme) =>
//   createStyles({
//     root: {},
//   }),
// );

interface OwnProps {
  isEdit?: boolean;
  onSubmit: any;
  _initialValues: DeployAccessToken;
}

interface Props extends OwnProps, WithNamespaceProps {}

const DeployAccessTokenFormRaw: React.FC<Props> = (props) => {
  const { _initialValues, isNamespaceLoading, isNamespaceFirstLoaded, applications, onSubmit } = props;

  const { allComponents } = useSelector((state: RootState) => {
    return {
      allComponents: state.components.components,
    };
  });

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
  scopeOptions.push({
    value: DeployAccessTokenScopeCluster,
    label: "Cluster - Can update all components on this cluster",
  });
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
      render={({ handleSubmit, values }: FormRenderProps) => (
        <form onSubmit={handleSubmit} id="webhook-form">
          <Prompt />
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
                      return <AutoCompleteMultipleValue {...props} options={applicationOptions} />;
                    }}
                    // parse={(options: AutoCompleteOption[]) => options.map((option) => option.value)}
                    name="resources"
                    label="Applications"
                    key="applications"
                    validate={ValidatorRequired}
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
                    validate={ValidatorRequired}
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
            <SubmitButton id="save-webhook-button">Create webhook</SubmitButton>
          </Box>

          <FormDataPreview />
        </form>
      )}
    />
  );
};

export const DeployAccessTokenForm = withNamespace(DeployAccessTokenFormRaw);
