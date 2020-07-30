import {
  Box,
  Button,
  Collapse,
  Grid,
  Link,
  List as MList,
  ListItem,
  ListItemText,
  Tab,
  Tabs,
  Typography,
} from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import { createStyles, Theme, withStyles, WithStyles, styled } from "@material-ui/core/styles";
import HelpIcon from "@material-ui/icons/Help";
import { Alert } from "@material-ui/lab";
import { loadSimpleOptionsAction, loadStatefulSetOptionsAction } from "actions/persistentVolume";
import clsx from "clsx";
import { push } from "connected-react-router";
import { KTooltip } from "forms/Application/KTooltip";
import { KBoolCheckboxRender } from "forms/Basic/checkbox";
import { shouldError } from "forms/common";
import { Disks } from "forms/ComponentLike/Disks";
import { COMPONENT_FORM_ID } from "forms/formIDs";
import Immutable from "immutable";
import { COMPONENT_DEPLOY_BUTTON_ZINDEX } from "layout/Constants";
import queryString from "qs";
import React from "react";
import { connect } from "react-redux";
import { Link as RouteLink, RouteComponentProps, withRouter } from "react-router-dom";
import { RootState } from "reducers";
import { InjectedFormProps } from "redux-form";
import { Field, getFormSyncErrors, getFormValues, reduxForm } from "redux-form/immutable";
import { getNodeLabels } from "selectors/node";
import { formValidateOrNotBlockByTutorial } from "tutorials/utils";
import { TDispatchProp } from "types";
import { ApplicationDetails, SharedEnv } from "types/application";
import {
  ComponentLike,
  ComponentLikeContent,
  workloadTypeCronjob,
  workloadTypeDaemonSet,
  workloadTypeServer,
  workloadTypeStatefulSet,
} from "types/componentTemplate";
import { PublicRegistriesList } from "types/registry";
import { sizeStringToMi, sizeStringToNumber } from "utils/sizeConv";
import { CustomizedButton } from "widgets/Button";
import { KPanel } from "widgets/KPanel";
import { Body, Body2, Caption, Subtitle1 } from "widgets/Label";
import { Prompt } from "widgets/Prompt";
import { SectionTitle } from "widgets/SectionTitle";
import { KRadioGroupRender } from "../Basic/radio";
import { RenderSelectField } from "../Basic/select";
import {
  KRenderCommandTextField,
  KRenderDebounceTextField,
  RenderComplexValueTextDebounceField,
  RenderComplexValueTextField,
} from "../Basic/textfield";
import { NormalizeNumber } from "../normalizer";
import { ValidatorCPU, ValidatorMemory, ValidatorName, ValidatorRequired, ValidatorSchedule } from "../validator";
import { Envs } from "./Envs";
import { RenderSelectLabels } from "./NodeSelector";
import { Ports } from "./Ports";
import { PreInjectedFiles } from "./preInjectedFiles";
import { LivenessProbe, ReadinessProbe } from "./Probes";
import { theme } from "theme/theme";
import stringConstants from "utils/stringConstants";

const IngressHint = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Link style={{ cursor: "pointer" }} onClick={() => setOpen(!open)}>
        How can I expose my component to the public Internet?
      </Link>
      <Box pt={1}>
        <Collapse in={open}>
          After you have successfully configured this component, you can go to the routing interface and create a
          suitable routing rule to direct external traffic to this component.
        </Collapse>
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
const tabs = [Configurations, NetworkingTab, DisksTab, HealthTab, Scheduling, Deploy];

