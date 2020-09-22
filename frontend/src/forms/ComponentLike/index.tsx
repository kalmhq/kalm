import { Box, Button, createStyles, Divider, Grid, Link, Tab, Tabs, Theme } from "@material-ui/core";
import { withStyles, WithStyles } from "@material-ui/core/styles";
import HelpIcon from "@material-ui/icons/Help";
import { Alert } from "@material-ui/lab";
import { loadSimpleOptionsAction, loadStatefulSetOptionsAction } from "actions/persistentVolume";
import clsx from "clsx";
import { push } from "connected-react-router";
// import { Field, Field, FormikProps, getIn, withFormik } from "formik";
import { KTooltip } from "forms/Application/KTooltip";
import { Disks } from "forms/ComponentLike/Disks";
import { FinalSelectField } from "forms/Final/select";
import { FormikNormalizePositiveNumber } from "forms/normalizer";
import React from "react";
import { Field, Form, FormRenderProps } from "react-final-form";
import { connect } from "react-redux";
import { Link as RouteLink, RouteComponentProps, withRouter } from "react-router-dom";
import { TDispatchProp } from "types";
import {
  ComponentLike,
  workloadTypeCronjob,
  workloadTypeDaemonSet,
  workloadTypeServer,
  workloadTypeStatefulSet,
} from "types/componentTemplate";
import { PublicRegistriesList } from "types/registry";
import { sizeStringToMi, sizeStringToNumber } from "utils/sizeConv";
import sc from "utils/stringConstants";
import { CustomizedButton } from "widgets/Button";
import { KPanel } from "widgets/KPanel";
import { Subtitle1 } from "widgets/Label";
import { Prompt } from "widgets/Prompt";
import { SectionTitle } from "widgets/SectionTitle";
import { makeSelectOption } from "../Basic/select";
import { FinalTextField } from "../Final/textfield";
import { ValidatorCPU, ValidatorMemory, ValidatorName, ValidatorRequired, ValidatorSchedule } from "../validator";
import { Envs } from "./Envs";
import { Ports } from "./Ports";
import { PreInjectedFiles } from "./preInjectedFiles";
import { LivenessProbe, ReadinessProbe } from "./Probes";
import { ComponentAccess } from "./Access";
import Collapse from "@material-ui/core/Collapse";
import { RootState } from "reducers";
import { COMPONENT_FORM_ID } from "forms/formIDs";
import grey from "@material-ui/core/colors/grey";
import { COMPONENT_DEPLOY_BUTTON_ZINDEX } from "layout/Constants";

const IngressHint = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Link style={{ cursor: "pointer" }} onClick={() => setOpen(!open)}>
        {sc.PORT_ROUTE_QUESTION}
      </Link>
      <Box pt={1}>
        <Collapse in={open}>{sc.PORT_ROUTE_ANSWER}</Collapse>
      </Box>
    </>
  );
};

const Configurations = "Config";
const DisksTab = "Disks";
export const HealthTab = "Health";
export const NetworkingTab = "Networking";
const Scheduling = "Pod Scheduling";
const Deploy = "Deployment Strategy";
const Access = "Access";
const tabs = [Configurations, NetworkingTab, DisksTab, HealthTab, Scheduling, Deploy, Access];

