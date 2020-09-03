import { Grid } from "@material-ui/core";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import { Field, FieldArray, getIn } from "formik";
import { KFreeSoloFormikAutoCompleteMultiValues } from "forms/Basic/autoComplete";
import React from "react";
import { GithubOrgFormType, SSOGithubConnectorFormType } from "types/sso";
import { capitalize } from "utils/string";
import { DeleteIcon, GithubIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { Body, Body2, H6, Subtitle1, Subtitle2 } from "widgets/Label";
import { KRenderDebounceFormikTextField } from "../Basic/textfield";
import { ValidatorRequired } from "../validator";
import { Alert } from "@material-ui/lab";

export const ValidatorOrgs = (values: any[], _allValues?: any, _props?: any, _name?: any) => {
  if (!values) return undefined;

  if (values.length === 0) {
    return "You should at least configure one organization.";
  }
};

class RenderGithubConnectorOrganizations extends React.Component<{
  name: string;
  orgs?: GithubOrgFormType[];
}> {
  public render() {
    const { name, orgs } = this.props;

    return (
      <FieldArray
        name={name}
        render={(arrayHelpers) => (
          <>
            {orgs && orgs.length === 0 ? (
              <Box mt={2} mb={2}>
                <Alert severity="error">{"You should at least configure one organization."}</Alert>
              </Box>
            ) : null}

            {orgs &&
              orgs.map((org, index) => {
                let field = `${name}.${index}`;
                return (
                  <Grid container spacing={2} key={field}>
                    <Grid item xs={3}>
                      <Field
                        component={KRenderDebounceFormikTextField}
                        name={`${field}.name`}
                        label="Organization Name"
                        placeholder="Please type a organization name"
                        validate={ValidatorRequired}
                        required
                      />
                    </Grid>

                    <Grid item xs={8}>
                      <Field
                        component={KFreeSoloFormikAutoCompleteMultiValues}
                        label="Teams"
                        name={`${field}.teams`}
                        placeholder="Please type a team name"
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
                          onClick={() => arrayHelpers.remove(index)}
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
  }
}

interface Props {
  connector: SSOGithubConnectorFormType;
  form: any;
  field: string;
}

class RenderGithubConnectorRaw extends React.PureComponent<Props> {
  private addOrganization = () => {
    const {
      field,
      form: { setFieldValue, values },
    } = this.props;

    const prevOrgs = getIn(values, `${field}.config.orgs`);

    prevOrgs && prevOrgs.length > 0
      ? setFieldValue(`${field}.config.orgs`, [
          ...prevOrgs,
          {
            name: "",
            teams: [],
          },
        ])
      : setFieldValue(`${field}.config.orgs`, [
          {
            name: "",
            teams: [],
          },
        ]);
  };

  public render() {
    const {
      connector,
      field,
      form: { values },
    } = this.props;

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
                component={KRenderDebounceFormikTextField}
                name={`${field}.name`}
                label="Name"
                placeholder="Give a name of this connector"
                validate={ValidatorRequired}
                helperText="The name of this connector."
                required
              />

              <Grid container spacing={2}>
                <Grid item xs>
                  <Field
                    component={KRenderDebounceFormikTextField}
                    name={`${field}.config.clientID`}
                    label="Client ID"
                    autoComplete="disabled"
                    placeholder="Oauth Client ID"
                    validate={ValidatorRequired}
                    helperText="Follow the right steps to get Client ID."
                    required
                  />
                </Grid>
                <Grid item xs>
                  <Field
                    component={KRenderDebounceFormikTextField}
                    autoComplete={"false"}
                    name={`${field}.config.clientSecret`}
                    label="Client Secret"
                    placeholder="Oauth Client Secret"
                    validate={ValidatorRequired}
                    required
                  />
                </Grid>
              </Grid>

              <Box mt={1}>
                <Body2>
                  User MUST be a member of at least one of the specified orgs to authenticate with kalm. If teams are
                  set, only members belongs to these teams will have right to access kalm. Otherwise all members in the
                  org will have right.
                </Body2>
              </Box>

              {/*<Box mt={1}>*/}
              {/*  <Body2>*/}
              {/*    Group claims are formatted as "(org):(team)". For example if a user is part of the "engineering"*/}
              {/*    team of the "kalm" org, the group claim would include "kalm:engineering".*/}
              {/*  </Body2>*/}
              {/*</Box>*/}

              <Box mt={1}>
                <RenderGithubConnectorOrganizations
                  name={`${field}.config.orgs`}
                  orgs={getIn(values, `${field}.config.orgs`)}
                />
              </Box>

              <Button variant="outlined" color="primary" onClick={this.addOrganization} size="small">
                Add an organization
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Subtitle1>Steps to get Client ID and Client Secret on Github</Subtitle1>
              <Box pt={2}>
                <Subtitle2>Step 1: Goto github application creation page</Subtitle2>
                <Body>
                  To get Client ID and Client Secret, you must create an oauth application first. Github oauth
                  application can be created under an organization or a user. Create a user oauth application{" "}
                  <a href="https://github.com/settings/applications/new" rel="noopener noreferrer" target="_blank">
                    HERE
                  </a>
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
  }
}

export const RenderGithubConnector = RenderGithubConnectorRaw;
