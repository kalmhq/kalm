import { Box, Button, createStyles, WithStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles";
import { Field, FieldRenderProps, Form, FormRenderProps, FormSpy } from "react-final-form";
import { ValidatorRequired } from "forms/validator";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import React from "react";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { Application, ApplicationComponentDetails } from "types/application";
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

    const scopeOptinons: { value: string; label: string }[] = [];
    if (canEditCluster()) {
      scopeOptinons.push({
        value: DeployAccessTokenScopeCluster,
        label: "Cluster - Can update all components on this cluster",
      });
    }
    scopeOptinons.push({
      value: DeployAccessTokenScopeNamespace,
      label: "Specific Applications - Can update all components in selected applications",
    });
    scopeOptinons.push({
      value: DeployAccessTokenScopeComponent,
      label: "Specific Components - Can only update selected components",
    });

    return (
      <Form
        debug={process.env.REACT_APP_DEBUG === "true" ? console.log : undefined}
        initialValues={_initialValues}
        onSubmit={onSubmit}
        keepDirtyOnReinitialize={true}
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
                  id="deployKey-name"
                  validate={ValidatorRequired}
                />

                {/*<KFormikRadioGroupRender*/}
                {/*  title="Permission Scope"*/}
                {/*  name="scope"*/}
                {/*  value={values.scope}*/}
                {/*  onChange={(event: any, value: string) => {*/}
                {/*    setFieldValue("scope", value);*/}
                {/*    setFieldValue("resources", []);*/}
                {/*  }}*/}
                {/*  options={scopeOptinons}*/}
                {/*/>*/}

                <Box mt={2}>
                  {values.scope === DeployAccessTokenScopeNamespace ? (
                    <Field
                      render={(props: FieldRenderProps<string[]>) => (
                        <AutoCompleteMultipleValue {...props} options={applicationOptions} />
                      )}
                      // parse={(options: AutoCompleteOption[]) => options.map((option) => option.value)}
                      name="resources"
                      label="Applications"
                      id="certificate-resources"
                      placeholder={"Select an application"}
                      helperText={""}
                    />
                  ) : null}

                  {values.scope === DeployAccessTokenScopeComponent ? (
                    <Field
                      render={(props: FieldRenderProps<string[]>) => (
                        <AutoCompleteMultipleValue {...props} options={componentOptions} />
                      )}
                      name="resources"
                      label="Component"
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
              <FormSpy subscription={{ values: true }}>
                {({ values }: { values: DeployAccessToken }) => {
                  return (
                    <Box mt={2}>
                      <pre style={{ maxWidth: 1500, background: "#eee" }}>{JSON.stringify(values, undefined, 2)}</pre>
                    </Box>
                  );
                }}
              </FormSpy>
            ) : null}
          </form>
        )}
      />
    );
  }
}

export const DeployAccessTokenForm = connect(mapStateToProps)(
  withUserAuth(withNamespace(withStyles(styles)(DeployAccessTokenFormRaw))),
);
