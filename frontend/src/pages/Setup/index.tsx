import Box from "@material-ui/core/Box";
import Step from "@material-ui/core/Step";
import StepContent from "@material-ui/core/StepContent";
import StepLabel from "@material-ui/core/StepLabel";
import Stepper from "@material-ui/core/Stepper";
import { Alert } from "@material-ui/lab";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { api } from "api";
import copy from "copy-to-clipboard";
import { withCerts, WithCertsProps } from "hoc/withCerts";
import { withClusterInfo, WithClusterInfoProps } from "hoc/withClusterInfo";
import { withComponents, WithComponentsProps } from "hoc/withComponents";
import { withRoutesData, WithRoutesDataProps } from "hoc/withRoutesData";
import { BasePage } from "pages/BasePage";
import React from "react";
import { Field, Form, FormRenderProps, FormSpy } from "react-final-form";
import { InitializeClusterResponse } from "types/cluster";
import { PendingBadge, SuccessBadge } from "widgets/Badge";
import { BlankTargetLink } from "widgets/BlankTargetLink";
import { CustomizedButton, DangerButton, SubmitButton } from "widgets/Button";
import { CopyIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { KPanel } from "widgets/KPanel";
import { Body, H5 } from "widgets/Label";
import { KMLink } from "widgets/Link";
import { Loading } from "widgets/Loading";
import { FinalTextField } from "../../forms//Final/textfield";

interface SetupFormType {
  domain: string;
}

type RenderProps = FormRenderProps<SetupFormType>;

interface Props extends WithClusterInfoProps, WithRoutesDataProps, WithCertsProps, WithComponentsProps {}

interface State {
  activeStep: number;
  showDNSWarning: boolean;
  ignoreDNSResult: boolean;
  kalmCertReady: boolean;
  kalmRouteReady: boolean;
  KalmDexReady: boolean;
  KalmAuthProxyReady: boolean;
  initializeResponse?: InitializeClusterResponse;
}

const initialValues = { domain: "" };

const dnsCheckError = "DNS check failed";

class SetupPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      activeStep: 0,
      showDNSWarning: false,
      ignoreDNSResult: false,
      kalmCertReady: false,
      kalmRouteReady: false,
      KalmDexReady: false,
      KalmAuthProxyReady: false,
    };
  }

  private validate = async (values: any) => {
    const { clusterInfo } = this.props;
    const { ignoreDNSResult } = this.state;

    let errors: { domain?: string } = {};

    if (!values.domain || values?.domain.length === 0) {
      errors.domain = "Required";
      return errors;
    }

    if (!ignoreDNSResult) {
      try {
        const result = await api.resolveDomain(values.domain, "A");
        if (result.length <= 0 || result.indexOf(clusterInfo.ingressIP) < 0) {
          this.setState({ showDNSWarning: true });
          errors.domain = dnsCheckError;
          return errors;
        }
      } catch (e) {
        this.setState({ showDNSWarning: true });

        errors.domain = dnsCheckError;
        return errors;
      }
    }

    return errors;
  };

  private submit = async (values: { domain: string }) => {
    const { dispatch } = this.props;
    const errors = await this.validate(values);
    if (errors.domain) {
      return errors;
    }
    try {
      const res = await api.initializeCluster(values.domain);
      this.setState({
        activeStep: 1,

        // If it's not production. We don't need to wait cert to be ready
        kalmCertReady: !res.clusterInfo.isProduction,
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
    const cert = props.certs.find((x) => x.name === "kalm-cert");
    return !!cert && cert.ready === "True";
  };

  private isKalmCertChangedToReady = (prevProps: Props) => {
    return this.getKalmCertReady(this.props) && !this.getKalmCertReady(prevProps);
  };

  private getKalmSystemComponentReady = (props: Props, componentName: string): boolean => {
    const { componentsMap } = props;

    const components = componentsMap["kalm-system"];
    if (!components || components.length === 0) return false;

    const component = components.find((x) => x.name === componentName);

    if (!component) return false;

    return !!component.pods.find((x) => x.phase === "Running" && x.status === "Running");
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
    return !!props.httpRoutes.find((x) => x.name === "kalm-route");
  };

  private isKalmRouteChangedToReady = (prevProps: Props) => {
    return this.getKalmRouteReady(this.props) && !this.getKalmRouteReady(prevProps);
  };

  private renderStep0Hint = () => {
    const { clusterInfo } = this.props;

    if (clusterInfo.ingressIP !== "") {
      return (
        <Box>
          Please enter your domain name and configure this domain name with an <strong>A record</strong> that points to
          your cluster load balancer IP{" "}
          <Box display="inline-block" style={{ verticalAlign: "bottom" }}>
            <H5>
              <strong>{clusterInfo.ingressIP}</strong>
            </H5>
          </Box>
          . After completing this configuration you will be able to access the Kalm dashboard from this domain.
        </Box>
      );
    } else if (clusterInfo.ingressHostname !== "") {
      return (
        <Box>
          Please enter your domain name and configure this domain name with a <strong>CNAME record</strong> that points
          to your cluster load balancer hostname{" "}
          <Box display="inline-block" style={{ verticalAlign: "bottom" }}>
            <H5>
              <strong>{clusterInfo.ingressHostname}</strong>
            </H5>
          </Box>
          . After completing this configuration you will be able to access the Kalm dashboard from this domain.
        </Box>
      );
    } else {
      return (
        <Box>
          <Alert severity="warning">
            <Box>
              {" "}
              Kalm is unable to retrieve your cluster ip or host name. Please check the status of your load balancer. If
              you are using minikube, please check{" "}
              <BlankTargetLink href="https://docs.kalm.dev/guide-minikube#step-2-start-a-minikube-cluster">
                this doc
              </BlankTargetLink>
              .
            </Box>
          </Alert>
        </Box>
      );
    }
  };

  private renderStep0 = () => {
    const { showDNSWarning } = this.state;
    return (
      <Box>
        {this.renderStep0Hint()}
        <Box mt={2}>
          <Form
            debug={process.env.REACT_APP_DEBUG === "true" ? console.log : undefined}
            initialValues={initialValues}
            subscription={{ submitting: true, pristine: true, errors: true, touched: true }}
            onSubmit={this.submit}
            keepDirtyOnReinitialize={true}
            render={({ handleSubmit, submitting }: RenderProps) => (
              <form onSubmit={handleSubmit}>
                <FormSpy subscription={{ values: true, submitErrors: true, errors: true, touched: true }}>
                  {({ submitErrors }) => {
                    return (
                      <Field
                        name="domain"
                        label="Domain"
                        error={submitErrors?.domain && submitErrors?.domain !== dnsCheckError ? true : false}
                        size="small"
                        variant="outlined"
                        fullWidth
                        placeholder="e.g. mydomain.org kalm.mydomain.com"
                        component={FinalTextField}
                        helperText={
                          submitErrors?.domain && submitErrors?.domain !== dnsCheckError ? submitErrors.domain : ""
                        }
                      />
                    );
                  }}
                </FormSpy>
                <FormSpy subscription={{ values: true, errors: true, touched: true }}>
                  {() => {
                    return (
                      showDNSWarning && (
                        <Box mt={2}>
                          <Alert severity="warning">
                            DNS check failed. After the DNS record is modified, it may take some time to take effect.{" "}
                            <br />
                            If your load balancer is behind another proxy (such as cloudflare), your DNS records will
                            not resolve to the address of the load balancer. In this case, you can ignore this warning
                            and continue.
                          </Alert>
                        </Box>
                      )
                    );
                  }}
                </FormSpy>
                <Box mt={2}>
                  <Box display={"inline-block"} mr={2}>
                    <SubmitButton
                      onClick={async () => {
                        await this.setState({ ignoreDNSResult: false });
                        handleSubmit();
                      }}
                    >
                      Check and continue
                    </SubmitButton>
                  </Box>
                  {showDNSWarning && (
                    <Box display={"inline-block"} mr={2}>
                      <CustomizedButton
                        variant="contained"
                        color="default"
                        disabled={submitting}
                        pending={submitting}
                        onClick={async () => {
                          await this.setState({ ignoreDNSResult: true });
                          handleSubmit();
                        }}
                      >
                        Continue anyway
                      </CustomizedButton>
                    </Box>
                  )}
                  {process.env.REACT_APP_DEBUG === "true" ? (
                    <FormSpy subscription={{ values: true }}>
                      {({ values }: { values: SetupFormType }) => {
                        return (
                          <pre style={{ maxWidth: 1500, background: "#eee" }}>
                            {JSON.stringify(values, undefined, 2)}
                          </pre>
                        );
                      }}
                    </FormSpy>
                  ) : null}
                </Box>
              </form>
            )}
          />
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
            <SuccessBadge text={"Kalm routing configured successfully."} />
          ) : (
            <PendingBadge text={"Configuring Kalm routing ...."} />
          )}
        </Box>
        <Box mt={1}>
          {kalmCertReady ? (
            <SuccessBadge text={"Certificate issued successfully."} />
          ) : (
            <PendingBadge text={"Applying https certificate for your domain ...."} />
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

    const temporaryAdmin = initializeResponse!.temporaryAdmin;
    const clusterInfo = initializeResponse!.clusterInfo;

    const email = temporaryAdmin.email;
    const password = temporaryAdmin.password;
    const scheme = clusterInfo.isProduction ? "https" : "http";
    const domain = initializeResponse!.sso.domain;

    const url = `${scheme}://${domain}`;

    return (
      <Box>
        Your kalm dashboard can now be accessed from: <BlankTargetLink href={url}>{url}</BlankTargetLink>. <br />A
        temporary administrator email (which can only be used to login) and password have been generated for you. You
        will not be able to see this account through the dashboard again. Please save this account information safely.
        <Box mt={2} mb={2}>
          <KPanel>
            <Box p={2}>
              <pre>{`Email: ${email}
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
  private canReset = () => {
    if (window.location.hostname === "localhost") {
      return true;
    }
    return false;
  };

  public render() {
    const { clusterInfo, isClusterInfoLoaded, isClusterInfoLoading, dispatch } = this.props;

    if (!isClusterInfoLoaded && isClusterInfoLoading) {
      return (
        <Box p={2}>
          <Loading />
        </Box>
      );
    }

    if (!clusterInfo.canBeInitialized) {
      if (!this.canReset()) {
        const cmd = `kubectl port-forward -n kalm-system $(kubectl get pod -n kalm-system -l app=kalm -o=jsonpath="{.items[0].metadata.name}" ) 3010:3010`;

        return (
          <BasePage>
            <Box p={2}>
              <Alert severity="error">
                You cannot reconfigure Kalm in domain access mode
                <Box pt={1}>
                  please run following command in terminal and open{" "}
                  <KMLink href="http://localhost:3010/" rel="noopener noreferrer" target="_blank">
                    http://localhost:3010/
                  </KMLink>{" "}
                  to continue setup.
                </Box>
              </Alert>
            </Box>
            <Box pl={3} pt={1}>
              <pre>
                {cmd}
                <Box ml={2} mt={0} display="inline-block">
                  <IconButtonWithTooltip
                    tooltipTitle="Copy"
                    size="small"
                    aria-label="copy"
                    onClick={() => {
                      copy(cmd);
                      dispatch(setSuccessNotificationAction("Copied successful!"));
                    }}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButtonWithTooltip>
                </Box>
              </pre>
            </Box>
          </BasePage>
        );
      }
      return (
        <Box p={2}>
          Your cluster has been initialized already.
          <Box mt={2}>
            If you want to reset kalm, you can reset the initialization process.
            <Box pt={2}>
              <Alert severity="warning">
                Note that reconfigurion will affect your Kalm's following configuration:
                <Box pl={2} pt={2}>
                  Single Sign-on will be reset
                </Box>
                <Box pl={2} pt={0}>
                  Kalm's instance's domain may be changed
                </Box>
                <Box pl={2} pt={0}>
                  Current Kalm's certificate will be deleted
                </Box>
                <Box pl={2} pt={2}>
                  All applications will safe in any way.
                </Box>
              </Alert>
            </Box>
          </Box>
          <Box mt={2}>
            <DangerButton onClick={this.reset}>Re-configure</DangerButton>
          </Box>
        </Box>
      );
    }

    const { activeStep } = this.state;

    return (
      <BasePage>
        <Box p={2} key="page">
          <KPanel>
            <Box p={2}>
              <H5>Congratulations! You have successfully deployed Kalm. Last few steps.</H5>
              <Box mt={2}>
                <Body>
                  Your cluster is currently not accessible from outside of your localhost, and can only be used by
                  yourself through port-forwarding. Don't worry, complete the following steps to setup Kalm on a
                  publicly accessible domain so you can use Kalm conveniently with your colleagues.
                </Body>
              </Box>

              <Stepper activeStep={activeStep} orientation="vertical">
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
          </KPanel>
        </Box>
      </BasePage>
    );
  }
}

export const SetupPage = withComponents(withCerts(withRoutesData(withClusterInfo(SetupPageRaw))));
