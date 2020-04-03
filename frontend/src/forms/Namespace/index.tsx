import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { TextField } from "forms/Basic/text";
import React from "react";
import { connect } from "react-redux";
import { InjectedFormProps } from "redux-form";
import { Field, reduxForm } from "redux-form/immutable";
import { ValidatorRequired } from "../validator";
import { Namespace } from "types/namespace";
import InputAdornment from "@material-ui/core/InputAdornment";

interface OwnProps {}

const styles = (theme: Theme) =>
  createStyles({
    root: {}
  });

export interface Props extends InjectedFormProps<Namespace, OwnProps>, WithStyles<typeof styles>, OwnProps {}

class NamespaceFormRaw extends React.PureComponent<Props> {
  public render() {
    return (
      <div>
        <Field
          name="name"
          label="Name"
          autoFocus
          InputProps={{
            startAdornment: <InputAdornment position="start">kapp -</InputAdornment>
          }}
          component={TextField}
          validate={ValidatorRequired}
          placeholder="Please type the namespace name"
        />
      </div>
    );
  }
}

export const NamespaceForm = reduxForm<Namespace, OwnProps>({
  onSubmitFail: console.log
})(connect()(withStyles(styles)(NamespaceFormRaw)));
