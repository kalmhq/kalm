import { Box, Button, Divider, Grid, List as MList, ListItem, ListItemText, MenuItem } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import { goBack } from "connected-react-router";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { InjectedFormProps } from "redux-form";
import { Field, getFormValues, reduxForm } from "redux-form/immutable";
import { ComponentLike, workloadTypeCronjob, workloadTypeServer } from "../../actions";
import { RootState } from "../../reducers";
import { HelperContainer } from "../../widgets/Helper";
import { CustomTextField, RenderSelectField, RenderTextField } from "../Basic";
import { VerticalTabs } from "../Basic/verticalTabs";
import { NormalizeNumber } from "../normalizer";
import { ValidatorRequired, ValidatorSchedule } from "../validator";
import { Envs } from "./Envs";
import { Ports } from "./Ports";
import ComponentResources from "./resources";

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
    }
  });

interface RawProps {
  isEdit?: boolean;
  showDataView?: boolean;
  showSubmitButton?: boolean;
  submitButtonText?: string;
}

export interface Props
  extends InjectedFormProps<ComponentLike, RawProps>,
    ReturnType<typeof mapStateToProps>,
    WithStyles<typeof styles>,
    DispatchProp,
    RawProps {}

class ComponentLikeFormRaw extends React.PureComponent<Props> {
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
              </a>{" "}
              format string.
            </span>
          }
        />
      </>
    );
  }

  private renderBasic() {
    const { classes, isEdit } = this.props;
    return (
      <Grid container>
        <Grid item md={6}>
          <Typography
            variant="h2"
            classes={{
              root: classes.sectionHeader
            }}>
            Basic Info
          </Typography>
          <HelperContainer>
            <Typography>Describe how to launch this compoent.</Typography>
          </HelperContainer>
          <CustomTextField
            name="name"
            label="Name"
            margin
            validate={[ValidatorRequired]}
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
          />
          <Box mt={3}></Box>
          <Field name="workloadType" component={RenderSelectField} label="Workload Type" validate={[ValidatorRequired]}>
            <MenuItem value={workloadTypeServer}>Server (continuous running)</MenuItem>
            <MenuItem value={workloadTypeCronjob}>Cronjob (periodic running)</MenuItem>
          </Field>
          {this.renderSchedule()}
        </Grid>
      </Grid>
    );
  }

  private renderEnvs() {
    const { classes } = this.props;
    return (
      <>
        <Typography
          variant="h2"
          classes={{
            root: classes.sectionHeader
          }}>
          Environment variables
        </Typography>
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
    const { classes } = this.props;
    return (
      <>
        <Typography
          variant="h2"
          classes={{
            root: classes.sectionHeader
          }}>
          Ports
        </Typography>
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
    const { classes } = this.props;
    return (
      <>
        <Typography
          variant="h2"
          classes={{
            root: classes.sectionHeader
          }}>
          Resources
        </Typography>
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
        <ComponentResources />
      </>
    );
  }

  private renderAdvanced() {
    const { classes } = this.props;

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
        <Grid item md={6}>
          <Typography
            variant="h2"
            classes={{
              root: classes.sectionHeader
            }}>
            Advanced
          </Typography>
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
            <MenuItem value="rollingUpdate">Rolling Update</MenuItem>
            <MenuItem value="recreate">Recreate</MenuItem>
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
          <ListItem>
            <ListItemText primary={x.title} key={index} secondary={x.content} />
          </ListItem>
        ))}
      </MList>
    );
  };

  private renderPlugins() {
    const { classes } = this.props;
    return (
      <Grid container>
        <Grid item md={6}>
          <Typography
            variant="h2"
            classes={{
              root: classes.sectionHeader
            }}>
            Plugins
          </Typography>
          <HelperContainer>
            <Typography>
              In most cases, the default values for the following options are appropriate for most programs. However,
              you can modify them as required. Before you do so, make sure you understand what these options do.
            </Typography>
          </HelperContainer>
        </Grid>
      </Grid>
    );
  }

  public render() {
    const { handleSubmit, submitButtonText } = this.props;
    const tabs = [
      {
        title: "Basic",
        component: this.renderBasic()
      },
      {
        title: "Envrionment Variables",
        component: this.renderEnvs()
      },
      {
        title: "Ports",
        component: this.renderPorts()
      },
      {
        title: "Resources",
        component: this.renderResources()
      },
      {
        title: "Advanced",
        component: this.renderAdvanced()
      },
      {
        title: "Plugins",
        component: this.renderPlugins()
      }
    ];

    return (
      <form onSubmit={handleSubmit} style={{ height: "100%", overflow: "hidden" }}>
        <VerticalTabs
          tabs={tabs}
          tabsBottomContent={
            <>
              <Button variant="contained" color="primary" type="submit">
                {submitButtonText || "Submit"}
              </Button>
              <Button variant="contained" color="default" onClick={() => this.props.dispatch(goBack())}>
                Close
              </Button>
            </>
          }
        />
      </form>
    );
  }
}

export const ComponentLikeForm = reduxForm<ComponentLike, RawProps>({
  form: "componentLike",
  onSubmitFail: console.log
})(connect(mapStateToProps)(withStyles(styles)(ComponentLikeFormRaw)));