const mapStateToProps = (state: RootState) => {
  const hash = window.location.hash;
  const anchor = hash.replace("#", "");
  let currentTabIndex = tabs.map((t) => t.replace(/\s/g, "")).indexOf(`${anchor}`);
  if (currentTabIndex < 0) {
    currentTabIndex = 0;
  }

  return {
    registries: state.registries.registries,
    tutorialState: state.tutorial,
    isSubmittingApplicationComponent: state.components.isSubmittingApplicationComponent,
    nodeLabels: state.nodes.labels,
    currentTabIndex,
    formId: COMPONENT_FORM_ID,
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      width: "100%",
      // since deploy button is fixed
      paddingBottom: 100,
      // backgroundColor: "#F4F5F7"
    },
    hasError: {
      color: `${theme.palette.error.main} !important`,
    },
    tabsRoot: {
      "& .MuiButtonBase-root": {
        minWidth: "auto",
      },
    },
    borderBottom: {
      borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
    },
    displayBlock: {
      display: "block",
    },
    displayNone: {
      display: "none",
    },
    textFieldHelperIcon: {
      color: grey[700],
      cursor: "pointer",
    },
    sectionTitleHelperIcon: {
      color: grey[700],
      cursor: "pointer",
      marginLeft: theme.spacing(1),
    },
    deployBtn: {
      width: 360,
      position: "fixed",
      zIndex: COMPONENT_DEPLOY_BUTTON_ZINDEX,
      bottom: theme.spacing(3),
    },
  });

/**
 * A Styled component representing helper text.
 */
const HelperTextSection: React.FC<{}> = ({ children }) => (
  <Grid item xs={8}>
    {children}
  </Grid>
);

interface RawProps {
  _initialValues: ComponentLike;
  onSubmit: (values: ComponentLike) => Promise<void>;
}

interface ConnectedProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export interface Props extends RouteComponentProps, WithStyles<typeof styles>, ConnectedProps, RawProps {}

interface State {}

type RenderProps = FormRenderProps<ComponentLike>;

const nameValidators = (value: any) => {
  return ValidatorRequired(value) || ValidatorName(value);
};

// TODO
// const validate = (values: ComponentLike) => {
//   let errors: any = {};
//   const ports = values.ports;
//   if (ports && ports.length > 0) {
//     const protocolServicePorts = new Set<string>();

//     for (let i = 0; i < ports.length; i++) {
//       const port = ports[i]!;
//       const servicePort = port.servicePort || port.containerPort;

//       if (servicePort) {
//         const protocol = port.protocol;
//         const protocolServicePort = protocol + "-" + servicePort;

//         if (!protocolServicePorts.has(protocolServicePort)) {
//           protocolServicePorts.add(protocolServicePort);
//         } else if (protocolServicePort !== "") {
//           errors.ports = "Listening port on a protocol should be unique.  " + protocol + " - " + servicePort;
//         }
//       }
//     }
//   }
//   return errors;
// };

class ComponentLikeFormRaw extends React.PureComponent<Props, State> {
  private tabs = tabs;

  private loadRequiredData() {
    const { dispatch } = this.props;
    // for volumes
    dispatch(loadSimpleOptionsAction());
    dispatch(loadStatefulSetOptionsAction());
  }

  componentDidMount() {
    this.loadRequiredData();
  }

  private renderReplicasOrSchedule = (workloadType?: string) => {
    if (workloadType === workloadTypeServer || workloadType === workloadTypeStatefulSet) {
      return (
        <Field
          component={FinalTextField}
          validate={ValidatorRequired}
          name="replicas"
          margin
          label="Replicas"
          helperText={sc.REPLICA_INPUT_HELPER}
          type="number"
          min="0"
          normalize={FormikNormalizePositiveNumber}
        />
      );
    }

    if (workloadType === workloadTypeCronjob) {
      return (
        <>
          <Field
            name="schedule"
            component={FinalTextField}
            placeholder="* * * * *"
            label="Cronjob Schedule"
            required
            validate={ValidatorSchedule}
            helperText={
              <span>
                <a href="https://en.wikipedia.org/wiki/Cron" target="_blank" rel="noopener noreferrer">
                  Cron
                </a>
                {" \n"}
                format string. You can create schedule expressions with{" "}
                <a href="https://crontab.guru/" target="_blank" rel="noopener noreferrer">
                  Crontab Guru
                </a>
                .
              </span>
            }
          />
        </>
      );
    }
  };

