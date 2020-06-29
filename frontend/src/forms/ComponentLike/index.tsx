import {
  Box,
  Collapse,
  Grid,
  Link,
  List as MList,
  ListItem,
  ListItemText,
  Tab,
  Tabs,
  Tooltip
} from "@material-ui/core";
import { Prompt } from "widgets/Prompt";
import { grey } from "@material-ui/core/colors";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import HelpIcon from "@material-ui/icons/Help";
import clsx from "clsx";
import { KBoolCheckboxRender } from "forms/Basic/checkbox";
import Immutable from "immutable";
import queryString from "query-string";
import React from "react";
import { connect } from "react-redux";
import { InjectedFormProps } from "redux-form";
import { Field, getFormSyncErrors, getFormValues, reduxForm } from "redux-form/immutable";
import { Body, H5 } from "widgets/Label";
import { SectionTitle } from "widgets/SectionTitle";
import { loadComponentPluginsAction } from "actions/application";
import { loadNodesAction } from "actions/node";
import { loadPersistentVolumesAction, loadStorageClassesAction } from "actions/persistentVolume";
import { RootState } from "reducers";
import { getNodeLabels } from "selectors/node";
import { ApplicationDetails, SharedEnv } from "types/application";
import { ComponentLike, ComponentLikeContent, workloadTypeCronjob, workloadTypeServer } from "types/componentTemplate";
import { CustomizedButton } from "widgets/Button";
import { HelperContainer } from "widgets/Helper";
import { KPanel } from "widgets/KPanel";
import { KRadioGroupRender } from "../Basic/radio";
import { RenderSelectField } from "../Basic/select";
import { KRenderCommandTextField, KRenderTextField, RenderComplexValueTextField } from "../Basic/textfield";
import { NormalizeCPU, NormalizeNumber } from "../normalizer";
import { ValidatorCPU, ValidatorMemory, ValidatorName, ValidatorRequired, ValidatorSchedule } from "../validator";
import { Envs } from "./Envs";
import { RenderSelectLabels } from "./NodeSelector";
import { Ports } from "./Ports";
import { PreInjectedFiles } from "./preInjectedFiles";
import { LivenessProbe, ReadinessProbe } from "./Probes";
import { Disks } from "forms/ComponentLike/Disks";
import { shouldError } from "forms/common";
import { formValidateOrNotBlockByTutorial } from "tutorials/utils";
import { TDispatchProp } from "types";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { push } from "connected-react-router";
import { COMPONENT_FORM_ID } from "forms/formIDs";
import { COMPONENT_DEPLOY_BUTTON_ZINDEX } from "layout/Constants";

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

const Configurations = "Configurations";
const DisksTab = "Disks";
export const HealthTab = "Health";
export const NetworkingTab = "Networking";
const Scheduling = "Scheduling";
const Deploy = "Deploy Policy";
const tabs = [Configurations, NetworkingTab, DisksTab, HealthTab, Scheduling, Deploy];

