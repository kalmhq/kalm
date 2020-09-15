import {
  Box,
  Button,
  Collapse,
  Divider,
  Grid,
  Link,
  List as MList,
  ListItem,
  ListItemText,
  Tab,
  Tabs,
} from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import HelpIcon from "@material-ui/icons/Help";
import { Alert } from "@material-ui/lab";
import { loadSimpleOptionsAction, loadStatefulSetOptionsAction } from "actions/persistentVolume";
import clsx from "clsx";
import { push } from "connected-react-router";
import { FastField, Field, FormikProps, getIn, withFormik } from "formik";
import { KTooltip } from "forms/Application/KTooltip";
import { KFormikBoolCheckboxRender } from "forms/Basic/checkbox";
import { Disks } from "forms/ComponentLike/Disks";
import { COMPONENT_FORM_ID } from "forms/formIDs";
import { COMPONENT_DEPLOY_BUTTON_ZINDEX } from "layout/Constants";
import React from "react";
import { connect } from "react-redux";
import { Link as RouteLink, RouteComponentProps, withRouter } from "react-router-dom";
import { RootState } from "reducers";
import { FormMidware } from "tutorials/formMidware";
import { formikValidateOrNotBlockByTutorial } from "tutorials/utils";
import { TDispatchProp } from "types";
import { ApplicationDetails } from "types/application";
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
import { Body2, Subtitle1 } from "widgets/Label";
import { Prompt } from "widgets/Prompt";
import { SectionTitle } from "widgets/SectionTitle";
import { KFormikRadioGroupRender } from "../Basic/radio";
import { makeSelectOption, RenderFormikSelectField } from "../Basic/select";
import {
  KRenderDebounceFormikTextField,
  KRenderFormikCommandTextField,
  RenderFormikComplexValueTextField,
} from "../Basic/textfield";
import {
  ValidatorCPU,
  ValidatorMemory,
  ValidatorName,
  ValidatorNaturalNumber,
  ValidatorRequired,
  ValidatorSchedule,
} from "../validator";
import { Envs } from "./Envs";
import { KFormikRenderSelectLabels } from "./NodeSelector";
import { Ports } from "./Ports";
import { PreInjectedFiles } from "./preInjectedFiles";
import { LivenessProbe, ReadinessProbe } from "./Probes";
import { FormikNormalizeNumber } from "forms/normalizer";

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
const tabs = [Configurations, NetworkingTab, DisksTab, HealthTab, Scheduling, Deploy];

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
    form: COMPONENT_FORM_ID,
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
  showDataView?: boolean;
  showSubmitButton?: boolean;
  submitButtonText?: string;
  application?: ApplicationDetails;
  _initialValues: ComponentLike;
  onSubmit: (formValues: ComponentLike) => void;
}

interface ConnectedProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export interface Props
  extends FormikProps<ComponentLike>,
    RouteComponentProps,
    WithStyles<typeof styles>,
    ConnectedProps,
    RawProps {}

interface State {}

const nameValidators = (value: any) => {
  return ValidatorRequired(value) || ValidatorName(value);
};

const numberValidators = (value: any) => {
  return ValidatorRequired(value) || ValidatorNaturalNumber(value);
};
class ComponentLikeFormRaw extends React.Component<Props, State> {
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

  shouldComponentUpdate(nextProps: Props) {
    return (
      nextProps.values.name !== this.props.values.name ||
      nextProps.values.image !== this.props.values.image ||
      nextProps.values.workloadType !== this.props.values.workloadType ||
      nextProps.values.replicas !== this.props.values.replicas ||
      nextProps.values.volumes !== this.props.values.volumes ||
      nextProps.errors !== this.props.errors ||
      nextProps.currentTabIndex !== this.props.currentTabIndex
    );
  }

