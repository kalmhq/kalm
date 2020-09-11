import { Field, Form, FormikProps, withFormik } from "formik";
import React from "react";
import { Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { RoleBinding } from "types/member";
import { KPanel } from "widgets/KPanel";
import Box from "@material-ui/core/Box";
import { Prompt } from "widgets/Prompt";
import { default as sc } from "utils/stringConstants";
import { FieldProps } from "formik/dist/Field";
import TextField from "@material-ui/core/TextField";
import MenuItem from "@material-ui/core/MenuItem";
import { ValidatorRequired } from "forms/validator";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface OwnProps {
  initial: RoleBinding;
  onSubmit: (roleBinding: RoleBinding) => any;
}

interface Props
  extends FormikProps<RoleBinding>,
    WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    TDispatchProp,
    OwnProps {}

interface State {}

class MemberFormRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public render() {
    const { dirty, isSubmitting } = this.props;

    return (
      <Form>
        <Prompt when={dirty && !isSubmitting} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
        <Box mb={2}>
          <KPanel
            title="Member"
            content={
              <Box p={2}>
                <Field name="subject" validate={ValidatorRequired}>
                  {({ field, form: { touched, errors }, meta }: FieldProps<any>) => (
                    <Box mb={2}>
                      <TextField
                        fullWidth
                        error={!!meta.touched && !!meta.error}
                        label="Subject"
                        variant="outlined"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        placeholder="e.g. user@example.com, <github-group>:<abc>"
                        helperText={
                          meta.touched && meta.error
                            ? meta.error
                            : "The owner can be the email of a specific user or the name of a group"
                        }
                        {...field}
                      />
                    </Box>
                  )}
                </Field>

                <Field name="role" as="select" validate={ValidatorRequired}>
                  {({ field, form: { touched, errors }, meta }: FieldProps<any>) => (
                    <Box mb={2}>
                      <TextField
                        fullWidth
                        select
                        error={!!meta.touched && !!meta.error}
                        label="Role"
                        variant="outlined"
                        size="small"
                        helperText={meta.touched && meta.error}
                        InputLabelProps={{ shrink: true }}
                        SelectProps={{ displayEmpty: true }}
                        {...field}
                      >
                        <MenuItem value="" disabled>
                          Select a role
                        </MenuItem>
                        <MenuItem value="viewer">Viewer</MenuItem>
                        <MenuItem value="editor">Editor</MenuItem>
                        <MenuItem value="owner">Owner</MenuItem>
                      </TextField>
                    </Box>
                  )}
                </Field>
              </Box>
            }
          />
          <Box mt={2}>
            <Button color="primary" variant="contained" type="submit">
              Add Member
            </Button>
          </Box>
        </Box>
      </Form>
    );
  }
}

const ConnectedForm = connect(mapStateToProps)(withStyles(styles)(MemberFormRaw));

export const MemberForm = withFormik<OwnProps, RoleBinding>({
  mapPropsToValues: (props) => {
    return props.initial;
  },
  handleSubmit: async (formValues, { props: { onSubmit } }) => {
    await onSubmit(formValues);
  },
})(ConnectedForm);
