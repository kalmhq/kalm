import { Grid } from "@material-ui/core";
import Box from "@material-ui/core/Box";
import { Alert } from "@material-ui/lab";
import { AutoCompleteMultiValuesFreeSolo } from "forms/Final/autoComplete";
import { trimParse } from "forms/normalizer";
import React from "react";
import { Field } from "react-final-form";
import { connect, DispatchProp } from "react-redux";
import { SSOGitlabConnector } from "types/sso";
import { capitalize } from "utils/string";
import { Body, H6, Subtitle1, Subtitle2 } from "widgets/Label";
import { KMLink } from "widgets/Link";
import { FinalTextField } from "../Final/textfield";
import { ValidatorRequired } from "../validator";

interface Props extends DispatchProp {
  connector: SSOGitlabConnector;
  fieldName: string;
}

const RenderGitlabConnectorRaw: React.FC<Props> = (props) => {
  const { connector, fieldName } = props;

  return (
    <Box p={2}>
      <H6>
        <Box style={{ verticalAlign: "middle" }} mr={2} display="inline-block">
          {/* Gitlab icon place holder */}
        </Box>
        {capitalize(connector.type)}
      </H6>

      <Box mt={2}>
        <Grid container spacing={2}>
          <Grid item xs={8}>
            <Grid container spacing={2}>
              <Grid item xs>
                <Field
                  component={FinalTextField}
                  name={`${fieldName}.name`}
                  label="Name"
                  placeholder="Give a name of this connector"
                  validate={ValidatorRequired}
                  parse={trimParse}
                  helperText="The name of this connector."
                  required
                />
              </Grid>
              <Grid item xs>
                <Field
                  component={FinalTextField}
                  name={`${fieldName}.config.baseURL`}
                  label="Gitlab Base URL"
                  placeholder="Please type Gitlab Base URL"
                  validate={ValidatorRequired}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs>
                <Field
                  component={FinalTextField}
                  name={`${fieldName}.config.clientID`}
                  label="Client ID"
                  placeholder="Oauth Client ID"
                  validate={ValidatorRequired}
                  helperText="Follow the right steps to get Client ID."
                />
              </Grid>
              <Grid item xs>
                <Field
                  component={FinalTextField}
                  name={`${fieldName}.config.clientSecret`}
                  label="Client Secret"
                  placeholder="Oauth Client Secret"
                  validate={ValidatorRequired}
                  required
                />
              </Grid>
            </Grid>
            <Box mt={1}>
              <Alert severity="info">
                User MUST be a member of at least one of the specified groups to authenticate with kalm.
              </Alert>
            </Box>

            {/*<Box mt={1}>*/}
            {/*  <Body2>*/}
            {/*    Group claims are formatted as "(org):(team)". For example if a user is part of the "engineering"*/}
            {/*    team of the "kalm" org, the group claim would include "kalm:engineering".*/}
            {/*  </Body2>*/}
            {/*</Box>*/}
            <Box mt={1}>
              <Field
                component={AutoCompleteMultiValuesFreeSolo}
                options={[]}
                label="Groups"
                name={`${fieldName}.config.groups`}
                validate={ValidatorRequired}
                helperText="Multiple groups are allowed. After entering a group name, try to press enter."
              />
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Subtitle1>Steps to get Client ID and Client Secret on Gitlab</Subtitle1>
            <Box pt={2}>
              <Subtitle2>Step 1: Goto gitlab application creation page</Subtitle2>
              <Body>
                To get Client ID and Client Secret, you must create an oauth application first. Go to application
                creation page by clicking{" "}
                <KMLink href="https://gitlab.com/profile/applications" rel="noopener noreferrer" target="_blank">
                  HERE
                </KMLink>
                . If you are using a private deployed gitlab. Go to the same path under your domain.
              </Body>
            </Box>
            <Box pt={2}>
              <Subtitle2>Step 2: Fill form on gitlab</Subtitle2>
              <Body>
                For the <strong>Redirect URI</strong> Field, Copy and use the callback url above. Please make sure the{" "}
                <strong>openid</strong>, <strong>profile</strong> and <strong>email</strong> are checked in scopes.
              </Body>
            </Box>
            <Box pt={2}>
              <Subtitle2>Step 3: Get Client ID and Client Secret </Subtitle2>
              <Body>
                After you submit the form. You should be able to see Client ID and Client Secret. Copy and fill the
                corresponding fields in Kalm.
              </Body>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export const RenderGitlabConnector = connect()(RenderGitlabConnectorRaw);