  private renderReplicasOrSchedule = () => {
    const workloadType = this.props.values.workloadType;
    if (workloadType === workloadTypeServer || workloadType === workloadTypeStatefulSet) {
      return (
        <FastField
          component={KRenderDebounceFormikTextField}
          validate={numberValidators}
          name="replicas"
          margin
          label="Replicas"
          helperText={sc.REPLICA_INPUT_HELPER}
          type="number"
          min="0"
          normalize={FormikNormalizeNumber}
        />
      );
    }

    if (workloadType === workloadTypeCronjob) {
      return (
        <>
          <FastField
            name="schedule"
            component={KRenderDebounceFormikTextField}
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
          <Field component={KFormikRadioGroupRender} name="dnsPolicy" options={this.getDnsPolicyOptions()} />
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
          <HelperTextSection>{sc.COMMAND_HELPER}</HelperTextSection>
        </Grid>
        <Grid item xs={12}>
          <FastField
            component={KRenderFormikCommandTextField}
            name="command"
            label="Command"
            placeholder={sc.COMMAND_INPUT_PLACEHOLDER}
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
          <FastField
            component={RenderFormikComplexValueTextField}
            name="cpuLimit"
            label="CPU Limit"
            validate={ValidatorCPU}
            // normalize={NormalizeCPU}
            placeholder={sc.CPU_INPUT_PLACEHOLDER}
            type="number"
            format={(value: any) => {
              return !value ? "" : (sizeStringToNumber(value) * 1000).toFixed();
            }}
            parse={(value: any) => {
              return !value ? undefined : value + "m";
            }}
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
          <FastField
            component={RenderFormikComplexValueTextField}
            name="memoryLimit"
            label="Memory Limit"
            margin
            validate={ValidatorMemory}
            // normalize={NormalizeMemory}
            placeholder={sc.MEMORY_INPUT_PLACEHOLDER}
            type="number"
            format={(value: any) => {
              return !value ? "" : sizeStringToMi(value);
            }}
            parse={(value: any) => {
              return !value ? undefined : value + "Mi";
            }}
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
          <FastField
            component={RenderFormikComplexValueTextField}
            name="cpuRequest"
            label="CPU Request"
            validate={ValidatorCPU}
            // normalize={NormalizeCPU}
            placeholder={sc.CPU_INPUT_PLACEHOLDER}
            type="number"
            format={(value: any) => {
              return !value ? "" : (sizeStringToNumber(value) * 1000).toFixed();
            }}
            parse={(value: any) => {
              return !value ? undefined : value + "m";
            }}
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
          <FastField
            component={RenderFormikComplexValueTextField}
            name="memoryRequest"
            label="Memory Request"
            margin
            validate={ValidatorMemory}
            // normalize={NormalizeMemory}
            placeholder={sc.MEMORY_INPUT_PLACEHOLDER}
            type="number"
            format={(value: any) => {
              return !value ? "" : sizeStringToMi(value);
            }}
            parse={(value: any) => {
              return !value ? undefined : value + "Mi";
            }}
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

        {/* <Grid item xs={12}>
          <Field name="enableResourcesRequests" component={KBoolCheckboxRender} label={sc.SCHEDULING_RR_CHECKBOX} />
        </Grid> */}
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Nodes</Subtitle1>
          </SectionTitle>
        </Grid>
        <Grid item xs={12}>
          <FastField name="nodeSelectorLabels" component={KFormikRenderSelectLabels} nodeLabels={nodeLabels} />
        </Grid>
        <Grid item xs={12}>
          <FastField
            name="preferNotCoLocated"
            component={KFormikBoolCheckboxRender}
            label={sc.SCHEDULING_COLOCATE_CHECKBOX}
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
          <KFormikRadioGroupRender
            onChange={this.props.handleChange}
            name="restartStrategy"
            value={this.props.values.restartStrategy || "RollingUpdate"}
            options={[
              {
                value: "RollingUpdate",
                label: (
                  <Body2>
                    <strong>Rolling Update</strong> - {sc.DEPLOYMENT_ROLLING}
                  </Body2>
                ),
              },
              {
                value: "Recreate",
                label: (
                  <Body2>
                    <strong>Recreate</strong> - {sc.DEPLOYMENT_RECREATE}
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
        <HelperTextSection>
          {sc.GRACEFUL_TERM_HELPER}
          &nbsp;
          <Link
            href="https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/#hook-handler-execution"
            target="_blank"
          >
            {sc.LEARN_MORE_LABEL}
          </Link>
        </HelperTextSection>
        <Grid item xs={6}>
          <FastField
            component={KRenderDebounceFormikTextField}
            name="terminationGracePeriodSeconds"
            label="Termination Grace Period (seconds)"
            // validate={ValidatorRequired}
            // normalize={NormalizeNumber}
            placeholder={sc.GRACEFUL_TERM_INPUT_PLACEHOLDER}
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

  private showError(fieldName: string): boolean {
    const { touched, errors } = this.props;

    return !!getIn(touched, fieldName) && !!getIn(errors, fieldName);
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
        onChange={(event: React.ChangeEvent<{}>, value: number) => {
          this.pushToTab(value);
          // this.setState({ currentTabIndex: value });
        }}
        aria-label="component form tabs"
      >
        {this.tabs.map((tab) => {
          if (
            (tab === Configurations &&
              (this.showError("preInjectedFiles") || this.showError("env") || this.showError("command"))) ||
            (tab === DisksTab && this.showError("volumes")) ||
            (tab === HealthTab && (this.showError("livenessProbe") || this.showError("readinessProbe"))) ||
            (tab === NetworkingTab && this.showError("ports")) ||
            (tab === Scheduling &&
              (this.showError("cpuLimit") || this.showError("memoryLimit") || this.showError("nodeSelectorLabels")))
          ) {
            return <Tab key={tab} label={tab} className={classes.hasError} />;
          }

          return <Tab key={tab} label={tab} tutorial-anchor-id={tab} />;
        })}
      </Tabs>
    );
  }

  private renderMain() {
    const { initialValues, values } = this.props;
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
          <FastField
            autoFocus
            component={KRenderDebounceFormikTextField}
            id="component-name"
            name="name"
            label="Name"
            validate={nameValidators}
            disabled={isEdit}
            helperText={isEdit ? "Name can't be changed." : sc.NAME_RULE}
          />
        </Grid>
        <Grid item xs={6}>
          <FastField
            component={KRenderDebounceFormikTextField}
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
            component={RenderFormikSelectField}
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

    return !registries.find((r) => r.host.includes(parts[0]));
  };

  private renderPrivateRegistryAlert = () => {
    const { values } = this.props;
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

  private renderDeployButton() {
    const { classes, isSubmittingApplicationComponent, initialValues } = this.props;

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

  public renderDirtyPrompt = () => {
    const { dirty, isSubmitting } = this.props;
    return <Prompt when={dirty && !isSubmitting} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />;
  };

  public render() {
    const { handleSubmit, classes, values, form } = this.props;
    return (
      <form onSubmit={handleSubmit} className={classes.root} id="component-form">
        {this.renderDirtyPrompt()}
        <FormMidware values={values} form={form} />
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
          <pre style={{ maxWidth: 1500, background: "#eee" }}>{JSON.stringify(values, undefined, 2)}</pre>
        ) : null}
        {/* <div className={`${classes.formSection} ${currentTabIndex === "advanced" ? "" : ""}`}>{this.renderPlugins()}</div> */}
        {this.renderDeployButton()}
      </form>
    );
  }
}

const form = withFormik<ConnectedProps & RawProps & WithStyles<typeof styles> & RouteComponentProps, ComponentLike>({
  mapPropsToValues: (props) => props._initialValues,
  enableReinitialize: true,
  validate: formikValidateOrNotBlockByTutorial,
  handleSubmit: async (formValues, { props: { onSubmit } }) => {
    await onSubmit(formValues);
  },
})(ComponentLikeFormRaw);

export const ComponentLikeForm = connect(mapStateToProps)(withStyles(styles)(withRouter(form)));
