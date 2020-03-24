import { Box, Divider, Grid, List as MList, ListItem, ListItemText, MenuItem, Paper } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { InjectedFormProps } from "redux-form";
import { Field, getFormValues, reduxForm } from "redux-form/immutable";
import { RootState } from "../../reducers";
import { HelperContainer } from "../../widgets/Helper";
import { CustomTextField, RenderSelectField, RenderTextField } from "../Basic";
import { NormalizeNumber } from "../normalizer";
import { ValidatorRequired, ValidatorSchedule, ValidatorName } from "../validator";
import { Envs } from "./Envs";
import { Ports } from "./Ports";
import { ComponentResources } from "./resources";
import { Plugins } from "./Plugins";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Immutable from "immutable";
import { ComponentLike, workloadTypeCronjob, workloadTypeServer } from "../../types/componentTemplate";
import { Volumes } from "./volumes";

const mapStateToProps = (state: RootState) => {
  const values = getFormValues("componentLike")(state) as ComponentLike;
  return {
    values
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      width: "100%"
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
      padding: theme.spacing(2),
      margin: theme.spacing(3)
    },
    displayBlock: {
      display: "block"
    }
  });

interface RawProps {
  isEdit?: boolean;
  showDataView?: boolean;
  showSubmitButton?: boolean;
  submitButtonText?: string;
  isFolded?: boolean;
}

export interface Props
  extends InjectedFormProps<ComponentLike, RawProps>,
    ReturnType<typeof mapStateToProps>,
    WithStyles<typeof styles>,
    DispatchProp,
    RawProps {}

interface State {
  currentPanel: string;
}

class ComponentLikeFormRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      currentPanel: "basic"
    };
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
    const { classes, isEdit, isFolded } = this.props;
    return (
      <Grid container spacing={2}>
        <Grid item md={12}>
          {!isFolded && (
            <Typography
              variant="h2"
              classes={{
                root: classes.sectionHeader
              }}>
              Basic Info
            </Typography>
          )}
          <HelperContainer>
            <Typography>Describe how to launch this compoent.</Typography>
          </HelperContainer>
        </Grid>
        <Grid item md={6}>
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
          <Field name="workloadType" component={RenderSelectField} label="Workload Type" validate={[ValidatorRequired]}>
            <MenuItem value={workloadTypeServer}>Server (continuous running)</MenuItem>
            <MenuItem value={workloadTypeCronjob}>Cronjob (periodic running)</MenuItem>
          </Field>
          {this.renderSchedule()}
        </Grid>
        <Grid item md={6}>
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
        </Grid>
      </Grid>
    );
  }

  private renderEnvs() {
    const { classes, isFolded } = this.props;
    return (
      <>
        {!isFolded && (
          <Typography
            variant="h2"
            classes={{
              root: classes.sectionHeader
            }}>
            Environment variables
          </Typography>
        )}
        <HelperContainer>
          <Typography>
            Environment variables are variable whose values are set outside the program, typically through functionality
            built into the component. An environment variable is made up of a name/value pair, it also support combine a
            dynamic value associated with other component later in a real running application. Learn More.
          </Typography>
          <MList dense={true}>
            <ListItem>
              <ListItemText primary="Static" secondary={"A constant value environment variable."} />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="External"
                secondary={
                  "Value will be set in an application later. External variable with the same name will be consistent across all components in the same application."
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Linked"
                secondary={
                  "Value will be set in an application later. Linked variable can only be set as another component exposed port address in the same application."
                }
              />
            </ListItem>
          </MList>
        </HelperContainer>
        {/* <CustomEnvs /> */}
        <Envs />
      </>
    );
  }

  public renderPorts() {
    const { classes, isFolded } = this.props;
    return (
      <>
        {!isFolded && (
          <Typography
            variant="h2"
            classes={{
              root: classes.sectionHeader
            }}>
            Ports
          </Typography>
        )}
        <HelperContainer>
          <Typography>
            Port is the standard way to expose your program. If you want your component can be accessed by some other
            parts, you need to define a port.
          </Typography>
        </HelperContainer>
        <Ports />
      </>
    );
  }

  private renderResources() {
    const { classes, isFolded, values, dispatch, form } = this.props;
    return (
      <>
        {!isFolded && (
          <Typography
            variant="h2"
            classes={{
              root: classes.sectionHeader
            }}>
            Resources
          </Typography>
        )}
        <HelperContainer>
          <Typography>Cpu, Memory, Disk can be configured here.</Typography>
          <MList dense={true}>
            <ListItem>
              <ListItemText
                primary="CPU"
                secondary={
                  "Fractional values are allowed. A Container that requests 0.5 CPU is guaranteed half as much CPU as a Container that requests 1 CPU. You can use the suffix m to mean milli. For example 100m CPU, 100 milliCPU, and 0.1 CPU are all the same. Precision finer than 1m is not allowed. CPU is always requested as an absolute quantity, never as a relative quantity; 0.1 is the same amount of CPU on a single-core, dual-core, or 48-core machine."
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Memory"
                secondary={
                  "The memory resource is measured in bytes. You can express memory as a plain integer or a fixed-point integer with one of these suffixes: E, P, T, G, M, K, Ei, Pi, Ti, Gi, Mi, Ki. For example, the following represent approximately the same value:"
                }
              />
            </ListItem>
          </MList>
        </HelperContainer>
        <ComponentResources cpu={values.get("cpu")} memory={values.get("memory")} dispatch={dispatch} formName={form} />
      </>
    );
  }

  private renderVolumes() {
    const { classes, isFolded } = this.props;
    return (
      <>
        {!isFolded && (
          <Typography
            variant="h2"
            classes={{
              root: classes.sectionHeader
            }}>
            Volumes
          </Typography>
        )}
        <HelperContainer>
          <Typography>Mount different kinds of volumes to this component.</Typography>
          <MList dense={true}>
            <ListItem>
              <ListItemText
                primary="New Disk"
                secondary={"Create a disk according to the storageClass definition you selected."}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Temporary Disk"
                secondary={
                  "This sort of volumes are stored on whatever medium is backing the node, which might be disk or SSD or network storage, depending on your environment."
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Temporary Memory Media Disk"
                secondary={
                  "It will mount a tmpfs (RAM-backed filesystem) for you. While tmpfs is very fast, be aware that unlike disks, tmpfs is cleared on node reboot and any files you write will count against your Container’s memory limit."
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Existing Persistent Volume Claim"
                secondary={
                  "PersistentVolumeClaim and PersistentVolume are a kubernetes original resources. A persistentVolumeClaim volume is used to mount a PersistentVolume into a Pod. PersistentVolumes are a way for users to “claim” durable storage (such as a GCE PersistentDisk or an iSCSI volume) without knowing the details of the particular cloud environment."
                }
              />
            </ListItem>
          </MList>
        </HelperContainer>
        <Volumes />
      </>
    );
  }

  private renderAdvanced() {
    const { classes, isFolded } = this.props;

    // strategy:
    //   type: Recreate
    // terminationGracePeriodSeconds
    // dnsPolicy
    // imagePullSecrets

    // livenessProbe:
    // httpGet:
    //   path: /
    //   port: 3000
    //   scheme: HTTP
    // initialDelaySeconds: 60
    // timeoutSeconds: 3
    // periodSeconds: 10
    // successThreshold: 1
    // failureThreshold: 6
    return (
      <Grid container>
        <Grid item md={12}>
          {!isFolded && (
            <Typography
              variant="h2"
              classes={{
                root: classes.sectionHeader
              }}>
              Advanced
            </Typography>
          )}
          <HelperContainer>
            <Typography>
              In most cases, the default values for the following options are appropriate for most programs. However,
              you can modify them as required. Before you do so, make sure you understand what these options do.
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
              />
            </ListItem>
          </MList>
          <Field
            name="restartStrategy"
            component={RenderSelectField}
            label="Restart Strategy"
            validate={ValidatorRequired}>
            <MenuItem value="RollingUpdate">Rolling Update</MenuItem>
            <MenuItem value="Recreate">Recreate</MenuItem>
          </Field>

          {/* terminationGracePeriodSeconds */}
          {this.renderAdvancedDivider()}
          {this.renderAdvancedHelper([
            {
              title: "Termination Grace Period Seconds",
              content: (
                <>
                  Kubernetes waits for a specified time called the termination grace period. By default, this is 30
                  seconds.
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
          ])}
          <CustomTextField
            name="terminationGracePeriodSeconds"
            label="Termination Grace Period Seconds"
            validate={ValidatorRequired}
            normalize={NormalizeNumber}
          />

          {/* dnsPolicy */}
          {this.renderAdvancedDivider()}
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
                  Any DNS query that does not match the configured cluster domain suffix, such as “www.kubernetes.io”,
                  is forwarded to the upstream nameserver inherited from the node. Cluster administrators may have extra
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
          <Field name="dnsPolicy" component={RenderSelectField} label="Dns Policy" validate={ValidatorRequired}>
            <MenuItem value="ClusterFirst">ClusterFirst</MenuItem>
            <MenuItem value="Default">Default</MenuItem>
            <MenuItem value="ClusterFirstWithHostNet">ClusterFirstWithHostNet</MenuItem>
            <MenuItem value="None">None</MenuItem>
          </Field>
        </Grid>
      </Grid>
    );
  }

  private renderAdvancedDivider = () => {
    return (
      <Box pt={4} pb={3}>
        <Divider />
      </Box>
    );
  };

  private renderAdvancedHelper = (options: { title: string; content: React.ReactNode }[]) => {
    return (
      <MList dense={true}>
        {options.map((x, index) => (
          <ListItem key={index}>
            <ListItemText primary={x.title} key={index} secondary={x.content} />
          </ListItem>
        ))}
      </MList>
    );
  };

  private renderPlugins() {
    const { classes, isFolded } = this.props;
    return (
      <>
        {!isFolded && (
          <Typography
            variant="h2"
            classes={{
              root: classes.sectionHeader
            }}>
            Plugins
          </Typography>
        )}
        <HelperContainer>
          <Typography>
            Plugins can affect running state of a program, or provide extra functionality for the programs.
          </Typography>
        </HelperContainer>
        <Plugins />
      </>
    );
  }

  private handleChangePanel(key: string) {
    this.setState({ currentPanel: key });
  }

  private renderPanel(key: string, title: string, content: any): React.ReactNode {
    const { classes } = this.props;
    return (
      <ExpansionPanel expanded={key === this.state.currentPanel} onChange={() => this.handleChangePanel(key)}>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
          {title}
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.displayBlock}>{content}</ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }

  public render() {
    const { handleSubmit, classes, isFolded } = this.props;

    if (isFolded) {
      return (
        <form onSubmit={handleSubmit} style={{ height: "100%", overflow: "hidden" }}>
          {this.renderPanel("basic", "Basic Info", this.renderBasic())}
          {this.renderPanel("envs", "Environment variables", this.renderEnvs())}
          {this.renderPanel("ports", "Ports", this.renderPorts())}
          {this.renderPanel("resources", "Resources", this.renderResources())}
          {this.renderPanel("volumes", "Volumes", this.renderVolumes())}
          {this.renderPanel("advanced", "Advanced", this.renderAdvanced())}
          {this.renderPanel("plugins", "Plugins", this.renderPlugins())}
        </form>
      );
    }

    return (
      <form onSubmit={handleSubmit} style={{ height: "100%", overflow: "hidden" }}>
        <Paper className={classes.formSection}>{this.renderBasic()}</Paper>
        <Paper className={classes.formSection}>{this.renderEnvs()}</Paper>
        <Paper className={classes.formSection}>{this.renderPorts()}</Paper>
        <Paper className={classes.formSection}>{this.renderResources()}</Paper>
        <Paper className={classes.formSection}>{this.renderVolumes()}</Paper>
        <Paper className={classes.formSection}>{this.renderAdvanced()}</Paper>
        <Paper className={classes.formSection}>{this.renderPlugins()}</Paper>
      </form>
    );
  }
}

const initialValues: ComponentLike = Immutable.fromJS({
  command: Immutable.List([])
});

export const ComponentLikeForm = reduxForm<ComponentLike, RawProps>({
  form: "componentLike",
  initialValues,
  onSubmitFail: console.log
})(connect(mapStateToProps)(withStyles(styles)(ComponentLikeFormRaw)));
