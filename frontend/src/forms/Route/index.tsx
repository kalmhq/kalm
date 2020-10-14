import { Box, Collapse, Grid, Link } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import { Alert, AlertTitle } from "@material-ui/lab";
import { setSuccessNotificationAction } from "actions/notification";
import copy from "copy-to-clipboard";
import arrayMutators from "final-form-arrays";
import { AutoCompleteMultipleValue, AutoCompleteMultiValuesFreeSolo } from "forms/Final/autoComplete";
import { FinalBoolCheckboxRender, FinalCheckboxGroupRender } from "forms/Final/checkbox";
import { FinalRadioGroupRender } from "forms/Final/radio";
import { FinalTextField } from "forms/Final/textfield";
import { FormDataPreview } from "forms/Final/util";
import { ROUTE_FORM_ID } from "forms/formIDs";
import { NormalizePositiveNumber, stringArrayTrimAndToLowerCaseParse, stringArrayTrimParse } from "forms/normalizer";
import { RenderHttpRouteDestinations } from "forms/Route/destinations";
import { ValidatorArrayNotEmpty, ValidatorArrayOfPath, ValidatorIpAndHosts } from "forms/validator";
import routesGif from "images/routes.gif";
import React from "react";
import { Field, FieldRenderProps, Form, FormRenderProps } from "react-final-form";
import { FieldArray, FieldArrayRenderProps } from "react-final-form-arrays";
import { connect } from "react-redux";
import { Link as RouteLink } from "react-router-dom";
import { RootState } from "reducers";
import { FormTutorialHelper } from "tutorials/formValueToReudxStoreListener";
import { finalValidateOrNotBlockByTutorial } from "tutorials/utils";
import { TDispatchProp } from "types";
import { httpMethods, HttpRoute, methodsModeAll, methodsModeSpecific } from "types/route";
import { isArray } from "util";
import { arraysMatch } from "utils";
import { includesForceHttpsDomain } from "utils/domain";
import { default as sc, default as stringConstants } from "utils/stringConstants";
import { SubmitButton } from "widgets/Button";
import { CollapseWrapper } from "widgets/CollapseWrapper";
import DomainStatus from "widgets/DomainStatus";
import { Expansion } from "widgets/expansion";
import { KPanel } from "widgets/KPanel";
import { Caption } from "widgets/Label";
import { Prompt } from "widgets/Prompt";
import { RenderHttpRouteConditions } from "./conditions";

