import { Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import Box from "@material-ui/core/Box";
import { FastField, Field, Form, FormikProps, withFormik } from "formik";
import { RenderFormikSelectField } from "forms/Basic/select";
import { KRenderDebounceFormikTextField } from "forms/Basic/textfield";
import { ValidatorRequired } from "forms/validator";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { RoleBinding, SubjectTypeGroup, SubjectTypeUser } from "types/member";
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
    const { dirty, isSubmitting, isClusterLevel, values } = this.props;

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
            title="Grant role permissions to a user or a group"
            content={
              <Box p={2}>
                <Box mb={2}>
                  <FastField
                    name="subjectType"
                    autoFocus
                    component={RenderFormikSelectField}
                    required
                    label="Subject Type"
                    validate={ValidatorRequired}
                    helperText="Please select the subject type you want to grant permissions to"
                    options={[
                      { value: SubjectTypeUser, text: "User" },
                      { value: SubjectTypeGroup, text: "Group" },
                    ]}
                  />
                </Box>

                <Box mb={2}>
                  <Field
                    component={KRenderDebounceFormikTextField}
                    name="subject"
                    label="Subject"
                    validate={ValidatorRequired}
                    placeholder={
                      values.subjectType === SubjectTypeUser
                        ? "e.g. user@example.com"
                        : "e.g. <github-org-name>:<team-name> or <gitlab-group-name>"
                    }
                    helperText={
                      values.subjectType === SubjectTypeUser
                        ? "Please type the user email"
                        : "Please type the group name"
                    }
                  />
                </Box>

                <FastField
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
              {values.subjectType === SubjectTypeUser ? "Grant permissions to User" : "Grant permissions to Group"}
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
