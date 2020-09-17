import { Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import Box from "@material-ui/core/Box";
import { FastField, Field, Form, FormikProps, withFormik } from "formik";
import { RenderFormikSelectField } from "forms/Basic/select";
import { KRenderThrottleFormikTextField } from "forms/Basic/textfield";
import { ValidatorRequired } from "forms/validator";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { RoleBinding } from "types/member";
import { default as sc } from "utils/stringConstants";
import { KPanel } from "widgets/KPanel";
import { Prompt } from "widgets/Prompt";

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
  isClusterLevel?: boolean;
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
    const { dirty, isSubmitting, isClusterLevel } = this.props;

    const rolesOptions = isClusterLevel
      ? [
          { text: "Cluster Viewer", value: "clusterViewer" },
          { text: "Cluster Editor", value: "clusterEditor" },
          { text: "Cluster Owner", value: "clusterOwner" },
        ]
      : [
          { text: "Viewer", value: "viewer" },
          { text: "Editor", value: "editor" },
          { text: "Owner", value: "owner" },
        ];

    return (
      <Form>
        <Prompt when={dirty && !isSubmitting} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
        <Box mb={2}>
          <KPanel
            title="Member"
            content={
              <Box p={2}>
                <Box mb={2}>
                  <FastField
                    autoFocus
                    component={KRenderThrottleFormikTextField}
                    name="subject"
                    label="Subject"
                    validate={ValidatorRequired}
                    placeholder="e.g. user@example.com, <github-group>:<abc>"
                    helperText={"The owner can be the email of a specific user or the name of a group"}
                  />
                </Box>

                <Field
                  name="role"
                  component={RenderFormikSelectField}
                  label="Role"
                  placeholder="Select a role"
                  validate={ValidatorRequired}
                  options={rolesOptions}
                />
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