const mapStateToProps = (state: RootState) => {
  const fieldValues = (getFormValues(COMPONENT_FORM_ID)(state) as ComponentLike) || (Immutable.Map() as ComponentLike);
  const syncValidationErrors = getFormSyncErrors(COMPONENT_FORM_ID)(state) as {
    [x in keyof ComponentLikeContent]: any;
  };
  const nodeLabels = getNodeLabels(state);

  const search = queryString.parse(window.location.search.replace("?", ""));
  const hash = window.location.hash;
  const anchor = hash.replace("#", "");
  let currentTabIndex = tabs.map((t) => t.replace(/\s/g, "")).indexOf(`${anchor}`);
  if (currentTabIndex < 0) {
    currentTabIndex = 0;
  }

  return {
    registries: state.get("registries").get("registries"),
    tutorialState: state.get("tutorial"),
    search,
    fieldValues,
    isSubmittingApplicationComponent: state.get("components").get("isSubmittingApplicationComponent"),
    syncValidationErrors,
    nodeLabels,
    currentTabIndex,
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
const HelperText = styled(Box)({
  color: "#636d72",
  "font-size": theme.typography.caption.fontSize,
});

interface RawProps {
  showDataView?: boolean;
  showSubmitButton?: boolean;
  submitButtonText?: string;
  sharedEnv?: Immutable.List<SharedEnv>;
  application?: ApplicationDetails;
}

interface ConnectedProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {
  // submitAppplicationErrors?: Immutable.Map<string, any>;
}

export interface Props
  extends InjectedFormProps<ComponentLike, ConnectedProps>,
    RouteComponentProps,
    WithStyles<typeof styles>,
    ConnectedProps,
    RawProps {}

interface State {}

const nameValidators = [ValidatorRequired, ValidatorName];

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

  private renderReplicasOrSchedule = () => {
    const workloadType = this.props.fieldValues.get("workloadType");
    if (workloadType === workloadTypeServer || workloadType === workloadTypeStatefulSet) {
      return (
        <Field
          component={RenderComplexValueTextField}
          name="replicas"
          margin
          label="Replicas"
          helperText="Number of pods to create for this component."
          format={(value: any) => {
            let displayValue;
            if (value !== null && value !== undefined) {
              displayValue = `${value}`.length > 0 ? value : 1;
            } else {
              displayValue = 1;
            }

            return displayValue;
          }}
          parse={(value: any) => {
            return value;
          }}
          normalize={NormalizeNumber}
        />
      );
    }

    if (workloadType === workloadTypeCronjob) {
      return (
        <>
          <Field
            name="schedule"
            component={KRenderDebounceTextField}
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

  private getCPUHelper() {
    return "Kalm uses 1m as the base unit of CPU. 1 Core equals 1000m. The minimum support is 1m.";
  }

  private getMemoryHelper() {
    return "Kalm uses Mi as the base unit of Memory. 1 Gi equals 1024 Mi.";
  }

  private preInjectedFiles = () => {
    return (
      <>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Config Files</Subtitle1>
          </SectionTitle>
        </Grid>
        <Grid item xs={12}>
          <HelperText>
            Use Config Files to specify file-based configurations for your Component. Config Files created here are
            automatically mounted to the container.
            <span>&nbsp;</span>
            <Link href="https://kalm.dev/docs/guide-config#adding-a-config-file" target="_blank">
              Learn more.
            </Link>
          </HelperText>
        </Grid>
        <Grid item xs={12}>
          <PreInjectedFiles />
        </Grid>
      </>
    );
  };

  private renderEnvs() {
    const { sharedEnv } = this.props;

    return (
      <>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Environment Variables</Subtitle1>
          </SectionTitle>
        </Grid>
        <Grid item xs={12}>
          <HelperText>
            Define environment variables for the main container of this component. This overrides enviornment variables
            specified in the image.
            <span>&nbsp;</span>
            <Link href="https://kalm.dev/docs/guide-config#environment-varibles" target="_blank">
              Learn more.
            </Link>
          </HelperText>
        </Grid>
        <Grid item xs={12}>
          <Envs sharedEnv={sharedEnv} />
        </Grid>
      </>
    );
  }

  public renderPorts() {
    const { classes } = this.props;

    const helper =
      "Port is the standard way to expose your program. If you want your component can be accessed by some other parts, you need to define a port.";

    return (
      <>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Ports</Subtitle1>
            <KTooltip title={helper}>
              <HelpIcon fontSize="small" className={classes.sectionTitleHelperIcon} />
            </KTooltip>
          </SectionTitle>
        </Grid>
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
    const { classes } = this.props;

    const helper = (
      <>
        <Caption>Mount different kinds of volumes to this component.</Caption>
        <Box mt={1} mb={1}>
          <Caption>1. New Disk</Caption>
        </Box>
        <Caption>Create a disk according to the storageClass definition you selected.</Caption>
        <Box mt={1} mb={1}>
          <Caption>2. Existing Persistent Volume Claim</Caption>
        </Box>
        <Caption>
          PersistentVolumeClaim and Disk are a kubernetes original resources. A persistentVolumeClaim volume is used to
          mount a Disk into a Pod. Disks are a way for users to “claim” durable storage (such as a GCE PersistentDisk or
          an iSCSI volume) without knowing the details of the particular cloud environment.
        </Caption>
        <Box mt={1} mb={1}>
          <Caption>3. Temporary Disk</Caption>
        </Box>
        <Caption>
          This sort of volumes are stored on whatever medium is backing the node, which might be disk or SSD or network
          storage, depending on your environment.
        </Caption>
        <Box mt={1} mb={1}>
          <Caption>4. Temporary Memory Media Disk</Caption>
        </Box>
        <Caption>
          It will mount a tmpfs (RAM-backed filesystem) for you. While tmpfs is very fast, be aware that unlike disks,
          tmpfs is cleared on node reboot and any files you write will count against your Container’s memory limit.
        </Caption>
      </>
    );

    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Body>Mount various type of disks into your component.</Body>
        </Grid>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Disks</Subtitle1>
            <KTooltip title={helper}>
              <HelpIcon fontSize="small" className={classes.sectionTitleHelperIcon} />
            </KTooltip>
          </SectionTitle>
        </Grid>
        <Grid item xs={12}>
          <Disks />
        </Grid>
      </Grid>
    );
  }

  private getDnsPolicyOptions() {
    return [
      {
        value: "Default",
        label: "Default",
        explain: (
          <>
            The Pod inherits the name resolution configuration from the node that the pods run on. See{" "}
            <a
              target="_blank"
              href="https://kubernetes.io/docs/tasks/administer-cluster/dns-custom-nameservers/#inheriting-dns-from-the-node"
              rel="noopener noreferrer"
            >
              related discussion
            </a>{" "}
            for more details.
          </>
        ),
      },
      {
        value: "ClusterFirst",
        label: "ClusterFirst",
        explain: (
          <>
            Any DNS query that does not match the configured cluster domain suffix, such as “www.kubernetes.io”, is
            forwarded to the upstream nameserver inherited from the node. Cluster administrators may have extra
            stub-domain and upstream DNS servers configured. See{" "}
            <a
              target="_blank"
              href="https://kubernetes.io/docs/tasks/administer-cluster/dns-custom-nameservers/#impacts-on-pods"
              rel="noopener noreferrer"
            >
              related discussion
            </a>{" "}
            for details on how DNS queries are handled in those cases.
          </>
        ),
      },
      {
        value: "ClusterFirstWithHostNet",
        label: "ClusterFirstWithHostNet",
        explain: (
          <>For Pods running with hostNetwork, you should explicitly set its DNS policy “ClusterFirstWithHostNet”.</>
        ),
      },
      {
        value: "None",
        label: "None",
        explain: <>It allows a Pod to ignore DNS settings from the Kubernetes environment.</>,
      },
    ];
  }

  private renderDnsPolicy() {
    return (
      <>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>DNS Policy</Subtitle1>
          </SectionTitle>
        </Grid>
        <Grid item xs={12}>
          <Field component={KRadioGroupRender} name="dnsPolicy" options={this.getDnsPolicyOptions()} />
        </Grid>
      </>
    );
  }

  private renderAdvancedHelper = (options: { title: string; content: React.ReactNode }[]) => {
    return (
      <MList dense={true}>
        {options.map((x, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={x.title}
              key={index}
              secondary={x.content}
              secondaryTypographyProps={{ color: "inherit" }}
            />
          </ListItem>
        ))}
      </MList>
    );
  };

  // private renderPlugins() {
  //   const { classes } = this.props;

  //   const helper = (
  //     <HelperContainer>
  //       <Typography>
  //         Plugins can affect running state of a program, or provide extra functionality for the programs.
  //       </Typography>
  //     </HelperContainer>
  //   );

  //   return (
  //     <>
  //       <SectionTitle>
  //         <Subtitle1>Plugins</Subtitle1>
  //         <KTooltip title={helper}>
  //           <HelpIcon fontSize="small" className={classes.sectionTitleHelperIcon} />
  //         </KTooltip>
  //       </SectionTitle>

  //       <Grid container spacing={2}>
  //         <Grid item xs={12}>
  //           <Plugins />
  //         </Grid>
  //       </Grid>
  //     </>
  //   );
  // }

  private renderCommandAndArgs() {
    return (
      <>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Command</Subtitle1>
          </SectionTitle>
        </Grid>
        <Grid item xs={12}>
          <HelperText>
            Define a command for the main container of this component. This overrides the default Entrypoint and Cmd of
            the image.
          </HelperText>
        </Grid>
        <Grid item xs={12}>
          <Field
            component={KRenderCommandTextField}
            name="command"
            label="Command"
            placeholder="e.g. /bin/sh -c 'echo hello; sleep 600'"
          />
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
    const { classes } = this.props;
    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Readiness Probe</Subtitle1>
            <KTooltip title={"Readiness probe is used to decide when a component is ready to accepting traffic."}>
              <HelpIcon fontSize="small" className={classes.sectionTitleHelperIcon} />
            </KTooltip>
          </SectionTitle>
        </Grid>
        <Grid item xs={12}>
          <ReadinessProbe />
        </Grid>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Liveness Probe</Subtitle1>
            <KTooltip
              title={
                "Liveness probe is used to know if the component is running into an unexpected state and a restart is required."
              }
            >
              <HelpIcon fontSize="small" className={classes.sectionTitleHelperIcon} />
            </KTooltip>
          </SectionTitle>
        </Grid>
        <Grid item xs={12}>
          <LivenessProbe />
        </Grid>
      </Grid>
    );
  }

  private renderNetworking() {
    return (
      <Grid container spacing={2}>
        {/* <Grid item xs={12}>
          <SectionTitle>
          <Subtitle1>Networking</Subtitle1>
          </SectionTitle>
        </Grid> */}
        {this.renderPorts()}
        {/* {this.renderDnsPolicy()} */}
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
    const { nodeLabels, classes } = this.props;
    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Resources</Subtitle1>
          </SectionTitle>
        </Grid>

        <Grid item xs={6}>
          <Field
            component={RenderComplexValueTextDebounceField}
            name="cpu"
            label="CPU Limit"
            validate={ValidatorCPU}
            // normalize={NormalizeCPU}
            placeholder="Please type CPU limit"
            type="number"
            format={(value: any) => {
              return !value ? "" : (sizeStringToNumber(value) * 1000).toFixed();
            }}
            parse={(value: any) => {
              return !value ? "" : value + "m";
            }}
            endAdornment={
              <KTooltip title={this.getCPUHelper()}>
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
            component={RenderComplexValueTextDebounceField}
            name="memory"
            label="Memory Limit"
            margin
            validate={ValidatorMemory}
            // normalize={NormalizeMemory}
            placeholder="Please type memory limit"
            type="number"
            format={(value: any) => {
              return !value ? "" : sizeStringToMi(value);
            }}
            parse={(value: any) => {
              return !value ? "" : value + "Mi";
            }}
            endAdornment={
              <KTooltip title={this.getMemoryHelper()}>
                <Box display="flex" alignItems="center">
                  <HelpIcon fontSize="small" className={classes.textFieldHelperIcon} />
                  <Box ml={0.5}>Mi</Box>
                </Box>
              </KTooltip>
            }
          />
        </Grid>
        <Grid item xs={12}>
          <Field
            name="enableResourcesRequests"
            component={KBoolCheckboxRender}
            label="Only schedule on nodes that meet the above resources"
          />
        </Grid>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Nodes</Subtitle1>
          </SectionTitle>
        </Grid>
        <Grid item xs={12}>
          <Field name="nodeSelectorLabels" component={RenderSelectLabels} nodeLabels={nodeLabels} />
        </Grid>
        <Grid item xs={12}>
          <Field
            name="preferNotCoLocated"
            component={KBoolCheckboxRender}
            label="Prefer to schedule replicas to different nodes. (Recommand for high availablity)"
          />
        </Grid>
        {/* <Grid item xs={6}>
          <Field name="podAffinityType" component={KRadioGroupRender} options={this.getPodAffinityOptions()} />
        </Grid> */}
      </Grid>
    );
  }

  private renderUpgradePolicy() {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Deployment Strategy</Subtitle1>
          </SectionTitle>
        </Grid>
        <Grid item xs={8}>
          <Field
            defaultValue="RollingUpdate"
            component={KRadioGroupRender}
            name="restartStrategy"
            options={[
              {
                value: "RollingUpdate",
                label: (
                  <Body2>
                    <strong>Rolling Update</strong> - Replace pods one by one, resulting in zero downtime.
                  </Body2>
                ),
              },
              {
                value: "Recreate",
                label: (
                  <Body2>
                    <strong>Recreate</strong> - All old pods are stopped and replaced at once, resulting in downtime.
                    Useful if application cannot support multiple versions running at the same time.
                  </Body2>
                ),
              },
            ]}
          />
        </Grid>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Graceful Terimination Period</Subtitle1>
          </SectionTitle>
        </Grid>
        <Grid item xs={8}>
          <Body2>
            When Pods are teriminated, running processes are first asked to gracefully shutdown with SIGTERM. However
            some application may not be able to shutdown gracefully. Specify an amount of time to wait before forcefully
            killing with SIGKILL. The default value is 30 seconds. &nbsp;
            <Link
              href="https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/#hook-handler-execution"
              target="_blank"
            >
              Learn More
            </Link>
          </Body2>
        </Grid>
        <Grid item xs={6}>
          <Field
            component={KRenderDebounceTextField}
            name="terminationGracePeriodSeconds"
            label="Termination Grace Period (seconds)"
            // validate={ValidatorRequired}
            normalize={NormalizeNumber}
            placeholder="e.g. 60"
          />
        </Grid>
      </Grid>
    );
  }

  private renderTabDetails() {
    const { classes, currentTabIndex } = this.props;

    return (
      <>
        <div className={`${this.tabs[currentTabIndex] === Configurations ? "" : classes.displayNone}`}>
          {this.renderConfigurations()}
        </div>
        <div className={`${this.tabs[currentTabIndex] === NetworkingTab ? "" : classes.displayNone}`}>
          {this.renderNetworking()}
        </div>
        <div className={`${this.tabs[currentTabIndex] === DisksTab ? "" : classes.displayNone}`}>
          {this.renderDisks()}
        </div>
        <div className={`${this.tabs[currentTabIndex] === HealthTab ? "" : classes.displayNone}`}>
          {this.renderHealth()}
        </div>
        <div className={`${this.tabs[currentTabIndex] === Scheduling ? "" : classes.displayNone}`}>
          {this.renderScheduling()}
        </div>
        <div className={`${this.tabs[currentTabIndex] === Deploy ? "" : classes.displayNone}`}>
          {this.renderUpgradePolicy()}
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

  private renderTabs() {
    const { classes, syncValidationErrors, submitFailed, currentTabIndex } = this.props;
    return (
      <Tabs
        className={clsx(classes.borderBottom, classes.tabsRoot)}
        value={currentTabIndex}
        variant="scrollable"
        scrollButtons="auto"
        indicatorColor="primary"
        textColor="primary"
        onChange={(event: React.ChangeEvent<{}>, value: number) => {
          this.pushToTab(value);
          // this.setState({ currentTabIndex: value });
        }}
        aria-label="component form tabs"
      >
        {this.tabs.map((tab) => {
          if (
            submitFailed &&
            ((tab === Configurations &&
              (syncValidationErrors.preInjectedFiles || syncValidationErrors.env || syncValidationErrors.command)) ||
              (tab === DisksTab && syncValidationErrors.volumes) ||
              (tab === HealthTab && (syncValidationErrors.livenessProbe || syncValidationErrors.readinessProbe)) ||
              (tab === NetworkingTab && syncValidationErrors.ports) ||
              (tab === Scheduling &&
                (syncValidationErrors.cpu || syncValidationErrors.memory || syncValidationErrors.nodeSelectorLabels)))
          ) {
            return <Tab key={tab} label={tab} className={classes.hasError} />;
          }

          return <Tab key={tab} label={tab} tutorial-anchor-id={tab} />;
        })}
      </Tabs>
    );
  }

  private renderMain() {
    const { initialValues } = this.props;
    let isEdit = false;
    // @ts-ignore
    if (initialValues && initialValues!.get("name")) {
      isEdit = true;
    }

    return (
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Field
            component={KRenderDebounceTextField}
            autoFocus={true}
            name="name"
            label="Name"
            margin
            validate={nameValidators}
            disabled={isEdit}
            helperText={isEdit ? "Name can't be changed." : stringConstants.NAME_RULE}
          />
        </Grid>
        <Grid item xs={6}>
          <Field
            component={KRenderDebounceTextField}
            name="image"
            label="Image"
            placeholder="e.g. nginx:latest"
            margin
            validate={ValidatorRequired}
            helperText="Image URL defaults to hub.docker.com. Use full URL for all other registries."
          />
        </Grid>

        <Grid item xs={6}>
          <Field
            name="workloadType"
            component={RenderSelectField}
            label="Workload Type"
            validate={ValidatorRequired}
            disabled={isEdit}
            options={[
              {
                value: workloadTypeServer,
                selectedText: "Service Component",
                text: (
                  <Box pt={1} pb={1}>
                    <Typography color="textPrimary">Service Component</Typography>
                    <Typography color="textSecondary" variant="caption">
                      Default choice - Suitable for most continuous services
                    </Typography>
                  </Box>
                ),
              },
              {
                value: workloadTypeCronjob,
                selectedText: "CronJob",
                text: (
                  <Box pt={1} pb={1}>
                    <Typography color="textPrimary">CronJob</Typography>
                    <Typography color="textSecondary" variant="caption">
                      Scheduled tasks to be ran at specific times
                    </Typography>
                  </Box>
                ),
              },
              {
                value: workloadTypeDaemonSet,
                selectedText: "DaemonSet",
                text: (
                  <Box pt={1} pb={1}>
                    <Typography color="textPrimary">DaemonSet</Typography>
                    <Typography color="textSecondary" variant="caption">
                      For system services which should be deployed once per node
                    </Typography>
                  </Box>
                ),
              },
              {
                value: workloadTypeStatefulSet,
                selectedText: "StatefulSet",
                text: (
                  <Box pt={1} pb={1}>
                    <Typography color="textPrimary">StatefulSet</Typography>
                    <Typography color="textSecondary" variant="caption">
                      For stateful apps requiring additional persistence settings
                    </Typography>
                  </Box>
                ),
              },
            ]}
          />
        </Grid>
        <Grid item xs={6}>
          {this.renderReplicasOrSchedule()}
        </Grid>
        {this.renderPrivateRegistryAlert()}
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

    return !registries.find((r) => r.get("host").includes(parts[0]));
  };

  private renderPrivateRegistryAlert = () => {
    const { fieldValues } = this.props;
    const image = fieldValues.get("image");

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

  private renderDeployButton() {
    const { classes, handleSubmit, isSubmittingApplicationComponent, initialValues } = this.props;

    // @ts-ignore
    const isEdit = initialValues && initialValues!.get("name");

    return (
      <Grid container spacing={2}>
        <Grid item xs={6} sm={6} md={6}>
          <CustomizedButton
            pending={isSubmittingApplicationComponent}
            disabled={isSubmittingApplicationComponent}
            variant="contained"
            color="primary"
            className={classes.deployBtn}
            onClick={handleSubmit}
            id="add-component-submit-button"
          >
            {isEdit ? "Update" : "Deploy"} Component
          </CustomizedButton>

          {/* <Button variant="contained" color="primary" type="submit" className={classes.deployBtn}>
            Deploy
          </Button> */}
        </Grid>
      </Grid>
    );
  }

  public renderDirtyPrompt = () => {
    const { dirty, submitSucceeded } = this.props;
    return <Prompt when={dirty && !submitSucceeded} message="Are you sure to leave without saving changes?" />;
  };

  public render() {
    const { handleSubmit, classes } = this.props;
    return (
      <form onSubmit={handleSubmit} className={classes.root}>
        {this.renderDirtyPrompt()}
        <KPanel
          content={
            <Box p={2} tutorial-anchor-id="component-from-basic">
              {this.renderMain()}
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
          <pre style={{ maxWidth: 1500, background: "#eee" }}>
            {JSON.stringify(
              (this.props.fieldValues as any).delete("metrics").delete("pods").delete("services"),
              undefined,
              2,
            )}
          </pre>
        ) : null}
        {/* <div className={`${classes.formSection} ${currentTabIndex === "advanced" ? "" : ""}`}>{this.renderPlugins()}</div> */}
        {this.renderDeployButton()}
      </form>
    );
  }
}

const form = reduxForm<ComponentLike, RawProps & ConnectedProps>({
  form: COMPONENT_FORM_ID,
  enableReinitialize: true,
  validate: formValidateOrNotBlockByTutorial,
  shouldError: shouldError,
  onSubmitFail: console.log,
})(withStyles(styles)(withRouter(ComponentLikeFormRaw)));

export const ComponentLikeForm = connect(mapStateToProps)(form);
