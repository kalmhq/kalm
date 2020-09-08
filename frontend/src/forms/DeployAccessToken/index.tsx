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
import { KAutoCompleteMultipleSelectField, KAutoCompleteOption } from "forms/Basic/autoComplete";
import { KRenderDebounceTextField } from "forms/Basic/textfield";
import { KRadioGroupRender } from "forms/Basic/radio";
import { ApplicationComponentDetails } from "types/application";
import { Loading } from "widgets/Loading";
import sc from "utils/stringConstants";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  const fieldValues =
    (getFormValues(DEPLOY_ACCESS_TOKEN_ID)(state) as DeployAccessToken) || (Immutable.Map() as DeployAccessToken);

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

  public render() {
    const {
      handleSubmit,
      classes,
      dirty,
      submitSucceeded,
      fieldValues,
      isNamespaceLoading,
      isNamespaceFirstLoaded,
      applications,
      allComponents,
    } = this.props;

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

    return (
      <form onSubmit={handleSubmit} className={classes.root}>
        <Prompt when={dirty && !submitSucceeded} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
        <KPanel>
          <Box p={2}>
            <Field
              name="memo"
              label="Memo"
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
                  validate={ValidatorRequired}
                  placeholder="Select an application"
                  options={applicationOptions}
                />
              ) : null}

              {fieldValues.get("scope") === DeployAccessTokenScopeComponent ? (
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

export const DeployAccessTokenForm = reduxForm<DeployAccessToken, Props>({
  form: DEPLOY_ACCESS_TOKEN_ID,
  initialValues: newEmptyDeployAccessToken(),
  onSubmitFail: (...args) => {
    console.log("submit failed", args);
  },
})(connect(mapStateToProps)(withNamespace(withStyles(styles)(DeployAccessTokenFormRaw))));
