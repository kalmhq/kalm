import { Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import Box from "@material-ui/core/Box";
import { ValidatorRequired } from "forms/validator";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { RoleBinding, SubjectTypeGroup, SubjectTypeUser } from "types/member";
import { default as sc } from "utils/stringConstants";
import { KPanel } from "widgets/KPanel";
import { Prompt } from "widgets/Prompt";
import { Field, Form, FormRenderProps } from "react-final-form";
import { FinalSelectField } from "forms/Final/select";
import { FinalTextField } from "forms/Final/textfield";

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

const clusterRolesOptions = [
  { text: "Cluster Viewer", value: "clusterViewer" },
  { text: "Cluster Editor", value: "clusterEditor" },
  { text: "Cluster Owner", value: "clusterOwner" },
];

const applicationRolesOptions = [
  { text: "Viewer", value: "viewer" },
  { text: "Editor", value: "editor" },
  { text: "Owner", value: "owner" },
];

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp, OwnProps {}

class MemberFormRaw extends React.PureComponent<Props> {
  public render() {
    const { isClusterLevel, initial, onSubmit } = this.props;
    const rolesOptions = isClusterLevel ? clusterRolesOptions : applicationRolesOptions;
    return (
      <Form
        initialValues={initial}
        onSubmit={onSubmit}
        render={({ handleSubmit, submitting, dirty, values }: FormRenderProps<RoleBinding>) => (
          <form onSubmit={handleSubmit}>
            <Prompt when={dirty && !submitting} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
            <Box mb={2}>
              <KPanel
                title="Grant role permissions to a user or a group"
                content={
                  <Box p={2}>
                    <Box mb={2}>
                      <Field
                        name="subjectType"
                        autoFocus
                        component={FinalSelectField}
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
                        component={FinalTextField}
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

                    <Field
                      name="role"
                      component={FinalSelectField}
                      label="Role"
                      placeholder="Select a role"
                      validate={ValidatorRequired}
                      options={rolesOptions}
                    />
                  </Box>
                }
              />

              {process.env.REACT_APP_DEBUG === "true" ? (
                <pre style={{ maxWidth: 1500, background: "#eee" }}>{JSON.stringify(values, undefined, 2)}</pre>
              ) : null}

              <Box mt={2}>
                <Button color="primary" variant="contained" type="submit">
                  {values.subjectType === SubjectTypeUser ? "Grant permissions to User" : "Grant permissions to Group"}
                </Button>
              </Box>
            </Box>
          </form>
        )}
      />
    );
  }
}

export const MemberForm = connect(mapStateToProps)(withStyles(styles)(MemberFormRaw));