const mapStateToProps = (state: RootState) => {
  const certifications = state.certificates.certificates;
  const domains: Set<string> = new Set();

  certifications.forEach((x) => {
    x.domains.filter((x) => x !== "*").forEach((domain) => domains.add(domain));
  });

  return {
    tutorialState: state.tutorial,
    domains: Array.from(domains),
    ingressIP: state.cluster.info.ingressIP,
    certifications,
    form: ROUTE_FORM_ID,
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
  initial: HttpRoute;
}

export interface ConnectedProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export interface Props extends ConnectedProps, OwnProps, WithStyles<typeof styles> {}

interface State {
  isAdvancedPartUnfolded: boolean;
  isValidCertificationUnfolded: boolean;
}

class RouteFormRaw extends React.PureComponent<Props, State> {
  private schemaOptions = [
    {
      value: "http",
      label: "http",
    },
    {
      value: "https",
      label: "https",
      htmlColor: "#9CCC65",
    },
  ];

  constructor(props: Props) {
    super(props);
    this.state = {
      isAdvancedPartUnfolded: false,
      isValidCertificationUnfolded: false,
    };
  }

  private canCertDomainsSuiteForHost = (domains: string[], host: string) => {
    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i]!;
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

  private renderCertificationStatus(values: HttpRoute) {
    const { certifications } = this.props;
    const { isValidCertificationUnfolded } = this.state;
    const { hosts } = values;

    if (hosts.length === 0) {
      return null;
    }

    let hostCertResults: any[] = [];

    hosts.forEach((host) => {
      const cert = certifications.find((c) => this.canCertDomainsSuiteForHost(c.domains, host));

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
                  <strong>{cert.name}</strong>
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
    // const { destinations } = values;

    return (
      <Box p={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={12}>
            <RenderHttpRouteDestinations />
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

  private validate = (values: HttpRoute) => {
    const { form, tutorialState } = this.props;
    let errors: any = {};
    const { methods, methodsMode, schemes } = values;
    if (methodsMode === methodsModeSpecific) {
      errors.methods = ValidatorArrayNotEmpty(methods);
    }
    errors.schemes = ValidatorArrayNotEmpty(schemes);
    return Object.keys(errors).length > 0 ? errors : finalValidateOrNotBlockByTutorial(values, tutorialState, form);
  };

  public render() {
    const { classes, ingressIP, isEdit, initial, onSubmit, form, dispatch } = this.props;
    return (
      <div className={classes.root}>
        <Form
          onSubmit={onSubmit}
          initialValues={initial}
          keepDirtyOnReinitialize
          validate={this.validate}
          mutators={{
            ...arrayMutators,
          }}
          render={({ values, errors, handleSubmit, form: { change } }: FormRenderProps<HttpRoute>) => {
            const { hosts, methodsMode, schemes, httpRedirectToHttps } = values;
            const hstsDomains = includesForceHttpsDomain(hosts);
            const icons = hosts.map((host, index) => {
              if (isArray(errors.hosts) && errors.hosts[index]) {
                return undefined;
              } else {
                return <DomainStatus domain={host} />;
              }
            });
            const methodOptions = httpMethods.map((m) => ({ value: m, label: m }));

            if (!schemes.includes("https")) {
              if (hstsDomains.length > 0) {
                if (schemes.includes("http")) {
                  change("schemes", ["http", "https"]);
                } else {
                  change("schemes", ["https"]);
                }
              }
            }
            // set httpRedirectToHttps to false if http or https is not in schemes
            if (!(schemes.includes("http") && schemes.includes("https")) && httpRedirectToHttps) {
              change("httpRedirectToHttps", false);
            }

            return (
              <form onSubmit={handleSubmit} id="route-form">
                <FormTutorialHelper form={form} />
                <Prompt />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box mb={2}>
                      <KPanel
                        title="Hosts and paths"
                        content={
                          <Box p={2}>
                            <Field
                              id="route-hosts"
                              render={(props: FieldRenderProps<string[]>) => (
                                <AutoCompleteMultiValuesFreeSolo<string> {...props} options={[]} />
                              )}
                              icons={icons}
                              label="Hosts"
                              name="hosts"
                              validate={ValidatorIpAndHosts}
                              parse={stringArrayTrimAndToLowerCaseParse}
                              placeholder="e.g. www.example.com"
                              helperText={
                                <Caption color="textSecondary">
                                  Your cluster ip is{" "}
                                  <Link
                                    href="#"
                                    onClick={() => {
                                      copy(ingressIP);
                                      dispatch(setSuccessNotificationAction("Copied successful!"));
                                    }}
                                  >
                                    {ingressIP || ""}
                                  </Link>
                                  . {sc.ROUTE_HOSTS_INPUT_HELPER}
                                </Caption>
                              }
                            />
                            <Field
                              render={(props: FieldRenderProps<string[]>) => (
                                <AutoCompleteMultiValuesFreeSolo<string> {...props} options={[]} />
                              )}
                              label="Path Prefixes"
                              name="paths"
                              validate={ValidatorArrayOfPath}
                              parse={stringArrayTrimParse}
                              placeholder="e.g. /api/v1; /blogs; /assets"
                              helperText={sc.ROUTE_PATHS_INPUT_HELPER}
                            />
                            <Field
                              type="checkbox"
                              component={FinalBoolCheckboxRender}
                              name="stripPath"
                              label={sc.ROUTE_STRIP_PATH_LABEL}
                              helperText={sc.ROUTE_STRIP_PATH_HELPER}
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
                            <Field
                              title="Http Methods"
                              name="methodsMode"
                              component={FinalRadioGroupRender}
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
                              <FieldArray
                                render={(props: FieldArrayRenderProps<string, any>) => {
                                  return <FinalCheckboxGroupRender {...props} options={methodOptions} />;
                                }}
                                name="methods"
                              />
                            </Collapse>
                            <FieldArray
                              render={(props: FieldArrayRenderProps<string, any>) => {
                                return (
                                  <FinalCheckboxGroupRender
                                    {...props}
                                    title="Allow traffic through"
                                    options={this.schemaOptions}
                                  />
                                );
                              }}
                              name="schemes"
                            />
                            <Collapse
                              in={
                                values.schemes &&
                                values.schemes.indexOf("http") > -1 &&
                                values.schemes.indexOf("https") > -1
                              }
                            >
                              <Field
                                component={FinalBoolCheckboxRender}
                                name="httpRedirectToHttps"
                                type="checkbox"
                                label={
                                  <span>
                                    Redirect all <strong>http</strong> request to <strong>https</strong> with 301 status
                                    code.
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
                              {this.renderCertificationStatus(values)}
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
                              Set specific rules for this ingress. Only requests that match these conditions will be
                              accepted.
                            </Caption>

                            <RenderHttpRouteConditions />
                          </Box>
                        }
                      />
                    </Box>

                    <Box mb={2}>
                      <Expansion title="Cors" defaultUnfold={false}>
                        <Box p={2}>
                          {" "}
                          <Box mb={2}>
                            <Field
                              render={(props: FieldRenderProps<string[]>) => (
                                <AutoCompleteMultiValuesFreeSolo<string> {...props} options={[]} />
                              )}
                              parse={stringArrayTrimAndToLowerCaseParse}
                              placeholder="e.g. *; http://example.com"
                              name="cors.allowOrigins"
                              label="Allow Origins"
                            />
                          </Box>
                          <Box mb={2}>
                            <Field
                              render={(props: FieldRenderProps<string[]>) => (
                                <AutoCompleteMultipleValue {...props} options={httpMethods} />
                              )}
                              placeholder={`e.g. ${httpMethods.join("; ")}`}
                              name="cors.allowMethods"
                              label="Allow Methods"
                            />
                          </Box>
                          <Box mb={2}>
                            <Field
                              render={(props: FieldRenderProps<string[]>) => (
                                <AutoCompleteMultiValuesFreeSolo<string> {...props} options={[]} />
                              )}
                              parse={stringArrayTrimAndToLowerCaseParse}
                              placeholder="e.g. Custom-Header-Name"
                              name="cors.allowHeaders"
                              label="Allow Headers"
                            />
                          </Box>
                          <Box mb={2}>
                            <Field
                              name="cors.allowCredentials"
                              type="checkbox"
                              component={FinalBoolCheckboxRender}
                              label="Allow Credentials"
                            />
                          </Box>
                          <Box mb={2}>
                            <Field<number | undefined>
                              component={FinalTextField}
                              parse={NormalizePositiveNumber}
                              name={`cors.maxAgeSeconds`}
                              label="Max Age Seconds"
                              placeholder="e.g. 86400"
                            />
                          </Box>
                        </Box>
                      </Expansion>
                    </Box>

                    <SubmitButton id="add-route-submit-button">{isEdit ? "Update" : "Create"} Route</SubmitButton>
                  </Grid>
                </Grid>
                <FormDataPreview />
              </form>
            );
          }}
        />
      </div>
    );
  }
}

export const RouteForm = connect(mapStateToProps)(withStyles(styles)(RouteFormRaw));
