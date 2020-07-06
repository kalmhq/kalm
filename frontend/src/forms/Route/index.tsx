import { Box, Button, Collapse, Grid, Icon, Link, Typography } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { Alert, AlertTitle } from "@material-ui/lab";
import { KFreeSoloAutoCompleteMultiValues } from "forms/Basic/autoComplete";
import { KCheckboxGroupRender } from "forms/Basic/checkbox";
import { Link as RouteLink } from "react-router-dom";
import { KRadioGroupRender } from "forms/Basic/radio";
import { shouldError } from "forms/common";
import { ROUTE_FORM_ID } from "forms/formIDs";
import {
  KValidatorHosts,
  KValidatorPaths,
  ValidatorAtLeastOneHttpRouteDestination,
  ValidatorListNotEmpty,
  ValidatorRequired,
} from "forms/validator";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { State as TutorialState } from "reducers/tutorial";
import { arrayPush, InjectedFormProps } from "redux-form";
import { Field, FieldArray, formValueSelector, getFormSyncErrors, reduxForm } from "redux-form/immutable";
import { formValidateOrNotBlockByTutorial } from "tutorials/utils";
import { TDispatchProp } from "types";
import { httpMethods, HttpRouteDestination, HttpRouteForm, methodsModeAll, methodsModeSpecific } from "types/route";
import { arraysMatch } from "utils";
import { KPanel } from "widgets/KPanel";
import { Caption } from "widgets/Label";
import { Prompt } from "widgets/Prompt";
import { RenderHttpRouteConditions } from "./conditions";
import { RenderHttpRouteDestinations } from "./destinations";

const mapStateToProps = (state: RootState) => {
  const form = ROUTE_FORM_ID;
  const selector = formValueSelector(form || ROUTE_FORM_ID);
  const syncErrors = getFormSyncErrors(form || ROUTE_FORM_ID)(state) as { [key: string]: any };
  const certifications = state.get("certificates").get("certificates");
  const domains: Set<string> = new Set();

  certifications.forEach((x) => {
    x.get("domains")
      .filter((x) => x !== "*")
      .forEach((domain) => domains.add(domain));
  });

  return {
    tutorialState: state.get("tutorial"),
    syncErrors,
    schemes: selector(state, "schemes") as Immutable.List<string>,
    methodsMode: selector(state, "methodsMode") as string,
    hosts: selector(state, "hosts") as Immutable.List<string>,
    destinations: selector(state, "destinations") as Immutable.List<HttpRouteDestination>,
    domains: Array.from(domains),
    certifications,
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {
      "& .alert": {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
      },
    },
    box: {
      padding: theme.spacing(2),
      border: "1px solid black",
      marginBottom: theme.spacing(2),
    },

    heading: {
      fontSize: theme.typography.pxToRem(15),
      flexBasis: "20%",
      flexShrink: 0,
    },
    secondaryHeading: {
      fontSize: theme.typography.pxToRem(15),
      color: theme.palette.text.secondary,
    },
  });

export interface TutorialStateProps {
  tutorialState: TutorialState;
}

export interface ConnectedProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export interface Props
  extends InjectedFormProps<HttpRouteForm, TutorialStateProps>,
    ConnectedProps,
    WithStyles<typeof styles> {}

interface State {
  isAdvancedPartUnfolded: boolean;
  isValidCertificationUnfolded: boolean;
}

class RouteFormRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isAdvancedPartUnfolded: false,
      isValidCertificationUnfolded: false,
    };
  }

  private canCertDomainsSuiteForHost = (domains: Immutable.List<string>, host: string) => {
    for (let i = 0; i < domains.size; i++) {
      const domain = domains.get(i)!;
      if (domain === "*") {
        return false;
      }

      if (domain.toLowerCase() === host.toLowerCase()) {
        return true;
      }

      const domainParts = domain.toLowerCase().split(".");
      const hostParts = host.toLowerCase().split(".");

      if (hostParts.length === 0 || domainParts.length === 0 || domainParts[0] !== "*") {
        continue;
      }

      if (arraysMatch(hostParts.slice(1), domainParts.slice(1))) {
        return true;
      }
    }

    return false;
  };

  private renderCertificationStatus() {
    const { hosts, certifications } = this.props;
    const { isValidCertificationUnfolded } = this.state;

    if (hosts.size === 0) {
      return null;
    }

    let hostCertResults: any[] = [];

    hosts.forEach((host) => {
      const cert = certifications.find((c) => this.canCertDomainsSuiteForHost(c.get("domains"), host));

      hostCertResults.push({
        host,
        cert,
      });
    });

    const missingCertsCount = hostCertResults.filter((x) => !x.cert).length;

    const missingCertsHosts = hostCertResults.filter((x) => !x.cert);
    const validHosts = hostCertResults.filter((x) => !!x.cert);

    return (
      <Alert severity={missingCertsCount === 0 ? "success" : "warning"}>
        {missingCertsHosts.length > 0 ? (
          <AlertTitle>
            {missingCertsHosts.length} host{missingCertsHosts.length > 1 ? "s are" : " is"} missing valid SSL
            certificate signed by a certificate authority.
          </AlertTitle>
        ) : (
          <AlertTitle>All hosts have valid SSL certifications signed by a certificate authority.</AlertTitle>
        )}

        {missingCertsHosts.length > 0 ? (
          <>
            <Box marginBottom={1}>
              {missingCertsHosts.map(({ host }) => {
                return (
                  <Box key={host} ml={2} fontWeight="bold">
                    {host}
                  </Box>
                );
              })}
            </Box>

            <Box marginBottom={1}>
              <Typography>
                Default tls certificate will be used for these domains. Invalid SSL certificate / Intermediate
                certificates error could occur when you try to access this route. Kalm provides a free & simple way to
                fix this issue in seconds.
                <RouteLink to="/certificates">Go to certification page</RouteLink>, and create a certificate for your
                domain.
              </Typography>
            </Box>
          </>
        ) : null}

        {validHosts.length > 0 ? (
          <Box mt={2} mb={1}>
            <Link
              component="button"
              variant="body2"
              onClick={() => this.setState({ isValidCertificationUnfolded: !isValidCertificationUnfolded })}
            >
              >> View hosts that have valid certificates.
            </Link>
          </Box>
        ) : null}
        <Collapse in={isValidCertificationUnfolded}>
          {validHosts.map(({ host, cert }) => {
            return (
              <Typography key={host}>
                <strong>{host}</strong> will use{" "}
                <Link href="#" variant="body2">
                  <strong>{cert.get("name")}</strong>
                </Link>{" "}
                certification.
              </Typography>
            );
          })}
        </Collapse>
      </Alert>
    );
  }

  public render() {
    const {
      methodsMode,
      classes,
      domains,
      dispatch,
      destinations,
      form,
      schemes,
      handleSubmit,
      dirty,
      submitSucceeded,
    } = this.props;

    return (
      <div className={classes.root}>
        <Grid container spacing={2}>
          <Grid item xs={8}>
            <Prompt when={dirty && !submitSucceeded} message="Are you sure to leave without saving changes?" />
            <Box mb={2}>
              <KPanel
                title="Hosts and paths"
                content={
                  <Box p={2}>
                    <Field
                      label="Hosts"
                      component={KFreeSoloAutoCompleteMultiValues}
                      name="hosts"
                      margin="dense"
                      validate={[ValidatorRequired, KValidatorHosts]}
                      placeholder="Type a host"
                      options={domains}
                    />
                    <Field
                      label="Paths"
                      component={KFreeSoloAutoCompleteMultiValues}
                      name="paths"
                      margin="dense"
                      validate={[ValidatorRequired, KValidatorPaths]}
                      placeholder="Type a path"
                      helperText='Allow to configure multiple paths. Each path must begin with "/".'
                    />
                  </Box>
                }
              />
            </Box>

            <Box mb={2}>
              <KPanel
                title="Schemes and methods"
                content={
                  <Box p={2}>
                    <Caption>Define acceptable schemes and methods for incoming requests.</Caption>
                    <Field
                      title="Http methods"
                      component={KRadioGroupRender}
                      name="methodsMode"
                      options={[
                        {
                          value: methodsModeAll,
                          label: "All http methods are allowed in this route.",
                        },
                        {
                          value: methodsModeSpecific,
                          label: "Choose allowed methods manually.",
                        },
                      ]}
                    />
                    <Collapse in={methodsMode === methodsModeSpecific}>
                      <div>
                        <Field
                          title="Choose methods you need"
                          component={KCheckboxGroupRender}
                          componentType={"Chip"}
                          validate={methodsMode === methodsModeSpecific ? ValidatorListNotEmpty : []}
                          name="methods"
                          options={httpMethods.map((m) => {
                            return { value: m, label: m };
                          })}
                        />
                      </div>
                    </Collapse>
                    <Field
                      title="Allow traffic through"
                      component={KCheckboxGroupRender}
                      componentType={"Chip"}
                      validate={ValidatorListNotEmpty}
                      name="schemes"
                      options={[
                        {
                          value: "http",
                          label: "http",
                        },
                        {
                          value: "https",
                          label: "https",
                          htmlColor: "#9CCC65",
                        },
                      ]}
                    />
                    {/* TODO: wait backend fix this. */}
                    {/* <Collapse in={schemes.includes("http")}>
            <div>
              <Field
                component={KBoolCheckboxRender}
                name="httpRedirectToHttps"
                label={
                  <span>
                    Redirect all <strong>http</strong> request to <strong>https</strong> with 301 status code.
                  </span>
                }
              />
            </div>
          </Collapse> */}
                    <Collapse in={schemes.includes("https")}>
                      <Alert className="alert" severity="info">
                        You choosed https. Please note that the TLS termination will be happened in this route level,
                        which means the targets will receive http requests instead.
                      </Alert>
                      {this.renderCertificationStatus()}
                    </Collapse>
                  </Box>
                }
              />
            </Box>

            <Box mb={2}>
              <KPanel
                title="Targets"
                content={
                  <Box p={2}>
                    <Caption>Choose targets that will receive requets.</Caption>
                    <Box mt={2} mr={2} mb={2}>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<Icon>add</Icon>}
                        size="small"
                        id="add-target-button"
                        onClick={() =>
                          dispatch(
                            arrayPush(
                              form,
                              "destinations",
                              Immutable.Map({
                                host: "",
                                weight: 1,
                              }),
                            ),
                          )
                        }
                      >
                        Add a target
                      </Button>
                    </Box>
                    <Collapse in={destinations.size > 1}>
                      <Alert className="alert" severity="info">
                        There are more than one target, traffic will be forwarded to each target by weight. Read more
                        about canary rollout.
                      </Alert>
                    </Collapse>
                    <FieldArray
                      name="destinations"
                      component={RenderHttpRouteDestinations}
                      rerenderOnEveryChange
                      validate={ValidatorAtLeastOneHttpRouteDestination}
                    />
                  </Box>
                }
              />
            </Box>

            <Box mb={2}>
              <KPanel
                title="Rules"
                content={
                  <Box p={2}>
                    <Caption>
                      Set specific rules for this ingress. Only requests that match these conditions will be accepted.
                    </Caption>
                    <Box display="flex">
                      <Box mt={2} mr={2} mb={2}>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<Icon>add</Icon>}
                          size="small"
                          onClick={() =>
                            dispatch(
                              arrayPush(
                                form,
                                "conditions",
                                Immutable.Map({
                                  type: "header",
                                  operator: "equal",
                                  name: "",
                                  value: "",
                                }),
                              ),
                            )
                          }
                        >
                          Add Header Rule
                        </Button>
                      </Box>
                      <Box mt={2} mr={2} mb={2}>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<Icon>add</Icon>}
                          size="small"
                          onClick={() =>
                            dispatch(
                              arrayPush(
                                form,
                                "conditions",
                                Immutable.Map({
                                  type: "query",
                                  operator: "equal",
                                  name: "",
                                  value: "",
                                }),
                              ),
                            )
                          }
                        >
                          Add Query Rule
                        </Button>
                      </Box>
                    </Box>
                    <FieldArray name="conditions" component={RenderHttpRouteConditions} />
                  </Box>
                }
              />
            </Box>

            {/* <Expansion title="Advanced" subTitle="more powerful settings">
          <h1>TODO</h1>
          <div className={classes.box}>
            <FormControl component="fieldset">
              <FormLabel component="legend">High availability</FormLabel>
            </FormControl>
          </div>

          <div className={classes.box}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Debug & Testing</FormLabel>
            </FormControl>
          </div>

          <div className={classes.box}>
            <FormControl component="fieldset">
              <FormLabel component="legend">CORS</FormLabel>
            </FormControl>
          </div>

          <div className={classes.box}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Need more features?</FormLabel>
            </FormControl>
          </div>
        </Expansion> */}
            <Button
              id="add-route-submit-button"
              type="submit"
              onClick={handleSubmit}
              color="primary"
              variant="contained"
            >
              Save Route
            </Button>
          </Grid>
        </Grid>
      </div>
    );
  }
}

// use connect twice
// The one inside reduxForm is normal usage
// The one outside of reduxForm is to set tutorialState props for the form

const form = reduxForm<HttpRouteForm, TutorialStateProps>({
  onSubmitFail: console.log,
  form: ROUTE_FORM_ID,
  enableReinitialize: true,
  touchOnChange: true,
  shouldError: shouldError,
  validate: formValidateOrNotBlockByTutorial,
})(connect(mapStateToProps)(withStyles(styles)(RouteFormRaw)));

export const RouteForm = connect((state: RootState) => ({
  tutorialState: state.get("tutorial"),
}))(form);
