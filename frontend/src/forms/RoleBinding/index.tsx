import { MenuItem, Grid } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { ReduxFormMutipleSelectField, ReduxFormSelectField } from "forms/Basic/select";
import { TextField } from "forms/Basic/text";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { InjectedFormProps } from "redux-form";
import { Field, reduxForm, formValueSelector } from "redux-form/immutable";
import { TDispatchProp } from "types";
import { RoleBindingsRequestBody } from "types/user";
import { ValidatorRequired } from "../validator";
// import { loadNamespacesAction } from "actions/namespaces";

const defaultFormID = "rolebinding";

const mapStateToProps = (state: RootState, { form }: OwnProps) => {
  const selector = formValueSelector(form || defaultFormID);
  return {
    namespaces: state
      .get("applications")
      .get("applications")
      .map(application => application.get("name")),
    kind: selector(state, "kind"),
    name: selector(state, "name")
  };
};

interface OwnProps {
  form?: string;
}

const styles = (theme: Theme) =>
  createStyles({
    root: {}
  });

export interface Props
  extends InjectedFormProps<RoleBindingsRequestBody, OwnProps>,
    WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    TDispatchProp {}

class RoleBindingFormRaw extends React.PureComponent<Props> {
  public componentDidMount() {
    // this.props.dispatch(loadNamespacesAction());
  }

  public render() {
    const { namespaces, kind } = this.props;
    return (
      <Grid container spacing={2}>
        <Grid item md={6}>
          <Field
            name="namespace"
            label="Namespace"
            autoFocus
            component={ReduxFormSelectField}
            validate={ValidatorRequired}>
            {namespaces.map(namespace => {
              return (
                <MenuItem key={namespace} value={namespace}>
                  {namespace}
                </MenuItem>
              );
            })}
          </Field>
        </Grid>
        <Grid item md={6}>
          <Field name={`kind`} component={ReduxFormSelectField} label="Kind">
            <MenuItem value="Group">Group</MenuItem>
            <MenuItem value="User">User</MenuItem>
            <MenuItem value="ServiceAccount">ServiceAccount</MenuItem>
          </Field>
        </Grid>
        <Grid item md={12}>
          <Field
            name="name"
            label={kind + " name"}
            component={TextField}
            validate={ValidatorRequired}
            placeholder={"Name of the " + kind}
          />
        </Grid>
        <Grid item md={12}>
          <Field
            name="roles"
            component={ReduxFormMutipleSelectField}
            label="Roles"
            validate={ValidatorRequired}
            options={[
              {
                text: "Reader",
                value: "reader",
                tooltipTitle: "Can list applications, get configs, view logs."
              },
              {
                text: "Writer",
                value: "writer",
                tooltipTitle:
                  "Reader permissions plus modify, delete applications and permissions to use the web terminal."
              }
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
  roles: []
});

export const RoleBindingForm = reduxForm<RoleBindingsRequestBody, OwnProps>({
  onSubmitFail: console.log,
  initialValues,
  form: defaultFormID
})(connect(mapStateToProps)(withStyles(styles)(RoleBindingFormRaw)));
