import { Box, Grid, List as MList, ListItem, ListItemText, MenuItem, Tooltip } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import HelpIcon from "@material-ui/icons/Help";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { InjectedFormProps } from "redux-form";
import { Field, getFormSyncErrors, getFormValues, reduxForm } from "redux-form/immutable";
import { H5 } from "widgets/Label";
import { loadApplicationPluginsAction, loadComponentPluginsAction } from "../../actions/application";
import { loadConfigsAction } from "../../actions/config";
import { loadNodesAction } from "../../actions/node";
import { RootState } from "../../reducers";
import { getNodeLabels } from "../../selectors/node";
import { TDispatchProp } from "../../types";
import { SharedEnv } from "../../types/application";
import { ComponentLike, workloadTypeCronjob, workloadTypeServer } from "../../types/componentTemplate";
import { HelperContainer } from "../../widgets/Helper";
import { CustomTextField, RenderSelectField, RenderTextField } from "../Basic";
import { NormalizeNumber } from "../normalizer";
import { ValidatorCPU, ValidatorMemory, ValidatorName, ValidatorRequired, ValidatorSchedule } from "../validator";
import { Configs } from "./Configs";
import { Envs } from "./Envs";
import { AffinityType, CustomLabels } from "./NodeSelector";
import { Plugins } from "./Plugins";
import { Ports } from "./Ports";
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
      padding: theme.spacing(3),
      marginBottom: theme.spacing(5)
    },
    sectionHeader: {
      fontSize: 24,
      fontWeight: 400,
      marginBottom: 16
    },
    formSection: {
      // padding: "0 20px"
      // margin: "0 0 10px 0"
    },
    displayBlock: {
      display: "block"
    },
    summaryError: {
      color: theme.palette.error.main
    },
    summaryBold: {
      fontWeight: "bold"
    },
    summaryIcon: {
      marginLeft: "8px",
      position: "absolute"
    },
    panelSubmitErrors: {},
    summaryShow: {
      display: "block",
      padding: "8px 4px 0px 0px"
    },
    summaryHide: {
      display: "none"
    },
    summaryKey: {
      fontSize: 14,
      fontWeight: 400,
      color: theme.palette.text.secondary
    },
    summaryValue: {
      padding: "0px  10px",
      fontSize: 14,
      fontWeight: 200,
      color: theme.palette.text.secondary
    },
    summaryChanged: {
      fontWeight: 500,
      color: theme.palette.text.primary
    },
    summaryItem: {
      display: "flex"
    },
    summaryValueGroup: {
      display: "flex",
      flexDirection: "column"
    },
    submitErrorItem: {
      display: "flex"
    },
    submitErrorKey: {
      fontWeight: "bold"
    },
    submitErrorValueGroup: {
      marginLeft: "6px"
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
      top: 26
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

interface State {}

class ComponentLikeFormRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  public componentDidMount() {
    const { dispatch } = this.props;
    // load application plugins schema
    dispatch(loadApplicationPluginsAction());
    // load component plugins schema
    dispatch(loadComponentPluginsAction());
    // load node labels for node selectors
    dispatch(loadNodesAction());
    // load configs for volume
    dispatch(loadConfigsAction());
  }

  private renderSchedule() {
    if (this.props.values.get("workloadType") !== workloadTypeCronjob) {
      return null;
    }

    return (
      <>
        <Box mt={3}></Box>
        <Field
          name="schedule"
          component={RenderTextField}
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

  private renderBasic() {
    const { initialValues, classes } = this.props;
    let isEdit = false;
    // @ts-ignore
    if (initialValues && initialValues!.get("name")) {
      isEdit = true;
    }
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} sm={12} md={12}>
          <H5>Basic</H5>
        </Grid>
        <Grid item xs={12} sm={12} md={12}>
          <CustomTextField
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
          <CustomTextField
            name="image"
            label="Image"
            margin
            validate={[ValidatorRequired]}
            helperText='Eg: "nginx:latest", "registry.example.com/group/repo:tag"'
          />

          <CustomTextField
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
          <CustomTextField
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
          <Field name="workloadType" component={RenderSelectField} label="Workload Type" validate={[ValidatorRequired]}>
            <MenuItem value={workloadTypeServer}>Server (continuous running)</MenuItem>
            <MenuItem value={workloadTypeCronjob}>Cronjob (periodic running)</MenuItem>
          </Field>
          {this.renderSchedule()}
          <div className={classes.helperField}>
            <CustomTextField
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
          <div className={classes.helperField}>
            <CustomTextField
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
          <CustomTextField
            name="replicas"
            margin
            label="replicas"
            helperText=""
            formValueToEditValue={(value: any) => {
              return value ? value : 1;
            }}
            editValueToFormValue={(value: any) => {
              return value;
            }}
            normalize={NormalizeNumber}
          />
        </Grid>
        <Grid item xs={12} sm={12} md={12}></Grid>
      </Grid>
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
        <div className={classes.sectionTitle}>
          <H5>Environment variables</H5>
          <Tooltip title={helperContainer}>
            <HelpIcon fontSize="small" className={classes.helperTextIcon} />
          </Tooltip>
        </div>

        {/* <CustomEnvs /> */}
        <Envs sharedEnv={sharedEnv} />
      </>
    );
  }

  public renderPorts() {
    const { classes } = this.props;

    // const helperContainer = (
    //   <HelperContainer>
    //     <Typography>
    //       Port is the standard way to expose your program. If you want your component can be accessed by some other
    //       parts, you need to define a port.
    //     </Typography>
    //   </HelperContainer>
    // );

    return (
      <>
        <div className={classes.sectionTitle}>
          <H5>Ports</H5>
          {/* <Tooltip title={helperContainer}>
            <HelpIcon fontSize="small" className={classes.helperTextIcon} />
          </Tooltip> */}
        </div>

        <Ports />
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
        <div className={classes.sectionTitle}>
          <H5>Volumes</H5>
          <Tooltip title={helperContainer}>
            <HelpIcon fontSize="small" className={classes.helperTextIcon} />
          </Tooltip>
        </div>

        <Volumes />
      </>
    );
  }

  private renderConfigs() {
    const { classes } = this.props;

    // const helperContainer = (
    //   <HelperContainer>
    //     <Typography>Mount Configs</Typography>
    //   </HelperContainer>
    // );

    return (
      <>
        <div className={classes.sectionTitle}>
          <H5>Configs</H5>
          {/* <Tooltip title={helperContainer}>
            <HelpIcon fontSize="small" className={classes.helperTextIcon} />
          </Tooltip> */}
        </div>

        <Configs />
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
                for more details. .
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

  private renderAdvanced() {
    const { classes, nodeLabels } = this.props;

    return (
      <Grid container spacing={1}>
        <Grid item xs={12} sm={12} md={12}>
          <CustomLabels nodeLabels={nodeLabels} />

          <AffinityType />

          {/* <div className={classes.sectionTitle}>
            <H5>Advanced</H5>
            <Tooltip title={helperContainer}>
              <HelpIcon fontSize="small" className={classes.helperTextIcon} />
            </Tooltip>
          </div> */}

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

          <div className={classes.helperField}>
            <CustomTextField
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
        <div className={classes.sectionTitle}>
          <H5>Plugins</H5>
          <Tooltip title={helperContainer}>
            <HelpIcon fontSize="small" className={classes.helperTextIcon} />
          </Tooltip>
        </div>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={12}>
            <Plugins />
          </Grid>
        </Grid>
      </>
    );
  }

  public render() {
    const { handleSubmit, classes, currentTab } = this.props;

    return (
      <form onSubmit={handleSubmit} className={classes.root}>
        <div className={`${classes.formSection} ${currentTab === "basic" ? "" : classes.displayNone}`}>
          {this.renderBasic()}
        </div>
        <div className={`${classes.formSection} ${currentTab === "basic" ? "" : classes.displayNone}`}>
          {this.renderEnvs()}
        </div>
        <div
          className={`${classes.formSection} ${currentTab === "advanced" ? "" : classes.displayNone}`}
          style={{ margin: "0 0 16px" }}>
          {this.renderPorts()}
        </div>
        <div
          className={`${classes.formSection} ${currentTab === "advanced" ? "" : classes.displayNone}`}
          style={{ margin: "0 0 16px" }}>
          {this.renderVolumes()}
        </div>
        <div
          className={`${classes.formSection} ${currentTab === "advanced" ? "" : classes.displayNone}`}
          style={{ margin: "0 0 24px" }}>
          {this.renderConfigs()}
        </div>
        <div
          className={`${classes.formSection} ${currentTab === "advanced" ? "" : classes.displayNone}`}
          style={{ margin: "0 0 16px" }}>
          {this.renderAdvanced()}
        </div>
        <div className={`${classes.formSection} ${currentTab === "advanced" ? "" : classes.displayNone}`}>
          {this.renderPlugins()}
        </div>
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