const mapStateToProps = (state: RootState) => {
  const fieldValues = (getFormValues(COMPONENT_FORM_ID)(state) as ComponentLike) || (Immutable.Map() as ComponentLike);
  const syncValidationErrors = getFormSyncErrors(COMPONENT_FORM_ID)(state) as {
    [x in keyof ComponentLikeContent]: any;
  };
  const nodeLabels = getNodeLabels();

  const search = queryString.parse(window.location.search);
  const hash = window.location.hash;
  const anchor = hash.replace("#", "");
  let currentTabIndex = tabs.map((t) => t.replace(/\s/g, "")).indexOf(`${anchor}`);
  if (currentTabIndex < 0) {
    currentTabIndex = 0;
  }

  return {
    tutorialState: state.get("tutorial"),
    search,
    fieldValues,
    isSubmittingApplicationComponent: state.get("applications").get("isSubmittingApplicationComponent"),
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
    sectionTitle: {
      display: "flex",
      alignItems: "center",
    },
    helperField: {
      position: "relative",
    },
    textFieldHelperIcon: {
      color: grey[700],
      cursor: "pointer",
    },

    // Select doesn't support endAdornment
    // and tooltip doesn't work in FormControl
    // https://stackoverflow.com/questions/60384230/tooltip-inside-textinput-label-is-not-working-material-ui-react
    // only way to show helper in Select is using absolute
    selectHelperIcon: {
      color: grey[700],
      cursor: "pointer",
      position: "absolute",
      right: 30,
      top: 10,
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

class ComponentLikeFormRaw extends React.PureComponent<Props, State> {
  private tabs = tabs;

  public componentDidMount() {
    const { dispatch } = this.props;
    // load application plugins schema
    // dispatch(loadApplicationPluginsAction());
    // load component plugins schema
    dispatch(loadComponentPluginsAction());
    // load node labels for node selectors
    dispatch(loadNodesAction());
    // load configs for volume
    // dispatch(loadConfigsAction());
    dispatch(loadStorageClassesAction());
    dispatch(loadPersistentVolumesAction());
  }

  private renderReplicasOrSchedule = () => {
    if (this.props.fieldValues.get("workloadType") !== workloadTypeCronjob) {
      return (
        <Field
          component={RenderComplexValueTextField}
          name="replicas"
          margin
          label="Replicas"
          helperText=""
          formValueToEditValue={(value: any) => {
            return value ? value : 1;
          }}
          editValueToFormValue={(value: any) => {
            return value;
          }}
          normalize={NormalizeNumber}
        />
      );
    }

    return (
      <>
        <Field
          name="schedule"
          component={KRenderTextField}
          placeholder="* * * * *"
          label="Cronjob Schedule"
          required
          validate={[ValidatorSchedule]}
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
  };

  private getCPUHelper() {
    return (
      <HelperContainer>
        <MList dense={true}>
          <ListItem>
            <ListItemText
              primary="CPU"
              secondary={
                "Fractional values are allowed. A Container that requests 0.5 CPU is guaranteed half as much CPU as a Container that requests 1 CPU. You can use the suffix m to mean milli. For example 100m CPU, 100 milliCPU, and 0.1 CPU are all the same. Precision finer than 1m is not allowed. CPU is always requested as an absolute quantity, never as a relative quantity; 0.1 is the same amount of CPU on a single-core, dual-core, or 48-core machine."
              }
              secondaryTypographyProps={{ color: "inherit" }}
            />
          </ListItem>
        </MList>
      </HelperContainer>
    );
  }

  private getMemoryHelper() {
    return (
      <HelperContainer>
        <MList dense={true}>
          <ListItem>
            <ListItemText
              primary="Memory"
              secondary={
                "The memory resource is measured in bytes. You can express memory as a plain integer or a fixed-point integer with one of these suffixes: E, P, T, G, M, K, Ei, Pi, Ti, Gi, Mi, Ki."
              }
              secondaryTypographyProps={{ color: "inherit" }}
            />
          </ListItem>
        </MList>
      </HelperContainer>
    );
  }

  private preInjectedFiles = () => {
    const { classes } = this.props;

    const helperContainer = (
      <HelperContainer>
        <Typography>
          You can inject some files on customized paths before the process is running. This is helpful when the program
          need configuration files.
        </Typography>
      </HelperContainer>
    );

    return (
      <>
        <Grid item xs={12}>
          <SectionTitle>
            <H5>Configuration Files</H5>
            <Tooltip title={helperContainer}>
              <HelpIcon fontSize="small" className={classes.sectionTitleHelperIcon} />
            </Tooltip>
          </SectionTitle>
        </Grid>
        <Grid item xs={12}>
          <PreInjectedFiles />
        </Grid>
      </>
    );
  };

  private renderEnvs() {
    const { classes, sharedEnv } = this.props;
    const helperContainer = (
      <HelperContainer>
        <Typography>
          Environment variables are variable whose values are set outside the program, typically through functionality
          built into the component. An environment variable is made up of a name/value pair, it also support combine a
          dynamic value associated with other component later in a real running application. Learn More.
        </Typography>

        {/* <MList dense={true}>
          <ListItem>
            <ListItemText
              primary="Static"
              secondary={"A constant value environment variable."}
              secondaryTypographyProps={{ color: "inherit" }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="External"
              secondary={
                "Value will be set in an application later. External variable with the same name will be consistent across all components in the same application."
              }
              secondaryTypographyProps={{ color: "inherit" }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Linked"
              secondary={
                "Value will be set in an application later. Linked variable can only be set as another component exposed port address in the same application."
              }
              secondaryTypographyProps={{ color: "inherit" }}
            />
          </ListItem>
        </MList> */}
      </HelperContainer>
    );

    return (
      <>
        <Grid item xs={12}>
          <SectionTitle>
            <H5>Environment variables</H5>
            <Tooltip title={helperContainer}>
              <HelpIcon fontSize="small" className={classes.sectionTitleHelperIcon} />
            </Tooltip>
          </SectionTitle>
        </Grid>{" "}
        <Grid item xs={12}>
          <Envs sharedEnv={sharedEnv} />
        </Grid>
      </>
    );
  }

  public renderPorts() {
    const { classes } = this.props;

    const helperContainer = (
      <HelperContainer>
        <Typography>
          Port is the standard way to expose your program. If you want your component can be accessed by some other
          parts, you need to define a port.
        </Typography>
      </HelperContainer>
    );

    return (
      <>
        <Grid item xs={12}>
          <SectionTitle>
            <H5>Expose ports to cluster</H5>
            <Tooltip title={helperContainer}>
              <HelpIcon fontSize="small" className={classes.sectionTitleHelperIcon} />
            </Tooltip>
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

    const helperContainer = (
      <HelperContainer>
        <Typography>Mount different kinds of volumes to this component.</Typography>
        <MList dense={true}>
          <ListItem>
            <ListItemText
              primary="New Disk"
              secondary={"Create a disk according to the storageClass definition you selected."}
              secondaryTypographyProps={{ color: "inherit" }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Temporary Disk"
              secondary={
                "This sort of volumes are stored on whatever medium is backing the node, which might be disk or SSD or network storage, depending on your environment."
              }
              secondaryTypographyProps={{ color: "inherit" }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Temporary Memory Media Disk"
              secondary={
                "It will mount a tmpfs (RAM-backed filesystem) for you. While tmpfs is very fast, be aware that unlike disks, tmpfs is cleared on node reboot and any files you write will count against your Container’s memory limit."
              }
              secondaryTypographyProps={{ color: "inherit" }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Existing Persistent Volume Claim"
              secondary={
                "PersistentVolumeClaim and Disk are a kubernetes original resources. A persistentVolumeClaim volume is used to mount a Disk into a Pod. Disks are a way for users to “claim” durable storage (such as a GCE PersistentDisk or an iSCSI volume) without knowing the details of the particular cloud environment."
              }
              secondaryTypographyProps={{ color: "inherit" }}
            />
          </ListItem>
        </MList>
      </HelperContainer>
    );

    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Body>Mount various type of disks into your component.</Body>
        </Grid>
        <Grid item xs={12}>
          <SectionTitle>
            <H5>Disks</H5>
            <Tooltip title={helperContainer}>
              <HelpIcon fontSize="small" className={classes.sectionTitleHelperIcon} />
            </Tooltip>
          </SectionTitle>
        </Grid>
        <Grid item xs={12}>
          <Disks />
        </Grid>
      </Grid>
    );
  }

  private getRestartStrategyHelper() {
    return (
      <>
        <HelperContainer>
          <Typography>
            In most cases, the default values for the following options are appropriate for most programs. However, you
            can modify them as required. Before you do so, make sure you understand what these options do.
          </Typography>
        </HelperContainer>
        <Box mt={3}></Box>
        <MList dense={true}>
          <ListItem>
            <ListItemText
              primary="Rolling Update"
              secondary={
                <>
                  This component updates in a rolling update fashion when strategy is RollingUpdate. You can specify
                  maxUnavailable and maxSurge to control the rolling update process.
                  <a
                    target="_blank"
                    href="https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-update-deployment"
                    rel="noopener noreferrer"
                  >
                    Read More
                  </a>
                  .
                </>
              }
              secondaryTypographyProps={{ color: "inherit" }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Memory"
              secondary={
                <>
                  All existing components are killed before new ones are created.
                  <a
                    target="_blank"
                    href="https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#recreate-deployment"
                    rel="noopener noreferrer"
                  >
                    Read More
                  </a>
                  .
                </>
              }
              secondaryTypographyProps={{ color: "inherit" }}
            />
          </ListItem>
        </MList>
      </>
    );
  }

  private getTerminationGracePeriodSecondsHelper() {
    return this.renderAdvancedHelper([
      {
        title: "Termination Grace Period Seconds",
        content: (
          <>
            Kubernetes waits for a specified time called the termination grace period. By default, this is 30 seconds.
            <a
              target="_blank"
              href="https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-update-deployment"
              rel="noopener noreferrer"
            >
              Read More
            </a>
            .
          </>
        ),
      },
    ]);
  }

  private getDnsPolicyHelper() {
    return (
      <>
        <Typography>DNS policies can be set on a component.</Typography>
        {this.renderAdvancedHelper([
          {
            title: "Default",
            content: (
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
            title: "ClusterFirst",
            content: (
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
            title: "ClusterFirstWithHostNet",
            content: (
              <>
                For Pods running with hostNetwork, you should explicitly set its DNS policy “ClusterFirstWithHostNet”.
              </>
            ),
          },
          {
            title: "None",
            content: <>It allows a Pod to ignore DNS settings from the Kubernetes environment.</>,
          },
        ])}
      </>
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
            <H5>DNS Policy</H5>
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

  //   const helperContainer = (
  //     <HelperContainer>
  //       <Typography>
  //         Plugins can affect running state of a program, or provide extra functionality for the programs.
  //       </Typography>
  //     </HelperContainer>
  //   );

  //   return (
  //     <>
  //       <SectionTitle>
  //         <H5>Plugins</H5>
  //         <Tooltip title={helperContainer}>
  //           <HelpIcon fontSize="small" className={classes.sectionTitleHelperIcon} />
  //         </Tooltip>
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
    const { classes } = this.props;

    return (
      <>
        <Grid item xs={12}>
          <SectionTitle>
            <H5>Command</H5>
            <Tooltip
              title={
                <span>
                  This filed is used to overwrite <strong>entrypoint</strong> and <strong>commands</strong> in image.
                  Leave it blank to use image default settings.
                </span>
              }
            >
              <HelpIcon fontSize="small" className={classes.sectionTitleHelperIcon} />
            </Tooltip>
          </SectionTitle>
        </Grid>

        <Grid item xs={12}>
          <Field
            component={KRenderCommandTextField}
            name="command"
            label="Command"
            placeholder="eg: `npm run start` or `bundle exec rails server`"
          />
        </Grid>
      </>
    );
  }

  private renderConfigurations() {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Body>
            Tell kapp more about how to run the project. Customize the <strong>command</strong>,{" "}
            <strong>environment variables</strong> and <strong>configuration files</strong> of this component.
          </Body>
        </Grid>
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
            <H5>Readiness Probe</H5>
            <Tooltip title={"Readiness probe is used to decide when a component is ready to accepting traffic."}>
              <HelpIcon fontSize="small" className={classes.sectionTitleHelperIcon} />
            </Tooltip>
          </SectionTitle>
        </Grid>
        <Grid item xs={12}>
          <ReadinessProbe />
        </Grid>
        <Grid item xs={12}>
          <SectionTitle>
            <H5>Liveness Probe</H5>
            <Tooltip
              title={
                "Liveness probe is used to know if the component is running into an unexpected state and a restart is required."
              }
            >
              <HelpIcon fontSize="small" className={classes.sectionTitleHelperIcon} />
            </Tooltip>
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
          <H5>Networking</H5>
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
        {/* <Grid item xs={12}>
          <Body>
            Tell kapp more about how to schedule this component. Now there are <Chip size="small" label={"10"} /> nodes
            in this cluster. Base on the following settings, <Chip size="small" label={"10"} /> are available for
            running this component.
          </Body>
        </Grid> */}
        <Grid item xs={12}>
          <SectionTitle>
            <H5>Resources</H5>
          </SectionTitle>
        </Grid>

        <Grid item xs={6}>
          <Field
            component={KRenderTextField}
            name="cpu"
            label="CPU Limit"
            validate={[ValidatorCPU]}
            normalize={NormalizeCPU}
            placeholder="Please type CPU limit"
            helperText="Eg. 1 = 1Core; 0.1 = 100m = 0.1Core"
            endAdornment={
              <Tooltip title={this.getCPUHelper()}>
                <HelpIcon fontSize="small" className={classes.textFieldHelperIcon} />
              </Tooltip>
            }
          />
        </Grid>

        <Grid item xs={6}>
          <Field
            component={KRenderTextField}
            name="memory"
            label="Memory Limit"
            margin
            validate={[ValidatorMemory]}
            // normalize={NormalizeMemory}
            placeholder="Please type memory limit"
            endAdornment={
              <Tooltip title={this.getMemoryHelper()}>
                <HelpIcon fontSize="small" className={classes.textFieldHelperIcon} />
              </Tooltip>
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
            <H5>Nodes</H5>
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
    const { classes } = this.props;
    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SectionTitle>
            <H5>Restart Strategy</H5>
          </SectionTitle>
        </Grid>
        <Grid item xs={12}>
          <Field
            defaultValue="RollingUpdate"
            component={KRadioGroupRender}
            name="restartStrategy"
            options={[
              {
                value: "RollingUpdate",
                label:
                  "Rolling update. The new and old instances exist at the same time. The old ones will be gradually replaced by the new ones.",
              },
              {
                value: "Recreate",
                label: "Stop all existing instances before creating new ones.",
              },
            ]}
          />
          {/* <div className={classes.helperField}>
            <Field
              name="restartStrategy"
              component={RenderSelectField}
              // validate={ValidatorRequired}
              label="Restart Strategy"
              options={[
                { value: "RollingUpdate", text: "Rolling Update" },
                { value: "Recreate", text: "Recreate" }
              ]}></Field>
            <Tooltip title={this.getRestartStrategyHelper()}>
              <HelpIcon fontSize="small" className={classes.selectHelperIcon} />
            </Tooltip>
          </div> */}
        </Grid>
        <Grid item xs={12}>
          <SectionTitle>
            <H5>Graceful termination</H5>
          </SectionTitle>
        </Grid>
        <Grid item xs={12}>
          <Body>
            Old instances will be terminated when an upgrade/delete is proformed. Kapp will wait for a while (called
            Termination Grace Period Seconds) for the program to exit properly. When the grace period expires, any
            processes still running are killed with SIGKILL.
          </Body>
        </Grid>
        <Grid item xs={12}>
          <Field
            component={KRenderTextField}
            name="terminationGracePeriodSeconds"
            label="Termination Grace Period Seconds"
            // validate={ValidatorRequired}
            normalize={NormalizeNumber}
            placeholder="Default 30s"
            endAdornment={
              <Tooltip title={this.getTerminationGracePeriodSecondsHelper()}>
                <HelpIcon fontSize="small" className={classes.textFieldHelperIcon} />
              </Tooltip>
            }
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
            component={KRenderTextField}
            name="name"
            label="Name"
            margin
            validate={[ValidatorRequired, ValidatorName]}
            disabled={isEdit}
            helperText={
              isEdit
                ? "Name can't be changed."
                : 'The characters allowed in names are: digits (0-9), lower case letters (a-z), and "-". Max length is 180.'
            }
            placeholder="Please type the component name"
          />
        </Grid>
        <Grid item xs={6}>
          <Field
            component={KRenderTextField}
            name="image"
            label="Image"
            margin
            validate={[ValidatorRequired]}
            helperText='Eg: "nginx:latest", "registry.example.com/group/repo:tag"'
          />
        </Grid>

        <Grid item xs={6}>
          <Field
            name="workloadType"
            component={RenderSelectField}
            label="Workload Type"
            validate={[ValidatorRequired]}
            options={[
              { value: workloadTypeServer, text: "Server (continuous running)" },
              { value: workloadTypeCronjob, text: "Cronjob (periodic running)" },
            ]}
          ></Field>
        </Grid>
        <Grid item xs={6}>
          {this.renderReplicasOrSchedule()}
        </Grid>
      </Grid>
    );
  }

  private renderDeployButton() {
    const { classes, handleSubmit, isSubmittingApplicationComponent } = this.props;
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
          >
            Deploy
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
          title={"Basic Information"}
          content={
            <Box p={2} tutorial-anchor-id="component-from-basic">
              {this.renderMain()}
            </Box>
          }
        />
        <Box mt={2}>
          <KPanel
            title={"Advanced Settings"}
            content={
              <>
                {this.renderTabs()}
                <Box p={2}>{this.renderTabDetails()}</Box>
              </>
            }
          />
        </Box>
        {process.env.REACT_APP_DEBUG ? (
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
