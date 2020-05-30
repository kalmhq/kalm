import {
  Box,
  Grid,
  List as MList,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  Tooltip
} from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import HelpIcon from "@material-ui/icons/Help";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { InjectedFormProps } from "redux-form";
import { Field, getFormSyncErrors, getFormValues, reduxForm } from "redux-form/immutable";
import { H5, SectionTitle } from "widgets/Label";
import { loadComponentPluginsAction } from "../../actions/application";
import { loadConfigsAction } from "../../actions/config";
import { loadNodesAction } from "../../actions/node";
import { RootState } from "../../reducers";
import { getNodeLabels } from "../../selectors/node";
import { TDispatchProp } from "../../types";
import { SharedEnv } from "../../types/application";
import { ComponentLike, workloadTypeCronjob, workloadTypeServer } from "../../types/componentTemplate";
import { HelperContainer } from "../../widgets/Helper";
import { KRadioGroupRender } from "../Basic/radio";
import { RenderSelectField } from "../Basic/select";
import { KRenderTextField, RenderComplexValueTextField } from "../Basic/textfield";
import { NormalizeNumber } from "../normalizer";
import { ValidatorCPU, ValidatorMemory, ValidatorName, ValidatorRequired, ValidatorSchedule } from "../validator";
import { Configs } from "./Configs";
import { Envs } from "./Envs";
import { RenderSelectLabels } from "./NodeSelector";
import { Plugins } from "./Plugins";
import { Ports } from "./Ports";
import { LivenessProbe, ReadinessProbe } from "./Probes";
import { Volumes } from "./Volumes";

const mapStateToProps = (state: RootState) => {
  const values = getFormValues("componentLike")(state) as ComponentLike;
  const syncErrors = getFormSyncErrors("componentLike")(state);
  const nodeLabels = getNodeLabels();

  return {
    values,
    syncErrors,
    nodeLabels
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      width: "100%",
      padding: 20
      // backgroundColor: theme.palette.background.paper
    },
    paper: {
      padding: theme.spacing(2),
      marginBottom: theme.spacing(2)
    },
    formSection: {
      // padding: "0 20px"
      // margin: "0 0 10px 0"
    },
    displayBlock: {
      display: "block"
    },
    displayNone: {
      display: "none"
    },
    sectionTitle: {
      display: "flex",
      alignItems: "center"
    },
    helperField: {
      position: "relative"
    },
    helperFieldIcon: {
      color: grey[700],
      cursor: "pointer",
      position: "absolute",
      right: 10,
      top: 18
    },
    helperSelectIcon: {
      color: grey[700],
      cursor: "pointer",
      position: "absolute",
      right: 30,
      top: 10
    },
    helperTextIcon: {
      color: grey[700],
      cursor: "pointer",
      marginLeft: "8px"
    },
    tabs: {
      margin: `16px -16px -16px`
    }
  });

interface RawProps {
  showDataView?: boolean;
  showSubmitButton?: boolean;
  submitButtonText?: string;
  sharedEnv?: Immutable.List<SharedEnv>;
  currentTab?: string;
  // submitAppplicationErrors?: Immutable.Map<string, any>;
}

export interface Props
  extends InjectedFormProps<ComponentLike, RawProps>,
    ReturnType<typeof mapStateToProps>,
    WithStyles<typeof styles>,
    TDispatchProp,
    RawProps {}

interface State {
  currentTab: number;
}

const Resources = "Resources";
const Health = "Health";
const Networking = "Networking";
const NodeScheduling = "Node Scheduling";
const UpgradePolicy = "Upgrade Policy";

class ComponentLikeFormRaw extends React.PureComponent<Props, State> {
  private tabs = [Resources, Health, Networking, NodeScheduling, UpgradePolicy];

  constructor(props: Props) {
    super(props);

    this.state = {
      currentTab: 0
    };
  }

  public componentDidMount() {
    const { dispatch } = this.props;
    // load application plugins schema
    // dispatch(loadApplicationPluginsAction());
    // load component plugins schema
    dispatch(loadComponentPluginsAction());
    // load node labels for node selectors
    dispatch(loadNodesAction());
    // load configs for volume
    dispatch(loadConfigsAction());
  }

