import { Grid } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { RenderMutipleSelectField, RenderSelectField } from "forms/Basic/select";
import { KRenderDebounceTextField } from "forms/Basic/textfield";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { InjectedFormProps } from "redux-form";
import { Field, formValueSelector, reduxForm } from "redux-form/immutable";
import { TDispatchProp } from "types";
import { RoleBindingsRequestBody } from "types/user";
import { ValidatorRequired } from "../validator";
import { Prompt } from "widgets/Prompt";
import { ROLE_BINDING_FORM_ID } from "forms/formIDs";
import sc from "utils/stringConstants";

const mapStateToProps = (state: RootState, { form }: OwnProps) => {
  const selector = formValueSelector(form || ROLE_BINDING_FORM_ID);
  return {
    namespaces: state
      .get("applications")
      .get("applications")
      .map((application) => application.get("name")),
    kind: selector(state, "kind"),
    name: selector(state, "name"),
  };
};

interface OwnProps {
  form?: string;
}

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

export interface Props
  extends InjectedFormProps<RoleBindingsRequestBody, OwnProps>,
    WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    TDispatchProp {}

class RoleBindingFormRaw extends React.PureComponent<Props> {
  public render() {
    const { namespaces, kind, dirty, submitSucceeded } = this.props;
    return (
      <Grid container spacing={2}>
        <Prompt when={dirty && !submitSucceeded} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
        <Grid item md={6}>
          <Field
            name="namespace"
            label="Namespace"
            autoFocus
            component={RenderSelectField}
            validate={ValidatorRequired}
            options={namespaces.map((namespace) => {
              return {
                value: namespace,
                text: namespace,
              };
            })}
          ></Field>
        </Grid>
        <Grid item md={6}>
          <Field
            name={`kind`}
            component={RenderSelectField}
            label="Kind"
            options={[
              { value: "Group", text: "Group" },
              { value: "User", text: "User" },
              { value: "ServiceAccount", text: "ServiceAccount" },
            ]}
          ></Field>
        </Grid>
        <Grid item md={12}>
          <Field
            name="name"
            label={kind + " name"}
            component={KRenderDebounceTextField}
            validate={ValidatorRequired}
            placeholder={"Name of the " + kind}
          />
        </Grid>
        <Grid item md={12}>
          <Field
            name="roles"
            component={RenderMutipleSelectField}
            label="Roles"
            validate={ValidatorRequired}
            options={[
              {
                text: "Reader",
                value: "reader",
                tooltipTitle: "Can list applications, get configs, view logs.",
              },
              {
                text: "Writer",
                value: "writer",
                tooltipTitle:
                  "Reader permissions plus modify, delete applications and permissions to use the web terminal.",
              },
            ]}
          />
        </Grid>
      </Grid>
    );
  }
}

const initialValues: RoleBindingsRequestBody = Immutable.Map({
  kind: "User",
  name: "",
  namespace: "",
  roles: [],
});

export const RoleBindingForm = reduxForm<RoleBindingsRequestBody, OwnProps>({
  onSubmitFail: console.log,
  initialValues,
  form: ROLE_BINDING_FORM_ID,
})(connect(mapStateToProps)(withStyles(styles)(RoleBindingFormRaw)));
