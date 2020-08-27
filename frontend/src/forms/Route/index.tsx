import { Box, Button, Collapse, Grid, Link } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import { Alert, AlertTitle } from "@material-ui/lab";
import { loadDomainDNSInfo } from "actions/domain";
import { Field, Form, FormikProps, withFormik } from "formik";
import { KFreeSoloFormikAutoCompleteMultiValues } from "forms/Basic/autoComplete";
import { KFormikBoolCheckboxRender, KFormikCheckboxGroupRender } from "forms/Basic/checkbox";
import { KFormikRadioGroupRender } from "forms/Basic/radio";
import { ROUTE_FORM_ID } from "forms/formIDs";
import {
  KValidatorHostsWithWildcardPrefix,
  KValidatorPaths,
  ValidatorArrayNotEmpty,
  ValidatorRequired,
} from "forms/validator";
import routesGif from "images/routes.gif";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { Link as RouteLink } from "react-router-dom";
import { RootState } from "reducers";
import { arrayPush } from "redux-form";
import { TDispatchProp } from "types";
import { httpMethods, HttpRouteForm, methodsModeAll, methodsModeSpecific } from "types/route";
import { isArray } from "util";
import { arraysMatch } from "utils";
import { includesForceHttpsDomain } from "utils/domain";
import { default as sc, default as stringConstants } from "utils/stringConstants";
import { CollapseWrapper } from "widgets/CollapseWrapper";
import DomainStatus from "widgets/DomainStatus";
import { KPanel } from "widgets/KPanel";
import { Caption } from "widgets/Label";
import { Prompt } from "widgets/Prompt";
import { RenderHttpRouteConditions } from "./conditions";
import { RenderHttpRouteDestinations } from "./destinations";

const mapStateToProps = (state: RootState) => {
  // const selector = formValueSelector(ROUTE_FORM_ID);
  // const syncErrors = getFormSyncErrors(ROUTE_FORM_ID)(state) as { [key: string]: any };
  const certifications = state.get("certificates").get("certificates");
  const domains: Set<string> = new Set();
  // const httpRedirectToHttps = !!selector(state, "httpRedirectToHttps") as boolean;

  certifications.forEach((x) => {
    x.get("domains")
      .filter((x) => x !== "*")
      .forEach((domain) => domains.add(domain));
  });

  return {
    tutorialState: state.get("tutorial"),
    // syncErrors,
    // schemes: selector(state, "schemes") as Immutable.List<string>,
    // methodsMode: selector(state, "methodsMode") as string,
    // httpRedirectToHttps,
    // destinations: selector(state, "destinations") as Immutable.List<HttpRouteDestination>,
    domains: Array.from(domains),
    ingressIP: state.get("cluster").get("info").get("ingressIP"),
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
    secondaryTip: {
      color: theme.palette.text.secondary,
    },
  });

interface OwnProps {
  isEdit?: boolean;
  onSubmit: any;
  initial: HttpRouteForm;
}

export interface ConnectedProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export interface Props extends ConnectedProps, OwnProps, FormikProps<HttpRouteForm>, WithStyles<typeof styles> {}

interface State {
  isAdvancedPartUnfolded: boolean;
  isValidCertificationUnfolded: boolean;
}

const hostsValidators = [ValidatorRequired, KValidatorHostsWithWildcardPrefix];
const pathsValidators = [ValidatorRequired, KValidatorPaths];

class RouteFormRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isAdvancedPartUnfolded: false,
      isValidCertificationUnfolded: false,
    };
  }

  componentDidUpdate(prevProps: Props) {
    const { values, dispatch, setFieldValue } = this.props;
    const { hosts, schemes, httpRedirectToHttps } = values;
    if (hosts !== prevProps.values.hosts) {
      hosts.forEach((host) => {
        dispatch(loadDomainDNSInfo(host));
      });
    }

    // for dev, app domains auto enable https
    if (!schemes.includes("https")) {
      if (includesForceHttpsDomain(hosts).length > 0) {
        if (schemes.includes("http")) {
          setFieldValue("schemes", ["http", "https"]);
        } else {
          setFieldValue("schemes", ["https"]);
        }
      }
    }

    // set httpRedirectToHttps to false if http or https is not in schemes
    if (!(schemes.includes("http") && schemes.includes("https")) && httpRedirectToHttps) {
      setFieldValue("httpRedirectToHttps", false);
    }
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
    const { values, certifications } = this.props;
    const { isValidCertificationUnfolded } = this.state;
    const { hosts } = values;

    if (hosts.length === 0) {
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
              View hosts that have valid certificates.
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

  private renderTargets = () => {
    const { dispatch, values } = this.props;
    const { destinations } = values;
    if (destinations.length === 0) {
      dispatch(
        arrayPush(
          ROUTE_FORM_ID,
          "destinations",
          Immutable.Map({
            host: "",
            weight: 1,
          }),
        ),
      );
    }
    return (
      <Box p={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={12}>
            <RenderHttpRouteDestinations destinations={values.destinations} />
          </Grid>
          <Grid item xs={8} sm={8} md={8}>
            <CollapseWrapper title={stringConstants.ROUTE_MULTIPLE_TARGETS_HELPER}>
              <Box m={2} style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
                <img src={routesGif} alt="routes with multi-target" width={233} height={133} />
                <Box pt={2}>
                  <Caption>{stringConstants.ROUTE_MULTIPLE_TARGETS_DESC}</Caption>
                </Box>
              </Box>
            </CollapseWrapper>
          </Grid>
        </Grid>
      </Box>
    );
  };
  public render() {
    const {
      classes,
      ingressIP,
      isEdit,
      values,
      dirty,
      handleChange,
      touched,
      errors,
      setFieldValue,
      isSubmitting,
    } = this.props;
    const { hosts, methodsMode } = values;

    const hstsDomains = includesForceHttpsDomain(hosts);

    const icons = hosts.map((host, index) => {
      if (isArray(errors.hosts) && errors.hosts[index]) {
        return undefined;
      } else {
        return <DomainStatus domain={host} />;
      }
    });

    return (
      <div className={classes.root}>
        <Form>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Prompt when={dirty && !isSubmitting} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
              <Box mb={2}>
                <KPanel
                  title="Hosts and paths"
                  content={
                    <Box p={2}>
                      <Field
                        component={KFreeSoloFormikAutoCompleteMultiValues}
                        icons={Immutable.List(icons)}
                        label="Hosts"
                        name="hosts"
                        validate={hostsValidators}
                        placeholder="e.g. www.example.com"
                        helperText={
                          <Caption color="textSecondary">
                            Your cluster ip is{" "}
                            <Link
                              href="#"
                              onClick={() => {
                                const isHostsIncludeIngressIP = !!hosts.find((host) => host === ingressIP);
                                if (!isHostsIncludeIngressIP) {
                                  setFieldValue("hosts", hosts.push(ingressIP));
                                }
                              }}
                            >
                              {ingressIP}
                            </Link>
                            . {sc.ROUTE_HOSTS_INPUT_HELPER}
                          </Caption>
                        }
                      />
                      <Field
                        component={KFreeSoloFormikAutoCompleteMultiValues}
                        label="Path Prefixes"
                        name="paths"
                        validate={pathsValidators}
                        placeholder="e.g. /some/path/to/app"
                        helperText={sc.ROUTE_PATHS_INPUT_HELPER}
                      />
                      <Field
                        component={KFormikBoolCheckboxRender}
                        name="stripPath"
                        label={sc.ROUTE_STRIP_PATH_LABEL}
                        helperText={sc.ROUTE_STRIP_PATH_HELPER}
                        value={values.stripPath}
                        error={errors.stripPath}
                        touched={touched.stripPath}
                        onChange={(v: boolean) => {
                          setFieldValue("stripPath", v);
                        }}
                      />
                    </Box>
                  }
                />
              </Box>

              <Box mb={2}>
                <KPanel
                  title="Schemes and Methods"
                  content={
                    <Box p={2}>
                      <KFormikRadioGroupRender
                        title="Http Methods"
                        name="methodsMode"
                        error={!!errors.methodsMode && touched.methodsMode}
                        value={values.methodsMode}
                        onChange={handleChange}
                        options={[
                          {
                            value: methodsModeAll,
                            label: sc.ROUTE_HTTP_METHOD_ALL,
                          },
                          {
                            value: methodsModeSpecific,
                            label: sc.ROUTE_HTTP_METHOD_CUSTOM,
                          },
                        ]}
                      />
                      <Collapse in={methodsMode === methodsModeSpecific}>
                        <Field
                          component={KFormikCheckboxGroupRender}
                          componentType={"Checkbox"}
                          validate={methodsMode === methodsModeSpecific ? ValidatorArrayNotEmpty : []}
                          name="methods"
                          options={httpMethods.map((m) => {
                            return { value: m, label: m };
                          })}
                        />
                      </Collapse>
                      <Field
                        title="Allow traffic through"
                        component={KFormikCheckboxGroupRender}
                        componentType={"Checkbox"}
                        validate={ValidatorArrayNotEmpty}
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
                      <Collapse
                        in={
                          values.schemes && values.schemes.indexOf("http") > -1 && values.schemes.indexOf("https") > -1
                        }
                      >
                        <Field
                          component={KFormikBoolCheckboxRender}
                          name="httpRedirectToHttps"
                          value={values.httpRedirectToHttps}
                          error={errors.httpRedirectToHttps}
                          touched={touched.httpRedirectToHttps}
                          onChange={(v: boolean) => setFieldValue("httpRedirectToHttps", v)}
                          label={
                            <span>
                              Redirect all <strong>http</strong> request to <strong>https</strong> with 301 status code.
                            </span>
                          }
                        />
                      </Collapse>
                      <Collapse in={values.schemes.includes("https")}>
                        <Alert className="alert" severity="info">
                          {sc.ROUTE_HTTPS_ALERT}
                        </Alert>
                        {hstsDomains.length > 0 ? (
                          <Alert className="alert" severity="warning">
                            <Box display="flex">
                              The
                              <Box ml="4px" mr="4px">
                                <strong>{hstsDomains.join(", ")}</strong>
                              </Box>
                              {stringConstants.HSTS_DOMAINS_REQUIRED_HTTPS}
                            </Box>
                          </Alert>
                        ) : null}
                        {this.renderCertificationStatus()}
                      </Collapse>
                    </Box>
                  }
                />
              </Box>

              <Box mb={2}>
                <KPanel title="Targets" content={this.renderTargets()} />
              </Box>

              <Box mb={2}>
                <KPanel
                  title="Rules"
                  content={
                    <Box p={2}>
                      <Caption>
                        Set specific rules for this ingress. Only requests that match these conditions will be accepted.
                      </Caption>

                      <RenderHttpRouteConditions conditions={values.conditions} />
                    </Box>
                  }
                />
              </Box>

              <Button id="add-route-submit-button" type="submit" color="primary" variant="contained">
                {isEdit ? "Update" : "Create"} Route
              </Button>
            </Grid>
          </Grid>
        </Form>
      </div>
    );
  }
}

// use connect twice
// The one inside reduxForm is normal usage
// The one outside of reduxForm is to set tutorialState props for the form

// const form = reduxForm<HttpRouteForm, TutorialStateProps & OwnProps>({
//   onSubmitFail: console.log,
//   form: ROUTE_FORM_ID,
//   enableReinitialize: true,
//   initialValues: newEmptyRouteForm(),
//   touchOnChange: true,
//   shouldError: shouldError,
//   validate: formValidateOrNotBlockByTutorial,
// })(connect(mapStateToProps)(withStyles(styles)(RouteFormRaw)));

// export const RouteForm = connect((state: RootState) => ({
//   tutorialState: state.get("tutorial"),
// }))(form);

const connectedForm = connect(mapStateToProps)(withStyles(styles)(RouteFormRaw));

export const RouteForm = withFormik<OwnProps, HttpRouteForm>({
  mapPropsToValues: (props) => {
    return props.initial;
  },
  enableReinitialize: true,
  validate: (values: HttpRouteForm) => {
    let errors = {};
    return errors;
  },
  handleSubmit: async (formValues, { props: { onSubmit } }) => {
    await onSubmit(formValues);
  },
})(connectedForm);