  private renderReplicasOrSchedule() {
    if (this.props.values.get("workloadType") !== workloadTypeCronjob) {
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
          placeholder="* * * * * *"
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
  }

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
                "The memory resource is measured in bytes. You can express memory as a plain integer or a fixed-point integer with one of these suffixes: E, P, T, G, M, K, Ei, Pi, Ti, Gi, Mi, Ki. For example, the following represent approximately the same value:"
              }
              secondaryTypographyProps={{ color: "inherit" }}
            />
          </ListItem>
        </MList>
      </HelperContainer>
    );
  }

  private renderEnvs() {
    const { classes, sharedEnv } = this.props;
    const helperContainer = (
      <HelperContainer>
        <Typography>
          Environment variables are variable whose values are set outside the program, typically through functionality
          built into the component. An environment variable is made up of a name/value pair, it also support combine a
          dynamic value associated with other component later in a real running application. Learn More.
        </Typography>
        <MList dense={true}>
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
        </MList>
      </HelperContainer>
    );

    return (
      <>
        <Grid item xs={12} sm={12} md={12}>
          <SectionTitle>
            <H5>Environment variables</H5>
            <Tooltip title={helperContainer}>
              <HelpIcon fontSize="small" className={classes.helperTextIcon} />
            </Tooltip>
          </SectionTitle>
        </Grid>{" "}
        <Grid item xs={12} sm={12} md={12}>
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
        <Grid item xs={12} sm={12} md={12}>
          <SectionTitle>
            <H5>Ports</H5>
            <Tooltip title={helperContainer}>
              <HelpIcon fontSize="small" className={classes.helperTextIcon} />
            </Tooltip>
          </SectionTitle>
        </Grid>
        <Grid item xs={12} sm={12} md={12}>
          <Ports />
        </Grid>
      </>
    );
  }

  private renderVolumes() {
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
                "PersistentVolumeClaim and PersistentVolume are a kubernetes original resources. A persistentVolumeClaim volume is used to mount a PersistentVolume into a Pod. PersistentVolumes are a way for users to “claim” durable storage (such as a GCE PersistentDisk or an iSCSI volume) without knowing the details of the particular cloud environment."
              }
              secondaryTypographyProps={{ color: "inherit" }}
            />
          </ListItem>
        </MList>
      </HelperContainer>
    );

    return (
      <>
        <Grid item xs={12} sm={12} md={12}>
          <SectionTitle>
            <H5>Volumes</H5>
            <Tooltip title={helperContainer}>
              <HelpIcon fontSize="small" className={classes.helperTextIcon} />
            </Tooltip>
          </SectionTitle>
        </Grid>
        <Grid item xs={12} sm={12} md={12}>
          <Volumes />
        </Grid>
      </>
    );
  }

  private renderConfigs() {
    // const { classes } = this.props;

    // const helperContainer = (
    //   <HelperContainer>
    //     <Typography>Mount Configs</Typography>
    //   </HelperContainer>
    // );

    return (
      <>
        <Grid item xs={12} sm={12} md={12}>
          <SectionTitle>
            <H5>Configs</H5>
            {/* <Tooltip title={helperContainer}>
            <HelpIcon fontSize="small" className={classes.helperTextIcon} />
          </Tooltip> */}
          </SectionTitle>
        </Grid>{" "}
        <Grid item xs={12} sm={12} md={12}>
          <Configs />
        </Grid>
      </>
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
                    rel="noopener noreferrer">
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
                    rel="noopener noreferrer">
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
              rel="noopener noreferrer">
              Read More
            </a>
            .
          </>
        )
      }
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
                  rel="noopener noreferrer">
                  related discussion
                </a>{" "}
                for more details.
              </>
            )
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
                  rel="noopener noreferrer">
                  related discussion
                </a>{" "}
                for details on how DNS queries are handled in those cases.
              </>
            )
          },
          {
            title: "ClusterFirstWithHostNet",
            content: (
              <>
                For Pods running with hostNetwork, you should explicitly set its DNS policy “ClusterFirstWithHostNet”.
              </>
            )
          },
          {
            title: "None",
            content: <>It allows a Pod to ignore DNS settings from the Kubernetes environment.</>
          }
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
              rel="noopener noreferrer">
              related discussion
            </a>{" "}
            for more details.
          </>
        )
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
              rel="noopener noreferrer">
              related discussion
            </a>{" "}
            for details on how DNS queries are handled in those cases.
          </>
        )
      },
      {
        value: "ClusterFirstWithHostNet",
        label: "ClusterFirstWithHostNet",
        explain: (
          <>For Pods running with hostNetwork, you should explicitly set its DNS policy “ClusterFirstWithHostNet”.</>
        )
      },
      {
        value: "None",
        label: "None",
        explain: <>It allows a Pod to ignore DNS settings from the Kubernetes environment.</>
      }
    ];
  }

  private renderDnsPolicy() {
    return (
      <>
        <Grid item xs={12} sm={12} md={12}>
          <SectionTitle>
            <H5>DNS Policy</H5>
          </SectionTitle>
        </Grid>
        {/* <Grid item xs={6} sm={6} md={6}>
          <div className={classes.helperField}>
            <Field
              name="dnsPolicy"
              component={RenderSelectField}
              label="Dns Policy"
              // validate={ValidatorRequired}
            >
              <MenuItem value="ClusterFirst">ClusterFirst</MenuItem>
              <MenuItem value="Default">Default</MenuItem>
              <MenuItem value="ClusterFirstWithHostNet">ClusterFirstWithHostNet</MenuItem>
              <MenuItem value="None">None</MenuItem>
            </Field>
            <Tooltip title={this.getDnsPolicyHelper()}>
              <HelpIcon fontSize="small" className={classes.helperSelectIcon} />
            </Tooltip>
          </div>
        </Grid> */}
        <Grid item xs={12} sm={12} md={12}>
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

  private renderPlugins() {
    const { classes } = this.props;

    const helperContainer = (
      <HelperContainer>
        <Typography>
          Plugins can affect running state of a program, or provide extra functionality for the programs.
        </Typography>
      </HelperContainer>
    );

    return (
      <>
        <SectionTitle>
          <H5>Plugins</H5>
          <Tooltip title={helperContainer}>
            <HelpIcon fontSize="small" className={classes.helperTextIcon} />
          </Tooltip>
        </SectionTitle>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={12}>
            <Plugins />
          </Grid>
        </Grid>
      </>
    );
  }

  private renderLaunchItems() {
    return (
      <>
        <Grid item xs={12} sm={12} md={12}>
          <SectionTitle>
            <H5>Launch Items</H5>
          </SectionTitle>
        </Grid>

        <Grid item xs={6} sm={6} md={6}>
          <Field
            component={RenderComplexValueTextField}
            name="command"
            margin
            label="Command (Optional)"
            helperText='Eg: "/bin/app", "rails server".'
            formValueToEditValue={(value: Immutable.List<string>) => {
              return value && value.toArray().join(" ") ? value.toArray().join(" ") : "";
            }}
            editValueToFormValue={(value: any) => {
              return value ? Immutable.List([value]) : Immutable.List([]);
            }}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={6}>
          <Field
            component={RenderComplexValueTextField}
            name="args"
            margin
            label="Arguments (Optional)"
            helperText='Eg: "--port=80"'
            formValueToEditValue={(value: Immutable.List<string>) => {
              return value && value.toArray().join(" ") ? value.toArray().join(" ") : "";
            }}
            editValueToFormValue={(value: string) => {
              return value ? Immutable.List(value.split(" ")) : Immutable.List([]);
            }}
          />
        </Grid>
      </>
    );
  }

  private renderResources() {
    const { classes } = this.props;
    return (
      <>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={12}>
            <SectionTitle>
              <H5>Resources</H5>
            </SectionTitle>
          </Grid>

          <Grid item xs={6} sm={6} md={6}>
            <div className={classes.helperField}>
              <Field
                component={KRenderTextField}
                name="cpu"
                label="CPU"
                margin
                validate={[ValidatorCPU]}
                // normalize={NormalizeCPU}
                placeholder="Please type the component name"
              />
              <Tooltip title={this.getCPUHelper()}>
                <HelpIcon fontSize="small" className={classes.helperFieldIcon} />
              </Tooltip>
            </div>
          </Grid>

          <Grid item xs={6} sm={6} md={6}>
            <div className={classes.helperField}>
              <Field
                component={KRenderTextField}
                name="memory"
                label="Memory"
                margin
                validate={[ValidatorMemory]}
                // normalize={NormalizeMemory}
                placeholder="Please type the component name"
              />
              <Tooltip title={this.getMemoryHelper()}>
                <HelpIcon fontSize="small" className={classes.helperFieldIcon} />
              </Tooltip>
            </div>
          </Grid>

          {this.renderLaunchItems()}
          {this.renderEnvs()}
          {this.renderVolumes()}
          {this.renderConfigs()}
        </Grid>
      </>
    );
  }

  private renderHealth() {
    return (
      <Grid container spacing={2}>
        {/* <Grid item xs={12} sm={12} md={12}>
          <SectionTitle>
            <H5>Health</H5>
          </SectionTitle>
        </Grid> */}
        <Grid item xs={6} sm={6} md={6}>
          <LivenessProbe />
        </Grid>
        <Grid item xs={6} sm={6} md={6}>
          <ReadinessProbe />
        </Grid>
      </Grid>
    );
  }

  private renderNetworking() {
    return (
      <Grid container spacing={2}>
        {/* <Grid item xs={12} sm={12} md={12}>
          <SectionTitle>
          <H5>Networking</H5>
          </SectionTitle>
        </Grid> */}
        {this.renderPorts()}
        {this.renderDnsPolicy()}
      </Grid>
    );
  }

  private getPodAffinityOptions() {
    return [
      {
        value: "PodAffinityTypePreferFanout",
        label: "Prefer Fanout",
        explain: "Deploy Pod average to Nodes."
      },
      {
        value: "PodAffinityTypePreferGather",
        label: "Prefer Gather",
        explain: "Prefer deployment to Node that is already in use."
      }
    ];
  }

  private renderNodeScheduling() {
    const { nodeLabels } = this.props;
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={12} md={12}>
          <SectionTitle>
            <H5>Node Labels</H5>
          </SectionTitle>
        </Grid>
        <Grid item xs={6} sm={6} md={6}>
          <Field name="nodeSelectorLabels" component={RenderSelectLabels} nodeLabels={nodeLabels} />
        </Grid>
        <Grid item xs={12} sm={12} md={12}>
          <SectionTitle>
            <H5>Node Affinity Policy</H5>
          </SectionTitle>
        </Grid>
        <Grid item xs={6} sm={6} md={6}>
          <Field name="podAffinityType" component={KRadioGroupRender} options={this.getPodAffinityOptions()} />
        </Grid>
      </Grid>
    );
  }

  private renderUpgradePolicy() {
    const { classes } = this.props;
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={12} md={12}>
          <SectionTitle>
            <H5>UpgradePolicy</H5>
          </SectionTitle>
        </Grid>
        <Grid item xs={6} sm={6} md={6}>
          <div className={classes.helperField}>
            <Field
              name="restartStrategy"
              component={RenderSelectField}
              // validate={ValidatorRequired}
              label="Restart Strategy">
              <MenuItem value="RollingUpdate">Rolling Update</MenuItem>
              <MenuItem value="Recreate">Recreate</MenuItem>
            </Field>
            <Tooltip title={this.getRestartStrategyHelper()}>
              <HelpIcon fontSize="small" className={classes.helperSelectIcon} />
            </Tooltip>
          </div>
        </Grid>
        <Grid item xs={6} sm={6} md={6}></Grid>
        <Grid item xs={6} sm={6} md={6}>
          <div className={classes.helperField}>
            <Field
              component={KRenderTextField}
              name="terminationGracePeriodSeconds"
              label="Termination Grace Period Seconds"
              // validate={ValidatorRequired}
              normalize={NormalizeNumber}
              margin
            />
            <Tooltip title={this.getTerminationGracePeriodSecondsHelper()}>
              <HelpIcon fontSize="small" className={classes.helperFieldIcon} />
            </Tooltip>
          </div>
        </Grid>
      </Grid>
    );
  }

  private renderTabDetails() {
    const { classes } = this.props;

    return (
      <>
        <div className={`${this.tabs[this.state.currentTab] === Resources ? "" : classes.displayNone}`}>
          {this.renderResources()}
        </div>
        <div className={`${this.tabs[this.state.currentTab] === Health ? "" : classes.displayNone}`}>
          {this.renderHealth()}
        </div>
        <div className={`${this.tabs[this.state.currentTab] === Networking ? "" : classes.displayNone}`}>
          {this.renderNetworking()}
        </div>
        <div className={`${this.tabs[this.state.currentTab] === NodeScheduling ? "" : classes.displayNone}`}>
          {this.renderNodeScheduling()}
        </div>
        <div className={`${this.tabs[this.state.currentTab] === UpgradePolicy ? "" : classes.displayNone}`}>
          {this.renderUpgradePolicy()}
        </div>
      </>
    );
  }

  private renderTabs() {
    const { classes } = this.props;
    return (
      <Tabs
        className={classes.tabs}
        value={this.state.currentTab}
        variant="scrollable"
        scrollButtons="auto"
        indicatorColor="primary"
        textColor="primary"
        onChange={(event: React.ChangeEvent<{}>, value: number) => {
          this.setState({ currentTab: value });
        }}
        aria-label="component form tabs">
        {this.tabs.map(tab => {
          return <Tab key={tab} label={tab} />;
        })}
      </Tabs>
    );
  }

  private renderMainPaper() {
    const { initialValues, classes } = this.props;
    let isEdit = false;
    // @ts-ignore
    if (initialValues && initialValues!.get("name")) {
      isEdit = true;
    }

    return (
      <Paper className={classes.paper}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={6} md={6}>
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
                  : 'The characters allowed in names are: digits (0-9), lower case letters (a-z), "-", and ".". Max length is 180.'
              }
              placeholder="Please type the component name"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={6}>
            <Field
              component={KRenderTextField}
              name="image"
              label="Image"
              margin
              validate={[ValidatorRequired]}
              helperText='Eg: "nginx:latest", "registry.example.com/group/repo:tag"'
            />
          </Grid>

          <Grid item xs={6} sm={6} md={6}>
            <Field
              name="workloadType"
              component={RenderSelectField}
              label="Workload Type"
              validate={[ValidatorRequired]}>
              <MenuItem value={workloadTypeServer}>Server (continuous running)</MenuItem>
              <MenuItem value={workloadTypeCronjob}>Cronjob (periodic running)</MenuItem>
            </Field>
          </Grid>
          <Grid item xs={6} sm={6} md={6}>
            {this.renderReplicasOrSchedule()}
          </Grid>
        </Grid>

        {this.renderTabs()}
      </Paper>
    );
  }

  public render() {
    const { handleSubmit, classes } = this.props;

    return (
      <form onSubmit={handleSubmit} className={classes.root}>
        {this.renderMainPaper()}
        {this.renderTabDetails()}
        {/* <div className={`${classes.formSection} ${currentTab === "advanced" ? "" : ""}`}>{this.renderPlugins()}</div> */}
      </form>
    );
  }
}

export const componentInitialValues: ComponentLike = Immutable.fromJS({
  command: Immutable.List([])
});

export const ComponentLikeForm = reduxForm<ComponentLike, RawProps>({
  form: "componentLike",
  enableReinitialize: true, // seems don't work with redux-form/immutable
  keepDirtyOnReinitialize: false,
  initialValues: componentInitialValues,
  onSubmitFail: console.log
})(connect(mapStateToProps)(withStyles(styles)(ComponentLikeFormRaw)));
