import { Box, Collapse, Grid } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import { Alert, AlertTitle } from "@material-ui/lab";
import arrayMutators from "final-form-arrays";
import { AutoCompleteMultipleValue, AutoCompleteMultiValuesFreeSolo } from "forms/Final/autoComplete";
import { FinalBoolCheckboxRender, FinalCheckboxGroupRender } from "forms/Final/checkbox";
import { FinalRadioGroupRender } from "forms/Final/radio";
import { FinalTextField } from "forms/Final/textfield";
import { FormDataPreview } from "forms/Final/util";
import { ROUTE_FORM_ID } from "forms/formIDs";
import { NormalizePositiveNumber, stringArrayTrimAndToLowerCaseParse, stringArrayTrimParse } from "forms/normalizer";
import { RouteDomains } from "forms/Route/Domains";
import { TargetsPanel } from "forms/Route/targetsPanel";
import { ValidatorArrayNotEmpty, ValidatorArrayOfPath } from "forms/validator";
import routesGif from "images/routes.gif";
import React from "react";
import { Field, FieldRenderProps, Form, FormRenderProps } from "react-final-form";
import { FieldArray, FieldArrayRenderProps } from "react-final-form-arrays";
import { useSelector } from "react-redux";
import { Link as RouteLink } from "react-router-dom";
import { RootState } from "reducers";
import { FormTutorialHelper } from "tutorials/formValueToReduxStoreListener";
import { finalValidateOrNotBlockByTutorial } from "tutorials/utils";
import { httpMethods, HttpRoute, methodsModeAll, methodsModeSpecific } from "types/route";
import { arraysMatch } from "utils";
import { includesForceHttpsDomain } from "utils/domain";
import { default as sc, default as stringConstants } from "utils/stringConstants";
import { SubmitButton } from "widgets/Button";
import { CollapseWrapper } from "widgets/CollapseWrapper";
import { Expansion } from "widgets/expansion";
import { KPanel } from "widgets/KPanel";
import { Caption } from "widgets/Label";
import { Prompt } from "widgets/Prompt";
import { RenderHttpRouteConditions } from "./conditions";
interface RouteFormProps {
  isEditing?: boolean;
  onSubmit: any;
  initial: HttpRoute;
}

const schemaOptions = [
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

const RouteFormRaw: React.FC<RouteFormProps> = (props) => {
  const { isEditing, initial, onSubmit } = props;
  const { tutorialState, certificates } = useSelector((state: RootState) => {
    const certificates = state.certificates.certificates;

    return {
      tutorialState: state.tutorial,
      domains: state.domains.domains,
      certificates,
    };
  });

  const canCertDomainsSuiteForHost = (domains: string[], host: string) => {
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

  const renderCertificationStatus = (values: HttpRoute) => {
    const { hosts } = values;

    if (hosts.length === 0) {
      return null;
    }

    let missingCertsHosts: string[] = [];

    for (let host of hosts) {
      if (host === "") {
        continue;
      }

      const cert = certificates.find((c) => canCertDomainsSuiteForHost(c.domains, host));

      if (!cert) {
        missingCertsHosts.push(host);
      }
    }

    const missingCertsCount = missingCertsHosts.length;

    return (
      <Alert severity={missingCertsCount === 0 ? "success" : "warning"}>
        {missingCertsHosts.length > 0 ? (
          <AlertTitle>
            {missingCertsHosts.length} host{missingCertsHosts.length > 1 ? "s are" : " is"} missing valid SSL
            certificate signed by a certificate authority.
          </AlertTitle>
        ) : (
          <AlertTitle>All hosts have valid SSL certificates signed by a certificate authority.</AlertTitle>
        )}

        {missingCertsHosts.length > 0 ? (
          <>
            <Box marginBottom={1}>
              {missingCertsHosts.map((host) => {
                return (
                  <Box key={host} ml={2} fontWeight="bold">
                    {host}
                  </Box>
                );
              })}
            </Box>

            <Box marginBottom={1}>
              <Typography>
                Invalid SSL certificate / Intermediate certificates error could occur when you try to access this route.
                Go to <RouteLink to="/domains">domains & certificates</RouteLink> page, add your domain, then follow the
                instruction to apply an certificate.
              </Typography>
            </Box>
          </>
        ) : null}
      </Alert>
    );
  };

  const renderTargets = () => {
    return (
      <Box p={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={12}>
            <TargetsPanel />
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

  const validate = (values: HttpRoute) => {
    let errors: any = {};
    const { methods, methodsMode, schemes } = values;

    if (methodsMode === methodsModeSpecific) {
      errors.methods = ValidatorArrayNotEmpty(methods as any);
    }

    errors.schemes = ValidatorArrayNotEmpty(schemes as any);

    return Object.keys(errors).length > 0
      ? errors
      : finalValidateOrNotBlockByTutorial(values, tutorialState, ROUTE_FORM_ID);
  };

  //UX improvement: provide an intial target if there isn't one (this can probably be refactored)
  if (initial.destinations.length === 0) {
    initial.destinations.push({ weight: 1, host: "" });
  }
  return (
    <Form
      onSubmit={onSubmit}
      initialValues={initial}
      keepDirtyOnReinitialize
      validate={validate}
      mutators={{
        ...arrayMutators,
      }}
      render={({ values, handleSubmit, form: { change } }: FormRenderProps<HttpRoute>) => {
        const { hosts, methodsMode, schemes, httpRedirectToHttps } = values;

        const hstsDomains = includesForceHttpsDomain(hosts);
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
            <FormTutorialHelper form={ROUTE_FORM_ID} />
            <Prompt />
            <Box>
              <Grid container spacing={2}>
                <Grid item sm={6}>
                  <KPanel
                    title="Domains"
                    style={{ height: "100%" }}
                    content={
                      <Box p={2}>
                        <RouteDomains />
                      </Box>
                    }
                  />
                </Grid>
                <Grid item sm={6}>
                  <KPanel title="Targets" content={renderTargets()} />
                </Grid>
              </Grid>
            </Box>
            <Box mt={1}>
              <Grid container spacing={2}>
                <Grid item sm={6}>
                  <KPanel title="Schemes and Methods" style={{ height: "100%" }}>
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
                              options={schemaOptions}
                            />
                          );
                        }}
                        name="schemes"
                      />
                      <Collapse
                        in={
                          values.schemes && values.schemes.indexOf("http") > -1 && values.schemes.indexOf("https") > -1
                        }
                      >
                        <Field
                          component={FinalBoolCheckboxRender}
                          name="httpRedirectToHttps"
                          type="checkbox"
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
                        {renderCertificationStatus(values)}
                      </Collapse>
                    </Box>
                  </KPanel>
                </Grid>

                <Grid item sm={6}>
                  <KPanel
                    style={{ height: "100%" }}
                    title="Paths"
                    content={
                      <Box p={2}>
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
                </Grid>
              </Grid>
            </Box>
            <Box mt={2}>
              <KPanel title="Rules">
                <Box p={2}>
                  <Caption>
                    Set specific rules for this ingress. Only requests that match these conditions will be accepted.
                  </Caption>

                  <RenderHttpRouteConditions />
                </Box>
              </KPanel>
            </Box>
            <Box mt={2}>
              <Expansion title="Cors" defaultUnfold={false}>
                <Box p={2}>
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
            <Box mt={2}>
              <SubmitButton id="add-route-submit-button">{isEditing ? "Update" : "Create"} Route</SubmitButton>
            </Box>
            <FormDataPreview />
          </form>
        );
      }}
    />
  );
};

export const RouteForm = RouteFormRaw;
