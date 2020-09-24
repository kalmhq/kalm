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
import Grid from "@material-ui/core/Grid";
import { FormDataPreview } from "forms/Final/util";

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

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp, OwnProps {}

class MemberFormRaw extends React.PureComponent<Props> {
  public render() {
    const { isClusterLevel, initial, onSubmit } = this.props;
    const rolesOptions = isClusterLevel ? clusterRolesOptions : applicationRolesOptions;
    return (
      <Form
        initialValues={initial}
        keepDirtyOnReinitialize
        onSubmit={onSubmit}
        render={({ handleSubmit, submitting, dirty, values }: FormRenderProps<RoleBinding>) => (
          <form onSubmit={handleSubmit}>
            <Prompt when={dirty && !submitting} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
            <Box mb={2}>
              <KPanel
                title="Grant role permissions to a user or a group"
                content={
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
                              desc:
                                "Grant permission for every member in a group. You need to provide the group's name.",
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

                    <Box mb={2}>
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
                          values.subjectType === SubjectTypeUser
                            ? "Please type the user email"
                            : "Please type the group name"
                        }
                      />
                    </Box>
                  </Box>
                }
              />

              <FormDataPreview />

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
