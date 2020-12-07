import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import { FinalSelectField } from "forms/Final/select";
import { FinalTextField } from "forms/Final/textfield";
import { FormDataPreview } from "forms/Final/util";
import { ValidatorRequired } from "forms/validator";
import React from "react";
import { Field, Form, FormRenderProps } from "react-final-form";
import { RoleBinding, SubjectTypeGroup, SubjectTypeUser } from "types/member";
import { SubmitButton } from "widgets/Button";
import { KPanel } from "widgets/KPanel";
import { Prompt } from "widgets/Prompt";

const clusterRolesOptions = [
  { text: "Cluster Viewer", value: "clusterViewer", desc: "Read-only access in cluster scope" },
  {
    text: "Cluster Editor",
    value: "clusterEditor",
    desc: "All permissions except authorize cluster-level permissions to others",
  },
  { text: "Cluster Owner", value: "clusterOwner", desc: "All permissions" },
];

const applicationRolesOptions = [
  { text: "Viewer", value: "viewer", desc: "Read-only access in this application" },
  {
    text: "Editor",
    value: "editor",
    desc: "All permissions in this application except authorize to others",
  },
  { text: "Owner", value: "owner", desc: "All permissions in this application" },
];

interface OwnProps {
  initial: RoleBinding;
  onSubmit: (roleBinding: RoleBinding) => any;
  isClusterLevel?: boolean;
}

interface Props extends OwnProps {}

const MemberFormRaw: React.FC<Props> = (props) => {
  const { isClusterLevel, initial, onSubmit } = props;
  const rolesOptions = isClusterLevel ? clusterRolesOptions : applicationRolesOptions;
  return (
    <Form
      initialValues={initial}
      keepDirtyOnReinitialize
      onSubmit={onSubmit}
      render={({ handleSubmit, values }: FormRenderProps<RoleBinding>) => (
        <form onSubmit={handleSubmit}>
          <Prompt />
          <KPanel title="Grant role permissions to a user or a group">
            <Box p={2}>
              <Grid container spacing={2}>
                <Grid item sm={6}>
                  <Field
                    name="subjectType"
                    autoFocus
                    component={FinalSelectField}
                    required
                    label="Subject Type"
                    validate={ValidatorRequired}
                    helperText="Please select the subject type you want to grant permissions to"
                    options={[
                      {
                        value: SubjectTypeUser,
                        text: "User",
                        desc: "Grant permission for a single user. You need to provide the user's email address.",
                      },
                      {
                        value: SubjectTypeGroup,
                        text: "Group",
                        desc: "Grant permission for every member in a group. You need to provide the group's name.",
                      },
                    ]}
                  />
                </Grid>
                <Grid item sm={6}>
                  <Field
                    name="role"
                    component={FinalSelectField}
                    label="Role"
                    placeholder="Select a role"
                    validate={ValidatorRequired}
                    options={rolesOptions}
                  />
                </Grid>
              </Grid>

              <Box mt={2}>
                <Field
                  component={FinalTextField}
                  name="subject"
                  label={values.subjectType === SubjectTypeUser ? "User Email" : "Group Name"}
                  validate={ValidatorRequired}
                  placeholder={
                    values.subjectType === SubjectTypeUser
                      ? "e.g. user@example.com"
                      : "e.g. <github-org-name>:<team-name> or <gitlab-group-name>"
                  }
                  helperText={
                    values.subjectType === SubjectTypeUser ? "Please type the user email" : "Please type the group name"
                  }
                />
              </Box>
            </Box>
          </KPanel>

          <FormDataPreview />

          <Box mt={2}>
            <SubmitButton>
              {values.subjectType === SubjectTypeUser ? "Grant permissions to User" : "Grant permissions to Group"}
            </SubmitButton>
          </Box>
        </form>
      )}
    />
  );
};

export const MemberForm = MemberFormRaw;