  private preInjectedFiles = () => {
    return (
      <>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Config Files</Subtitle1>
          </SectionTitle>
        </Grid>
        <Grid item xs={12}>
          <HelperTextSection>
            {sc.CONFIG_COMMAND_HELPER}
            <span>&nbsp;</span>
            <Link href="https://kalm.dev/docs/guide-config#adding-a-config-file" target="_blank">
              {sc.LEARN_MORE_LABEL}
            </Link>
          </HelperTextSection>
        </Grid>
        <Grid item xs={12}>
          <PreInjectedFiles />
        </Grid>
      </>
    );
  };

  private renderEnvs() {
    return (
      <>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Environment Variables</Subtitle1>
          </SectionTitle>
        </Grid>
        <Grid item xs={12}>
          <HelperTextSection>
            {sc.ENV_VAR_HELPER}
            <span>&nbsp;</span>
            <Link href="https://kalm.dev/docs/guide-config#environment-varibles" target="_blank">
              {sc.LEARN_MORE_LABEL}
            </Link>
          </HelperTextSection>
        </Grid>
        <Grid item xs={12}>
          <Envs />
        </Grid>
      </>
    );
  }

  public renderPorts() {
    return (
      <>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Ports</Subtitle1>
          </SectionTitle>
        </Grid>
        <HelperTextSection>{sc.PORTS_HELPER}</HelperTextSection>
        <Grid item xs={12}>
          <Ports />
        </Grid>
        <Grid item xs={12}>
          <IngressHint />
        </Grid>
      </>
    );
  }

