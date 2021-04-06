import { Grid } from "@material-ui/core";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import { Alert } from "@material-ui/lab";
import { AutoCompleteMultiValuesFreeSolo } from "forms/Final/autoComplete";
import { trimParse } from "forms/normalizer";
import React from "react";
import { Field, FormSpy, FormSpyRenderProps } from "react-final-form";
import { FieldArray } from "react-final-form-arrays";
import { GithubOrg, SSOConfig, SSOGithubConnector } from "types/sso";
import { capitalize } from "utils/string";
import { DeleteIcon, GithubIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { Body, H6, Subtitle1, Subtitle2 } from "widgets/Label";
import { KMLink } from "widgets/Link";
import { FinalTextField } from "../Final/textfield";
import { ValidatorArrayNotEmpty, ValidatorRequired } from "../validator";

export const ValidatorOrgs = (values: any[], _allValues?: any, _props?: any, _name?: any) => {
  if (!values) return undefined;

  if (values.length === 0) {
    return "You should at least configure one organization.";
  }
};

const RenderGithubConnectorOrganizations: React.FC<{
  name: string;
}> = (props) => {
  const { name } = props;
  return (
    <FieldArray<GithubOrg>
      name={name}
      validate={ValidatorArrayNotEmpty as any}
      render={({ fields, meta: { error, touched } }) => (
        <>
          {touched && error && typeof error === "string" ? (
            <Box mt={2} mb={2}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : null}

          {fields.map((_, index) => {
            let fieldName = `${name}.${index}`;
            return (
              <Grid container spacing={2} key={fieldName}>
                <Grid item xs={3}>
                  <Field
                    component={FinalTextField}
                    name={`${fieldName}.name`}
                    label="Organization Name"
                    validate={ValidatorRequired}
                    parse={trimParse}
                  />
                </Grid>

                <Grid item xs={8}>
                  <Field
                    component={AutoCompleteMultiValuesFreeSolo}
                    options={[]}
                    label="Teams"
                    name={`${fieldName}.teams`}
                    helperText="Multiple teams are allowed. After entering a team name, try to press enter."
                  />
                </Grid>
                <Grid item xs={1}>
                  <Box pt={1.5}>
                    <IconButtonWithTooltip
                      tooltipPlacement="top"
                      tooltipTitle="Delete"
                      aria-label="delete"
                      size="small"
                      onClick={() => fields.remove(index)}
                    >
                      <DeleteIcon />
                    </IconButtonWithTooltip>
                  </Box>
                </Grid>
              </Grid>
            );
          })}
        </>
      )}
    />
  );
};

interface Props {
  connector: SSOGithubConnector;
  fieldName: string;
}

const RenderGithubConnectorRaw: React.FC<Props> = (props) => {
  const { connector, fieldName } = props;

  const addOrganization = (prevOrgs: any[], change: any) => {
    prevOrgs && prevOrgs.length > 0
      ? change(`${fieldName}.config.orgs`, [
          ...prevOrgs,
          {
            name: "",
            teams: [],
          },
        ])
      : change(`${fieldName}.config.orgs`, [
          {
            name: "",
            teams: [],
          },
        ]);
  };

  return (
    <Box p={2}>
      <H6>
        <Box style={{ verticalAlign: "middle" }} mr={2} display="inline-block">
          <GithubIcon />
        </Box>
        {capitalize(connector.type)}
      </H6>

      <Box mt={2}>
        <Grid container spacing={2}>
          <Grid item xs={8}>
            <Field
              component={FinalTextField}
              name={`${fieldName}.name`}
              label="Name"
              placeholder="Give a name of this connector"
              validate={ValidatorRequired}
              parse={trimParse}
              helperText="The name of this connector."
            />

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
                />
              </Grid>
            </Grid>

            <Box mt={1}>
              <Alert severity="info">
                User MUST be a member of at least one of the specified orgs to authenticate with kalm. If teams are set,
                only members belongs to these teams will have right to access kalm. Otherwise all members in the org
                will have right.
              </Alert>
            </Box>

            {/*<Box mt={1}>*/}
            {/*  <Body2>*/}
            {/*    Group claims are formatted as "(org):(team)". For example if a user is part of the "engineering"*/}
            {/*    team of the "kalm" org, the group claim would include "kalm:engineering".*/}
            {/*  </Body2>*/}
            {/*</Box>*/}

            <Box mt={1}>
              <RenderGithubConnectorOrganizations name={`${fieldName}.config.orgs`} />
            </Box>

            <FormSpy subscription={{ pristine: true }}>
              {({ form: { change } }: FormSpyRenderProps<SSOConfig>) => {
                return (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => addOrganization(connector.config!.orgs, change)}
                    size="small"
                  >
                    Add an organization
                  </Button>
                );
              }}
            </FormSpy>
          </Grid>
          <Grid item xs={4}>
            <Subtitle1>Steps to get Client ID and Client Secret on Github</Subtitle1>
            <Box pt={2}>
              <Subtitle2>Step 1: Goto github application creation page</Subtitle2>
              <Body>
                To get Client ID and Client Secret, you must create an oauth application first. Github oauth application
                can be created under an organization or a user. Create a user oauth application{" "}
                <KMLink href="https://github.com/settings/applications/new" rel="noopener noreferrer" target="_blank">
                  HERE
                </KMLink>
                . Or create an org oauth application{" "}
                <a
                  href="https://github.com/organizations/YOUR-ORGANIZATION-NAME/settings/applications/new"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  HERE (change your org name in url)
                </a>
                .
              </Body>
            </Box>
            <Box pt={2}>
              <Subtitle2>Step 2: Fill form on github</Subtitle2>
              <Body>
                For the <strong>Authorization callback URL</strong> Field, Copy and use the callback url above.
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

export const RenderGithubConnector = RenderGithubConnectorRaw;
