import { Box, Divider, Grid, List as MList, ListItem, ListItemText, MenuItem } from "@material-ui/core";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import ErrorIcon from "@material-ui/icons/Error";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import clsx from "clsx";
import { extractSummaryInfoFromList, extractSummaryInfoFromMap } from "forms/summarizer";
import Immutable, { List, Map } from "immutable";
import React from "react";
import { connect } from "react-redux";
import { InjectedFormProps } from "redux-form";
import { Field, getFormSyncErrors, getFormValues, reduxForm } from "redux-form/immutable";
import { Body, H3 } from "widgets/Label";
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
import { ValidatorName, ValidatorRequired, ValidatorSchedule } from "../validator";
import { Configs } from "./Configs";
import { Envs } from "./Envs";
import { AffinityType, CustomLabels } from "./NodeSelector";
import { Plugins } from "./Plugins";
import { Ports } from "./Ports";
import { LivenessProbe, ReadinessProbe } from "./Probes";
import { ComponentResources } from "./resources";
import { Volumes } from "./Volumes";
import { loadComponentPluginsAction } from "../../actions/application";

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
      padding: 20
      // margin: theme.spacing(3)
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
    }
  });

interface RawProps {
  showDataView?: boolean;
  showSubmitButton?: boolean;
  submitButtonText?: string;
  isFolded?: boolean;
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
  currentPanel: string;
}

interface Summary {
  name: string;
  value: any;
  hasChanged: boolean;
}

class ComponentLikeFormRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      currentPanel: "basic"
    };
  }

  public componentDidMount() {
    const { dispatch } = this.props;
    // dispatch(loadApplicationPluginsAction())
    // load component plugins schema
    dispatch(loadComponentPluginsAction());
    // load node labels for node selectors
    dispatch(loadNodesAction());
    // load configs for volume
    dispatch(loadConfigsAction());
  }

  // componentDidUpdate(prevProps: Props) {
  // @ts-ignore
  // if (prevProps.initialValues.get("name") !== this.props.initialValues.get("name")) {
  //   console.log("componentDidUpdate init");
  //   // @ts-ignore
  //   console.log(this.props.initialValues.toJS());
  //   // @ts-ignore
  //   // this.props.dispatch(this.props.initialize(this.props.initialValues));
  //   // this.props.dispatch(reset("componentLike"));
  // this.props.initialize(this.props.initialValues);
  //   // this.props.reset();
  // }
  // if (this.props.submitAppplicationErrors && this.props.submitAppplicationErrors.size > 0) {
  //   const oldValues = prevProps.values.deleteIn(["livenessProbe", "type"]).deleteIn(["readinessProbe", "type"]);
  //   const newVavlues = this.props.values.deleteIn(["livenessProbe", "type"]).deleteIn(["readinessProbe", "type"]);
  //   if (oldValues.equals && !oldValues.equals(newVavlues)) {
  //     this.props.dispatch(stopSubmit("application", {})); // clear application submitErrors
  //   }
  // }
  // }

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
    const { isFolded, initialValues } = this.props;
    let isEdit = false;
    // @ts-ignore
    if (initialValues && initialValues!.get("name")) {
      isEdit = true;
    }
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} sm={12} md={12}>
          {!isFolded && <H3>Basic Info</H3>}
          <Body>Basic infomation of component.</Body>
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
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
          <Field name="workloadType" component={RenderSelectField} label="Workload Type" validate={[ValidatorRequired]}>
            <MenuItem value={workloadTypeServer}>Server (continuous running)</MenuItem>
            <MenuItem value={workloadTypeCronjob}>Cronjob (periodic running)</MenuItem>
          </Field>
          {this.renderSchedule()}
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
        <Grid item xs={12} sm={6} md={6}></Grid>
      </Grid>
    );
  }

  private renderEnvs() {
    const { isFolded, sharedEnv } = this.props;
    return (
      <>
        {!isFolded && <H3>Environment variables</H3>}
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
        <Envs sharedEnv={sharedEnv} />
      </>
    );
  }

  public renderPorts() {
    const { isFolded } = this.props;
    return (
      <>
        {!isFolded && <H3>Ports</H3>}
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
    const { isFolded, values, dispatch, form } = this.props;
    return (
      <>
        {!isFolded && <H3>Resources</H3>}
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
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={8}>
            <ComponentResources
              cpu={values.get("cpu")}
              memory={values.get("memory")}
              dispatch={dispatch}
              formName={form}
            />
          </Grid>
        </Grid>
      </>
    );
  }

  private renderVolumes() {
    const { isFolded } = this.props;
    return (
      <>
        {!isFolded && <H3>Volumes</H3>}
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

  private renderConfigs() {
    const { isFolded } = this.props;
    return (
      <>
        {!isFolded && <H3>Configs</H3>}
        <HelperContainer>
          <Typography>Mount Configs</Typography>
        </HelperContainer>
        <Configs />
      </>
    );
  }

  private renderAdvanced() {
    const { isFolded } = this.props;

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
          {!isFolded && <H3>Advanced</H3>}
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
            // validate={ValidatorRequired}
            label="Restart Strategy">
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
            // validate={ValidatorRequired}
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
    const { isFolded } = this.props;
    return (
      <>
        {!isFolded && <H3>Plugins</H3>}
        <HelperContainer>
          <Typography>
            Plugins can affect running state of a program, or provide extra functionality for the programs.
          </Typography>
        </HelperContainer>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={8}>
            <Plugins />
          </Grid>
        </Grid>
      </>
    );
  }

  private renderProbes() {
    const { isFolded } = this.props;
    return (
      <Grid container spacing={2}>
        <Grid item md={12}>
          {!isFolded && <H3>Probes</H3>}
        </Grid>
        <Grid item xs={12} sm={12} md={12}>
          <LivenessProbe />
        </Grid>
        <Grid item xs={12} sm={12} md={12}>
          <ReadinessProbe />
        </Grid>
      </Grid>
    );
  }

  private renderNodeSelector() {
    const { isFolded, nodeLabels } = this.props;
    return (
      <Grid container spacing={2}>
        <Grid item md={12}>
          {!isFolded && <H3>Node Selector</H3>}
        </Grid>
        <Grid item xs={12} sm={12} md={12}>
          <CustomLabels nodeLabels={nodeLabels} />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <AffinityType />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          {/* TODO */}
          <Typography variant="body2">description for fanout and gather.</Typography>
        </Grid>
      </Grid>
    );
  }

  private handleChangePanel(key: string) {
    if (this.state.currentPanel === key) {
      this.setState({ currentPanel: "" });
      return;
    }
    this.setState({ currentPanel: key });
  }

  private renderSubmitErrors(errors: { [key: string]: string }) {
    const { classes } = this.props;
    const listItems: any[] = [];

    for (let key in errors) {
      listItems.push(
        <div key={key} className={classes.submitErrorItem}>
          <div className={classes.submitErrorKey}>{key + " : "}</div>
          <div className={classes.submitErrorValueGroup}>{errors[key]}</div>
        </div>
      );
    }

    return <>{listItems}</>;
  }

  private renderSummary(summaryInfos: Summary[]): React.ReactNode {
    const { classes } = this.props;
    const renderValues = (summary: Summary) => {
      if (typeof summary.value === "string" || typeof summary.value === "number") {
        return (
          <Typography
            variant="body2"
            className={clsx(classes.summaryValue, summary.hasChanged ? classes.summaryChanged : null)}>
            {summary.value}
          </Typography>
        );
      } else {
        const values = summary.value;
        if (values.size && values.size > 0) {
          if (List.isList(values)) {
            return values.map((v: any, index: number) => {
              return (
                <Typography
                  key={index}
                  variant="body2"
                  className={clsx(classes.summaryValue, summary.hasChanged ? classes.summaryChanged : null)}>
                  {v}
                </Typography>
              );
            });
          } else if (Map.isMap(values)) {
            let keys = values.keySeq().toArray();
            return values.toList().map((value: any, index: number) => {
              if (Map.isMap(value)) {
                let subKeys = value.keySeq().toArray();
                return value.toList().map((subValue: any, subIndex: number) => {
                  return (
                    <Typography
                      key={subIndex}
                      variant="body2"
                      className={clsx(classes.summaryValue, summary.hasChanged ? classes.summaryChanged : null)}>
                      {subKeys[subIndex]} : {subValue}
                    </Typography>
                  );
                });
              } else {
                return (
                  <Typography
                    key={index}
                    variant="body2"
                    className={clsx(classes.summaryValue, summary.hasChanged ? classes.summaryChanged : null)}>
                    {keys[index]} : {value}
                  </Typography>
                );
              }
            });
          }
        } else {
          return null;
        }
      }
    };
    const listItems = summaryInfos.map((summary, index) => {
      return (
        <div key={index} className={classes.summaryItem}>
          <Typography variant="body2" className={clsx(classes.summaryKey)}>
            {summary.name + " : "}
          </Typography>
          <div className={classes.summaryValueGroup}>{renderValues(summary)}</div>
        </div>
      );
    });
    return <>{listItems}</>;
  }

  // private composeSubmitErrorInfo(panelKey: string): { [key: string]: any } {
  //   const { submitAppplicationErrors } = this.props;
  //   const fieldNames = this.getPanelFieldNames(panelKey);

  //   const panelSubmitErrors: { [key: string]: any } = {};

  //   if (submitAppplicationErrors?.get(panelKey)) {
  //     panelSubmitErrors[panelKey] = submitAppplicationErrors.get(panelKey);
  //   }

  //   fieldNames.forEach(name => {
  //     if (submitAppplicationErrors?.get(name)) {
  //       panelSubmitErrors[name] = submitAppplicationErrors.get(name);
  //     }
  //   });

  //   return panelSubmitErrors;
  // }

  private composeSyncErrorInfo(panelKey: string): boolean {
    const { syncErrors, anyTouched } = this.props;
    const fieldNames = this.getPanelFieldNames(panelKey);
    const errors: { [key: string]: any } = syncErrors;

    let hasError = false;
    if (anyTouched) {
      fieldNames.forEach(name => {
        if (errors[name]) {
          hasError = true;
        }
      });
    }
    return hasError;
  }

  private composeChangedState(panelKey: string): boolean {
    const { values, initialValues } = this.props;
    const fieldNames = this.getPanelFieldNames(panelKey);

    let isChanged = false;
    fieldNames.forEach((name: any) => {
      if (!values.get(name) || typeof values.get(name) === "string") {
        if (values.get(name) !== initialValues.get!(name)) {
          isChanged = true;
        }
        // immutable compare
      } else if (!values.get(name) || typeof values.get(name) === "number") {
        if (values.get(name) !== initialValues.get!(name)) {
          isChanged = true;
        }
      } else if (values.get(name).equals) {
        if (name === "livenessProbe" || name === "readinessProbe") {
          // since auto set probe type
          if (
            !values
              .get(name)
              .delete("type")
              .equals(initialValues.get!(name))
          ) {
            isChanged = true;
          }
        } else {
          if (!values.get(name).equals(initialValues.get!(name))) {
            isChanged = true;
          }
        }
      }
    });
    return isChanged;
  }

  private composeSummaryInfo(panelKey: string): Summary[] {
    const { values, initialValues } = this.props;
    const fieldNames = this.getPanelFieldNames(panelKey);
    let summaryInfos: Summary[] = [];
    fieldNames.forEach((name: any) => {
      let summaryInfo: Summary = {} as Summary;
      summaryInfo.name = name;
      if (!values.get(name) || typeof values.get(name) === "string" || typeof values.get(name) === "number") {
        if (values.get(name) !== initialValues.get!(name)) {
          summaryInfo.hasChanged = true;
        }
        summaryInfo.value = values.get(name);
        // immutable compare
      } else if (values.get(name).equals) {
        if (name === "livenessProbe" || name === "readinessProbe") {
          // since auto set probe type
          if (
            !values
              .get(name)
              .delete("type")
              .equals(initialValues.get!(name))
          ) {
            summaryInfo.hasChanged = true;
          }
          if (values.get(name).size && values.get(name).size > 0) {
            summaryInfo.value = extractSummaryInfoFromMap(values.get(name));
          } else {
            summaryInfo.value = values.get(name);
          }
        } else {
          if (!values.get(name).equals(initialValues.get!(name))) {
            summaryInfo.hasChanged = true;
          }
          if (Map.isMap(values.get(name))) {
            summaryInfo.value = extractSummaryInfoFromMap(values.get(name));
          } else if (List.isList(values.get(name))) {
            if (values.get(name).size && values.get(name).size > 0) {
              summaryInfo.value = extractSummaryInfoFromList(values.get(name));
            }
          }
        }
      }
      summaryInfo.value && summaryInfos.push(summaryInfo);
    });
    return summaryInfos;
  }

  private getPanelFieldNames(panelKey: string): string[] {
    switch (panelKey) {
      case "basic":
        return ["name", "image", "workloadType", "command", "args"];
      case "envs":
        return ["env"];
      case "ports":
        return ["ports"];
      case "resources":
        return ["cpu", "memory"];
      case "volumes":
        return ["volumes"];
      case "configs":
        return ["configs"];
      case "advanced":
        return ["restartStrategy", "terminationGracePeriodSeconds", "dnsPolicy"];
      case "plugins":
        return ["plugins"];
      case "nodeSelector":
        return ["nodeSelectorLabels", "podAffinityType"];
      case "probes":
        return ["livenessProbe", "readinessProbe"];
      default:
        return [];
    }
  }

  private renderPanel(panelKey: string, title: string, content: any): React.ReactNode {
    const { classes } = this.props;

    // let panelSubmitErrors = this.composeSubmitErrorInfo(panelKey);
    // let hasError = this.composeSyncErrorInfo(panelKey) || Object.keys(panelSubmitErrors).length > 0;
    let hasError = this.composeSyncErrorInfo(panelKey);
    let isChanged = this.composeChangedState(panelKey);
    let summaryInfos = this.composeSummaryInfo(panelKey);

    return (
      <ExpansionPanel expanded={panelKey === this.state.currentPanel} onChange={() => this.handleChangePanel(panelKey)}>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
          <div className={hasError ? classes.summaryError : isChanged ? classes.summaryBold : ""}>
            {title} {hasError ? <ErrorIcon className={classes.summaryIcon} /> : null}
            {/* <div className={classes.panelSubmitErrors}>
              {Object.keys(panelSubmitErrors).length > 0 ? this.renderSubmitErrors(panelSubmitErrors) : null}
            </div> */}
            <div className={panelKey === this.state.currentPanel ? classes.summaryHide : classes.summaryShow}>
              {this.renderSummary(summaryInfos)}
            </div>
          </div>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.displayBlock}>{content}</ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }

  public render() {
    const { handleSubmit, classes, currentTab } = this.props;

    return (
      <form onSubmit={handleSubmit}>
        <div className={`${classes.formSection} ${currentTab === "basic" ? "" : classes.displayNone}`}>
          {this.renderBasic()}
        </div>
        <div className={`${classes.formSection} ${currentTab === "envs" ? "" : classes.displayNone}`}>
          {this.renderEnvs()}
        </div>
        <div className={`${classes.formSection} ${currentTab === "ports" ? "" : classes.displayNone}`}>
          {this.renderPorts()}
        </div>
        <div className={`${classes.formSection} ${currentTab === "resources" ? "" : classes.displayNone}`}>
          {this.renderResources()}
        </div>
        <div className={`${classes.formSection} ${currentTab === "resources" ? "" : classes.displayNone}`}>
          {this.renderVolumes()}
        </div>
        <div className={`${classes.formSection} ${currentTab === "resources" ? "" : classes.displayNone}`}>
          {this.renderConfigs()}
        </div>
        <div className={`${classes.formSection} ${currentTab === "plugins" ? "" : classes.displayNone}`}>
          {this.renderPlugins()}
        </div>
        <div className={`${classes.formSection} ${currentTab === "probes" ? "" : classes.displayNone}`}>
          {this.renderProbes()}
        </div>
        <div className={`${classes.formSection} ${currentTab === "advanced" ? "" : classes.displayNone}`}>
          {this.renderNodeSelector()}
        </div>
        <div className={`${classes.formSection} ${currentTab === "advanced" ? "" : classes.displayNone}`}>
          {this.renderAdvanced()}
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