  private renderDisks() {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Disks</Subtitle1>
          </SectionTitle>
        </Grid>
        <HelperTextSection>{sc.DISKS_HELPER}</HelperTextSection>
        <Grid item xs={12}>
          <Disks />
        </Grid>
      </Grid>
    );
  }

  private renderCommandAndArgs() {
    return (
      <>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Command</Subtitle1>
          </SectionTitle>
        </Grid>
        <Grid item xs={12}>
          <HelperTextSection>{sc.COMMAND_HELPER}</HelperTextSection>
        </Grid>
        <Grid item xs={12}>
          <Field component={FinalTextField} name="command" label="Command" placeholder={sc.COMMAND_INPUT_PLACEHOLDER} />
        </Grid>
      </>
    );
  }

  private renderConfigurations() {
    return (
      <Grid container spacing={2}>
        {this.renderCommandAndArgs()}
        {this.renderEnvs()}
        {this.preInjectedFiles()}
      </Grid>
    );
  }

  private renderHealth() {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Readiness Probe</Subtitle1>
          </SectionTitle>
        </Grid>
        <Grid item xs={8}>
          {sc.READINESS_PROBE_HELPER}
        </Grid>
        <Grid item xs={12}>
          <ReadinessProbe />
        </Grid>
        <Grid item xs={12}>
          <Divider orientation="horizontal" color="inherit" />
        </Grid>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Liveness Probe</Subtitle1>
          </SectionTitle>
        </Grid>
        <HelperTextSection>{sc.LIVENESS_PROBE_HELPER}</HelperTextSection>
        <Grid item xs={12}>
          <LivenessProbe />
        </Grid>
      </Grid>
    );
  }

  private renderNetworking() {
    return (
      <Grid container spacing={2}>
        {this.renderPorts()}
      </Grid>
    );
  }

  private getPodAffinityOptions() {
    return [
      {
        value: "PodAffinityTypePreferFanout",
        label: "Prefer Fanout",
        explain: "Deploy Pod average to Nodes.",
      },
      {
        value: "PodAffinityTypePreferGather",
        label: "Prefer Gather",
        explain: "Prefer deployment to Node that is already in use.",
      },
    ];
  }

  private renderScheduling() {
    const { classes } = this.props;
    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Resources</Subtitle1>
          </SectionTitle>
        </Grid>

        <Grid item xs={6}>
          <Field
            component={FinalTextField}
            name="cpuLimit"
            label="CPU Limit"
            validate={ValidatorCPU}
            placeholder={sc.CPU_INPUT_PLACEHOLDER}
            type="number"
            min="0"
            format={(value: any) => {
              return !value ? "" : (sizeStringToNumber(value) * 1000).toFixed();
            }}
            // TODO
            // parse={(value: any) => {
            //   const integerValue = parseInt(value, 10);
            //   if (!isNaN(integerValue) && integerValue < 0) {
            //     return 0;
            //   }
            //   return !value ? undefined : value + "m";
            // }}
            endAdornment={
              <KTooltip title={sc.CPU_INPUT_TOOLTIP}>
                <Box display="flex" alignItems="center">
                  <HelpIcon fontSize="small" className={classes.textFieldHelperIcon} />
                  <Box ml={0.5}>m</Box>
                </Box>
              </KTooltip>
            }
          />
        </Grid>

        <Grid item xs={6}>
          <Field
            component={FinalTextField}
            name="memoryLimit"
            label="Memory Limit"
            margin
            validate={ValidatorMemory}
            placeholder={sc.MEMORY_INPUT_PLACEHOLDER}
            type="number"
            min="0"
            format={(value: any) => {
              return !value ? "" : sizeStringToMi(value);
            }}
            // TODO
            // parse={(value: any) => {
            //   const integerValue = parseInt(value, 10);
            //   if (!isNaN(integerValue) && integerValue < 0) {
            //     return 0;
            //   }
            //   return !value ? undefined : value + "Mi";
            // }}
            endAdornment={
              <KTooltip title={sc.MEMORY_INPUT_TOOLTIP}>
                <Box display="flex" alignItems="center">
                  <HelpIcon fontSize="small" className={classes.textFieldHelperIcon} />
                  <Box ml={0.5}>Mi</Box>
                </Box>
              </KTooltip>
            }
          />
        </Grid>

        <Grid item xs={6}>
          <Field
            component={FinalTextField}
            name="cpuRequest"
            label="CPU Request"
            validate={ValidatorCPU}
            placeholder={sc.CPU_INPUT_PLACEHOLDER}
            type="number"
            format={(value: any) => {
              return !value ? "" : (sizeStringToNumber(value) * 1000).toFixed();
            }}
            // TODO
            // parse={(value: any) => {
            //   const integerValue = parseInt(value, 10);
            //   if (!isNaN(integerValue) && integerValue < 0) {
            //     return 0;
            //   }
            //   return !value ? undefined : value + "m";
            // }}
            endAdornment={
              <KTooltip title={sc.CPU_INPUT_TOOLTIP}>
                <Box display="flex" alignItems="center">
                  <HelpIcon fontSize="small" className={classes.textFieldHelperIcon} />
                  <Box ml={0.5}>m</Box>
                </Box>
              </KTooltip>
            }
          />
        </Grid>

        <Grid item xs={6}>
          <Field
            component={FinalTextField}
            name="memoryRequest"
            label="Memory Request"
            margin
            validate={ValidatorMemory}
            placeholder={sc.MEMORY_INPUT_PLACEHOLDER}
            type="number"
            format={(value: any) => {
              return !value ? "" : sizeStringToMi(value);
            }}
            // TODO
            // parse={(value: any) => {
            //   const integerValue = parseInt(value, 10);
            //   if (!isNaN(integerValue) && integerValue < 0) {
            //     return 0;
            //   }
            //   return !value ? undefined : value + "Mi";
            // }}
            endAdornment={
              <KTooltip title={sc.MEMORY_INPUT_TOOLTIP}>
                <Box display="flex" alignItems="center">
                  <HelpIcon fontSize="small" className={classes.textFieldHelperIcon} />
                  <Box ml={0.5}>Mi</Box>
                </Box>
              </KTooltip>
            }
          />
        </Grid>

        {/* TODO */}
        {/* <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Nodes</Subtitle1>
          </SectionTitle>
        </Grid>
        <Grid item xs={12}>
          <Field name="nodeSelectorLabels" component={KFormikRenderSelectLabels} nodeLabels={nodeLabels} />
        </Grid>
        <Grid item xs={12}>
          <Field
            name="preferNotCoLocated"
            component={KFormikBoolCheckboxRender}
            label={sc.SCHEDULING_COLOCATE_CHECKBOX}
          />
        </Grid> */}
      </Grid>
    );
  }

  // TODO
  // private renderUpgradePolicy() {
  //   return (
  //     <Grid container spacing={2}>
  //       <Grid item xs={12}>
  //         <SectionTitle>
  //           <Subtitle1>Deployment Strategy</Subtitle1>
  //         </SectionTitle>
  //       </Grid>
  //       <Grid item xs={8}>
  //         <KFormikRadioGroupRender
  //           onChange={this.props.handleChange}
  //           name="restartStrategy"
  //           value={this.props.values.restartStrategy || "RollingUpdate"}
  //           options={[
  //             {
  //               value: "RollingUpdate",
  //               label: (
  //                 <Body2>
  //                   <strong>Rolling Update</strong> - {sc.DEPLOYMENT_ROLLING}
  //                 </Body2>
  //               ),
  //             },
  //             {
  //               value: "Recreate",
  //               label: (
  //                 <Body2>
  //                   <strong>Recreate</strong> - {sc.DEPLOYMENT_RECREATE}
  //                 </Body2>
  //               ),
  //             },
  //           ]}
  //         />
  //       </Grid>
  //       <Grid item xs={12}>
  //         <SectionTitle>
  //           <Subtitle1>Graceful Terimination Period</Subtitle1>
  //         </SectionTitle>
  //       </Grid>
  //       <HelperTextSection>
  //         {sc.GRACEFUL_TERM_HELPER}
  //         &nbsp;
  //         <Link
  //           href="https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/#hook-handler-execution"
  //           target="_blank"
  //         >
  //           {sc.LEARN_MORE_LABEL}
  //         </Link>
  //       </HelperTextSection>
  //       <Grid item xs={6}>
  //         <Field
  //           component={FinalTextField}
  //           name="terminationGracePeriodSeconds"
  //           label="Termination Grace Period (seconds)"
  //           normalize={FormikNormalizePositiveNumber}
  //           placeholder={sc.GRACEFUL_TERM_INPUT_PLACEHOLDER}
  //         />
  //       </Grid>
  //     </Grid>
  //   );
  // }

  private renderAccess = () => {
    return <ComponentAccess />;
  };

  private renderTabDetails() {
    const { classes, currentTabIndex } = this.props;

    // TODO
    return (
      <>
        <div className={`${this.tabs[currentTabIndex] === Configurations ? "" : classes.displayNone}`}>
          {/* {this.renderConfigurations()} */}
        </div>
        <div className={`${this.tabs[currentTabIndex] === NetworkingTab ? "" : classes.displayNone}`}>
          {/* {this.renderNetworking()} */}
        </div>
        <div className={`${this.tabs[currentTabIndex] === DisksTab ? "" : classes.displayNone}`}>
          {/* {this.renderDisks()} */}
        </div>
        <div className={`${this.tabs[currentTabIndex] === HealthTab ? "" : classes.displayNone}`}>
          {/* {this.renderHealth()} */}
        </div>
        <div className={`${this.tabs[currentTabIndex] === Scheduling ? "" : classes.displayNone}`}>
          {/* {this.renderScheduling()} */}
        </div>
        <div className={`${this.tabs[currentTabIndex] === Deploy ? "" : classes.displayNone}`}>
          {/* {this.renderUpgradePolicy()} */}
        </div>
        <div className={`${this.tabs[currentTabIndex] === Access ? "" : classes.displayNone}`}>
          {/*{this.renderAccess()}*/}
        </div>
      </>
    );
  }

  private pushToTab(tabIndex: number) {
    const tab = this.tabs[tabIndex];
    const {
      dispatch,
      location: { pathname },
    } = this.props;

    dispatch(push(`${pathname}#${tab ? tab.replace(/\s/g, "") : ""}`));
  }

  // TODO
  // private showError(fieldName: string): boolean {
  //   const { touched, errors } = this.props;

  //   return !!getIn(touched, fieldName) && !!getIn(errors, fieldName);
  // }

  private handleChangeTab(event: React.ChangeEvent<{}>, value: number) {
    this.pushToTab(value);
  }

  private renderTabs() {
    const { classes, currentTabIndex } = this.props;
    return (
      <Tabs
        className={clsx(classes.borderBottom, classes.tabsRoot)}
        value={currentTabIndex}
        variant="scrollable"
        scrollButtons="auto"
        indicatorColor="primary"
        textColor="primary"
        onChange={this.handleChangeTab.bind(this)}
        aria-label="component form tabs"
      >
        {this.tabs.map((tab) => {
          // TODO
          // if (
          //   (tab === Configurations &&
          //     (this.showError("preInjectedFiles") || this.showError("env") || this.showError("command"))) ||
          //   (tab === DisksTab && this.showError("volumes")) ||
          //   (tab === HealthTab && (this.showError("livenessProbe") || this.showError("readinessProbe"))) ||
          //   (tab === NetworkingTab && this.showError("ports")) ||
          //   (tab === Scheduling &&
          //     (this.showError("cpuLimit") || this.showError("memoryLimit") || this.showError("nodeSelectorLabels")))
          // ) {
          //   return <Tab key={tab} label={tab} className={classes.hasError} />;
          // }

          return <Tab key={tab} label={tab} tutorial-anchor-id={tab} />;
        })}
      </Tabs>
    );
  }

  private renderMain(values: ComponentLike, initialValues: Partial<ComponentLike>) {
    let isEdit = false;
    if (initialValues && initialValues.name) {
      isEdit = true;
    }

    let hasVolumes = false;
    if (values.volumes && values.volumes.length > 0) {
      hasVolumes = true;
    }

    return (
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Field
            autoFocus
            component={FinalTextField}
            id="component-name"
            name="name"
            label="Name"
            validate={nameValidators}
            disabled={isEdit}
            helperText={isEdit ? "Name can't be changed." : sc.NAME_RULE}
          />
        </Grid>
        <Grid item xs={6}>
          <Field
            component={FinalTextField}
            id="component-image"
            name="image"
            spellCheck={false}
            label="Image"
            placeholder={sc.IMAGE_PLACEHOLDER}
            validate={ValidatorRequired}
            helperText={sc.IMAGE_INPUT_HELPER}
          />
        </Grid>

        <Grid item xs={6}>
          <Field
            name="workloadType"
            component={FinalSelectField}
            label="Type"
            validate={ValidatorRequired}
            disabled={isEdit || hasVolumes}
            options={[
              makeSelectOption(workloadTypeServer, "Service Component", sc.COMPONENT_TYPE_SERVICE_OPTION),
              makeSelectOption(workloadTypeCronjob, "CronJob", sc.COMPONENT_TYPE_CRONJOB_OPTION),
              makeSelectOption(workloadTypeDaemonSet, "DaemonSet", sc.COMPONENT_TYPE_DAEMON_OPTION),
              makeSelectOption(workloadTypeStatefulSet, "StatefulSet", sc.COMPONENT_TYPE_STATEFUL_SET_OPTION),
            ]}
            helperText={!isEdit && hasVolumes ? "Type can't be changed after created disks" : ""}
          />
        </Grid>
        <Grid item xs={6}>
          {this.renderReplicasOrSchedule(values.workloadType)}
        </Grid>
        {this.renderPrivateRegistryAlert(values)}
      </Grid>
    );
  }

  private isUnknownPrivateRegistry = (image: string) => {
    const { registries } = this.props;
    const parts = image.split("/");

    // eg. nginx:latest
    if (parts.length === 1) {
      return false;
    }

    // docker Hub User Id Use 4 to 30 letters & digits only.
    // is not a url
    if (!parts[0].includes(".")) {
      return false;
    }

    // eg. gcr.io/kaniko-project/executor:latest
    if (PublicRegistriesList.includes(parts[0])) {
      return false;
    }

    return !registries.find((r) => r.host.includes(parts[0]));
  };

  private renderPrivateRegistryAlert = (values: ComponentLike) => {
    const image = values.image;

    if (!image || !this.isUnknownPrivateRegistry(image)) {
      return null;
    }

    return (
      <Grid item xs={12}>
        <Alert
          severity="info"
          action={
            <Button
              color="inherit"
              size="small"
              style={{ textAlign: "center" }}
              component={RouteLink}
              to="/cluster/registries"
            >
              Configure registry
            </Button>
          }
        >
          You seem to be using a private docker image registry. No image pull secret for this registry is retrieved. If
          the image is not public accessible, the image pull process may encounter errors.
        </Alert>
      </Grid>
    );
  };

  private renderDeployButton(initialValues: Partial<ComponentLike>) {
    const { classes, isSubmittingApplicationComponent } = this.props;

    // @ts-ignore
    const isEdit = initialValues && initialValues.name;

    return (
      <Grid container spacing={2}>
        <Grid item xs={6} sm={6} md={6}>
          <CustomizedButton
            pending={isSubmittingApplicationComponent}
            disabled={isSubmittingApplicationComponent}
            variant="contained"
            color="primary"
            type="submit"
            className={classes.deployBtn}
            id="add-component-submit-button"
          >
            {isEdit ? "Update" : "Deploy"} Component
          </CustomizedButton>
        </Grid>
      </Grid>
    );
  }

  public render() {
    const { classes, _initialValues, onSubmit } = this.props;
    return (
      <Form
        initialValues={_initialValues}
        onSubmit={onSubmit}
        render={({ handleSubmit, form, submitting, pristine, values, dirty, initialValues }: RenderProps) => (
          <form onSubmit={handleSubmit} className={classes.root} id="component-form">
            {<Prompt when={dirty && !submitting} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />}
            {/* <FormMidware values={values} form={form} /> */}
            <KPanel
              content={
                <Box p={2} tutorial-anchor-id="component-from-basic">
                  {this.renderMain(values, initialValues)}
                </Box>
              }
            />
            <Box mt={2}>
              <KPanel
                content={
                  <>
                    {this.renderTabs()}
                    <Box p={2}>{this.renderTabDetails()}</Box>
                  </>
                }
              />
            </Box>
            {process.env.REACT_APP_DEBUG === "true" ? (
              <pre style={{ maxWidth: 1500, background: "#eee" }}>{JSON.stringify(values, undefined, 2)}</pre>
            ) : null}
            {/* <div className={`${classes.formSection} ${currentTabIndex === "advanced" ? "" : ""}`}>{this.renderPlugins()}</div> */}
            {this.renderDeployButton(initialValues)}
          </form>
        )}
      />
    );
  }
}

// const form = withFormik<ConnectedProps & RawProps & WithStyles<typeof styles> & RouteComponentProps, ComponentLike>({
//   mapPropsToValues: (props) => props._initialValues,
//   enableReinitialize: true,
//   validate: (values, props) => {
//     return validate(values) || formikValidateOrNotBlockByTutorial(values, props);
//   },
//   handleSubmit: async (formValues, { props: { onSubmit } }) => {
//     await onSubmit(formValues);
//   },
//   validationSchema: object().shape({
//     // @ts-ignore
//     env: array().of(object().unique("name", "Env names should be unique.")),
//   }),
// })(ComponentLikeFormRaw);

export const ComponentLikeForm = connect(mapStateToProps)(withStyles(styles)(withRouter(ComponentLikeFormRaw)));
