import Box from "@material-ui/core/Box";
import { FinalTextField } from "forms/Final/textfield";
import { FormDataPreview } from "forms/Final/util";
import { trimAndToLowerParse } from "forms/normalizer";
import { ValidatorIsEmail } from "forms/validator";
import React from "react";
import { Field, Form, FormRenderProps } from "react-final-form";
import { RoleBinding, SubjectTypeUser } from "types/member";
import { SubmitButton } from "widgets/Button";
import { KPanel } from "widgets/KPanel";

// const clusterRolesOptions = [
//   { text: "Cluster Viewer", value: "clusterViewer", desc: "Read-only access in cluster scope" },
//   {
//     text: "Cluster Editor",
//     value: "clusterEditor",
//     desc: "All permissions except authorize cluster-level permissions to others",
//   },
//   { text: "Cluster Owner", value: "clusterOwner", desc: "All permissions" },
// ];

// const applicationRolesOptions = [
//   { text: "Viewer", value: "viewer", desc: "Read-only access in this application" },
//   {
//     text: "Editor",
//     value: "editor",
//     desc: "All permissions in this application except authorize to others",
//   },
//   { text: "Owner", value: "owner", desc: "All permissions in this application" },
// ];

interface OwnProps {
  onSubmit: (roleBinding: RoleBinding) => any;
}

interface Props extends OwnProps {}

const MemberFormRaw: React.FC<Props> = (props) => {
  const { onSubmit } = props;
  return (
    <Form
      keepDirtyOnReinitialize
      onSubmit={onSubmit}
      render={({ handleSubmit, values }: FormRenderProps<RoleBinding>) => (
        <form onSubmit={handleSubmit}>
          <KPanel title="Add a new member">
            <Box p={2}>
              <Field
                component={FinalTextField}
                name="subject"
                label={"Email"}
                validate={ValidatorIsEmail}
                parse={trimAndToLowerParse}
                placeholder={"e.g. user@example.com"}
                helperText={
                  values.subjectType === SubjectTypeUser ? "Please type the user email" : "Please type the group name"
                }
              />
            </Box>
          </KPanel>

          <FormDataPreview />

          <Box mt={2}>
            <SubmitButton>{"Add Member"}</SubmitButton>
          </Box>
        </form>
      )}
    />
  );
};

export const MemberForm = MemberFormRaw;
