import React from "react";
import { BasePage } from "pages/BasePage";
import Box from "@material-ui/core/Box";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import StepContent from "@material-ui/core/StepContent";
import { KPanel } from "widgets/KPanel";
import { Body, H5 } from "widgets/Label";
import { CustomizedButton, DangerButton } from "widgets/Button";
import TextField from "@material-ui/core/TextField";
import { Formik } from "formik";
import { api } from "api";
import { withClusterInfo, WithClusterInfoProps } from "hoc/withClusterInfo";
import { PendingBadge, SuccessBadge } from "widgets/Badge";
import { BlankTargetLink } from "widgets/BlankTargetLink";
import { Loading } from "widgets/Loading";
import { setErrorNotificationAction } from "actions/notification";
import { withRoutesData, WithRoutesDataProps } from "hoc/withRoutesData";
import { withCerts, WithCertsProps } from "hoc/withCerts";
import { withComponents, WithComponentsProps } from "hoc/withComponents";
import { InitializeClusterResponse } from "types/cluster";

interface Props extends WithClusterInfoProps, WithRoutesDataProps, WithCertsProps, WithComponentsProps {}

interface State {
  activeStep: number;
  kalmCertReady: boolean;
  kalmRouteReady: boolean;
  KalmDexReady: boolean;
  KalmAuthProxyReady: boolean;
  initializeResponse?: InitializeClusterResponse;
}

class SetupPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      activeStep: 0,
      kalmCertReady: false,
      kalmRouteReady: false,
      KalmDexReady: false,
      KalmAuthProxyReady: false,
    };
  }

  private submit = async (values: { domain: string }) => {
    const { dispatch } = this.props;

    try {
      const res = await api.initializeCluster(values.domain);
      this.setState({
        activeStep: 1,

        // If it's not production. We don't need to wait cert to be ready
        kalmCertReady: !res.get("clusterInfo").get("isProduction"),
        initializeResponse: res,
      });
    } catch (e) {
      dispatch(setErrorNotificationAction(e.toString()));
    }
  };

  public componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
    const { kalmCertReady, kalmRouteReady, KalmDexReady, KalmAuthProxyReady } = this.state;

    if (!kalmCertReady && this.isKalmCertChangedToReady(prevProps)) {
      this.setState({
        kalmCertReady: true,
      });
    }

    if (!kalmRouteReady && this.isKalmRouteChangedToReady(prevProps)) {
      this.setState({
        kalmRouteReady: true,
      });
    }

    if (!KalmDexReady && this.isKalmDexChangedToReady(prevProps)) {
      this.setState({
        KalmDexReady: true,
      });
    }

    if (!KalmAuthProxyReady && this.isKalmAuthProxyChangedToReady(prevProps)) {
      this.setState({
        KalmAuthProxyReady: true,
      });
    }
  }

  private getKalmCertReady = (props: Props): boolean => {
    const cert = props.certs.find((x) => x.get("name") === "kalm-cert");
    return !!cert && cert.get("ready") === "True";
  };

  private isKalmCertChangedToReady = (prevProps: Props) => {
    return this.getKalmCertReady(this.props) && !this.getKalmCertReady(prevProps);
  };

  private getKalmSystemComponentReady = (props: Props, componentName: string): boolean => {
    const { componentsMap } = props;

    const components = componentsMap.get("kalm-system");
    if (!components || components.size === 0) return false;

    const component = components.find((x) => x.get("name") === componentName);

    if (!component) return false;

    return !!component.get("pods").find((x) => x.get("phase") === "Running" && x.get("status") === "Running");
  };

  private isKalmDexChangedToReady = (prevProps: Props) => {
    return this.getKalmSystemComponentReady(this.props, "dex") && !this.getKalmSystemComponentReady(prevProps, "dex");
  };

  private isKalmAuthProxyChangedToReady = (prevProps: Props) => {
    return (
      this.getKalmSystemComponentReady(this.props, "auth-proxy") &&
      !this.getKalmSystemComponentReady(prevProps, "auth-proxy")
    );
  };

  private getKalmRouteReady = (props: Props): boolean => {
    return !!props.httpRoutes.find((x) => x.get("name") === "kalm-route");
  };

  private isKalmRouteChangedToReady = (prevProps: Props) => {
    return this.getKalmRouteReady(this.props) && !this.getKalmRouteReady(prevProps);
  };

  private renderStep0 = () => {
    const { clusterInfo } = this.props;
    return (
      <Box>
        Please enter your domain name, and configure this domain name an <strong>A record</strong> that points to your
        cluster load balancer IP{" "}
        <Box display="inline-block" style={{ verticalAlign: "bottom" }}>
          <H5>
            <strong>{clusterInfo.get("ingressIP")}</strong>
          </H5>
        </Box>
        . This domain name will be your address to access the kalm dashboard in the future.
        <Box mt={2} width={400}>
          <Formik
            initialValues={{ domain: "" }}
            validate={async (values) => {
              let errors: { domain?: string } = {};

              if (!values.domain) {
                errors.domain = "Required";
              } else {
                const result = await api.resolveDomain(values.domain, "A");
                if (result.length <= 0 || result.indexOf(clusterInfo.get("ingressIP")) < 0) {
                  errors.domain =
                    "DNS check failed. After the DNS record is modified, it takes some time to take effect. Please try again later";
                }
              }
              return errors;
            }}
            validateOnChange={false}
            validateOnBlur={false}
            onSubmit={this.submit}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  error={!!errors.domain && touched.domain}
                  label="Domain"
                  variant="outlined"
                  size="small"
                  name="domain"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.domain}
                  InputLabelProps={{ shrink: true }}
                  placeholder="e.g. mydomain.org kalm.mydomain.com"
                  helperText={errors.domain && touched.domain && errors.domain}
                />

                <Box mt={2}>
                  <CustomizedButton
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={isSubmitting}
                    pending={isSubmitting}
                  >
                    Check and continue
                  </CustomizedButton>
                </Box>
              </form>
            )}
          </Formik>
        </Box>
      </Box>
    );
  };

  private renderStep1 = () => {
    const { kalmCertReady, kalmRouteReady, KalmDexReady, KalmAuthProxyReady } = this.state;
    const canMoveToNext = kalmCertReady && kalmRouteReady && KalmDexReady && KalmAuthProxyReady;

    return (
      <Box>
        <Box mt={1}>
          {kalmRouteReady ? (
            <SuccessBadge text={"Kalm route is configured successfully."} />
          ) : (
            <PendingBadge text={"Configuring kalm routing ...."} />
          )}
        </Box>
        <Box mt={1}>
          {kalmCertReady ? (
            <SuccessBadge text={"Certificate of domain is issued."} />
          ) : (
            <PendingBadge text={"Applying https certificate for domain ...."} />
          )}
        </Box>
        <Box mt={1}>
          {KalmAuthProxyReady ? (
            <SuccessBadge text={"Kalm Auth Proxy (SSO Component) is Running."} />
          ) : (
            <PendingBadge text={"Starting Kalm Auth Proxy (SSO Component) ...."} />
          )}
        </Box>
        <Box mt={1}>
          {KalmDexReady ? (
            <SuccessBadge text={"Kalm Dex (SSO Component) is Running."} />
          ) : (
            <PendingBadge text={"Starting Kalm Dex (SSO Component) ...."} />
          )}
        </Box>
        <Box mt={2}>
          <CustomizedButton
            variant="contained"
            color="primary"
            onClick={() => this.setState({ activeStep: 2 })}
            disabled={!canMoveToNext}
          >
            Next
          </CustomizedButton>
        </Box>
      </Box>
    );
  };

  private renderStep2 = () => {
    const { initializeResponse } = this.state;

    if (!initializeResponse) {
      return null;
    }

    const temporaryAdmin = initializeResponse!.get("temporaryAdmin");
    const clusterInfo = initializeResponse!.get("clusterInfo");

    const username = temporaryAdmin.get("username");
    const password = temporaryAdmin.get("password");
    const scheme = clusterInfo.get("isProduction") ? "https" : "http";
    const domain = initializeResponse!.get("sso").get("domain");

    const url = `${scheme}://${domain}`;

    return (
      <Box>
        Your kalm dashboard is ready to access from url <BlankTargetLink href={url}>{url}</BlankTargetLink>. <br />
        Temporary administrator username and password have been generated for you. You will not be able to get this
        account through the dashboard again. Please save this account safely.
        <Box mt={2} mb={2}>
          <KPanel>
            <Box p={2}>
              <pre>{`Username: ${username}
Password: ${password}`}</pre>
            </Box>
          </KPanel>
        </Box>
        Since this account does not have multi-factor authentication and the password has no expiration time, it is
        strongly recommended that you configure a more secure connector as the source of authentication in the Single
        Sign-on settings.
      </Box>
    );
  };

  private reset = async () => {
    const { dispatch } = this.props;

    try {
      await api.resetCluster();
      window.location.reload();
    } catch (e) {
      dispatch(setErrorNotificationAction(e.toString()));
    }
  };

  public render() {
    const { clusterInfo, isClusterInfoLoaded, isClusterInfoLoading } = this.props;

    if (!isClusterInfoLoaded && isClusterInfoLoading) {
      return (
        <Box p={2}>
          <Loading />
        </Box>
      );
    }

    if (!clusterInfo.get("canBeInitialized")) {
      return (
        <Box p={2}>
          Your cluster has been initialized already.
          <Box mt={2}>
            If your cluster is not initialized properly, you can reset the initialization process. Note that your kalm
            Single Sign-on configuration, kalm's own routing, and kalm's own certificate will be deleted. The remaining
            applications will not be affected in any way.
          </Box>{" "}
          <Box mt={2}>
            <DangerButton onClick={this.reset}>Re-configure</DangerButton>
          </Box>{" "}
        </Box>
      );
    }

    const { activeStep } = this.state;

    return (
      <BasePage>
        <Box p={2}>
          <Stepper
            activeStep={activeStep}
            orientation="vertical"
            component={(props) => (
              <KPanel>
                <Box p={2}>
                  <H5>Congratulations! you have successfully deployed kalm. Last few steps.</H5>
                  <Box mt={2}>
                    <Body>
                      Your cluster is currently not accessible from outside, and can only be used by yourself through
                      port-forward. Don't worry, complete the following steps and you can use kalm conveniently with
                      your colleagues.
                    </Body>
                  </Box>
                  <Box mt={2}>{props.children}</Box>
                </Box>
              </KPanel>
            )}
          >
            <Step>
              <StepLabel>Domain Configuration</StepLabel>
              <StepContent>{this.renderStep0()}</StepContent>
            </Step>

            <Step>
              <StepLabel>Wait for the configuration to take effect</StepLabel>
              <StepContent>{this.renderStep1()}</StepContent>
            </Step>

            <Step>
              <StepLabel>Kalm is ready</StepLabel>
              <StepContent>{this.renderStep2()}</StepContent>
            </Step>
          </Stepper>
        </Box>
      </BasePage>
    );
  }
}

export const SetupPage = withComponents(withCerts(withRoutesData(withClusterInfo(SetupPageRaw))));
