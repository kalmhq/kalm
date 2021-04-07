import { Box, Button, Divider, Grid, Link, Tab, Tabs } from "@material-ui/core";
import grey from "@material-ui/core/colors/grey";
import { createStyles, Theme, withStyles, WithStyles, WithTheme, withTheme } from "@material-ui/core/styles";
import HelpIcon from "@material-ui/icons/Help";
import { Alert } from "@material-ui/lab";
import { loadSimpleOptionsAction, loadStatefulSetOptionsAction } from "actions/persistentVolume";
import clsx from "clsx";
import { push } from "connected-react-router";
import arrayMutators from "final-form-arrays";
import { Disks } from "forms/ComponentLike/Disks";
import { FinalBoolCheckboxRender } from "forms/Final/checkbox";
import { FinalCodeEditor } from "forms/Final/codeEditor";
import { FinalRadioGroupRender } from "forms/Final/radio";
import { FinalSelectField } from "forms/Final/select";
import { FormDataPreview } from "forms/Final/util";
import { COMPONENT_FORM_ID } from "forms/formIDs";
import { cpuFormat, cpuParse, memoryFormat, memoryParse, NormalizePositiveNumber, trimParse } from "forms/normalizer";
import { COMPONENT_DEPLOY_BUTTON_ZINDEX } from "layout/Constants";
import React from "react";
import { Field, Form, FormRenderProps, FormSpy, FormSpyRenderProps } from "react-final-form";
import { connect } from "react-redux";
import { Link as RouteLink, RouteComponentProps, withRouter } from "react-router-dom";
import { RootState } from "store";
import { TDispatchProp } from "types";
import {
  ComponentLike,
  workloadTypeCronjob,
  workloadTypeDaemonSet,
  workloadTypeServer,
  workloadTypeStatefulSet,
} from "types/componentTemplate";
import { PublicRegistriesList } from "types/registry";
import sc from "utils/stringConstants";
import { SubmitButton } from "widgets/Button";
import { KPanel } from "widgets/KPanel";
import { KTooltip } from "widgets/KTooltip";
import { Body2, Subtitle1 } from "widgets/Label";
import { KMLink } from "widgets/Link";
import { Prompt } from "widgets/Prompt";
import { SectionTitle } from "widgets/SectionTitle";
import { makeSelectOption } from "../Final/select";
import { FinalTextField } from "../Final/textfield";
import {
  ValidatorCPU,
  ValidatorIsDNS123Label,
  ValidatorMemory,
  ValidatorRequired,
  ValidatorSchedule,
} from "../validator";
import { ComponentAccess } from "./Access";
import { Envs } from "./Envs";
import { RenderSelectLabels } from "./NodeSelector";
import { Ports } from "./Ports";
import { PreInjectedFiles } from "./preInjectedFiles";
import { ProbeFields } from "./Probes";

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

  return {
    registries: state.registries.registries,
    isSubmittingApplicationComponent: state.components.isSubmittingApplicationComponent,
    nodeLabels: state.nodes.labels,
    anchor,
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
      borderBottom: `1px solid ${theme.palette.divider}`,
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
      position: "fixed",
      zIndex: COMPONENT_DEPLOY_BUTTON_ZINDEX,
      bottom: theme.spacing(3),
      height: "40px",
    },
  });

/**
 * A Styled component representing helper text.
 */
export const HelperTextSection: React.FC<{}> = ({ children }) => (
  <Grid item xs={8}>
    {children}
  </Grid>
);

interface RawProps {
  _initialValues: ComponentLike;
  onSubmit: (values: ComponentLike) => Promise<void>;
}

interface ConnectedProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface Props extends RouteComponentProps, WithStyles<typeof styles>, ConnectedProps, RawProps, WithTheme {}

interface State {}

type RenderProps = FormRenderProps<ComponentLike>;

class ComponentLikeFormRaw extends React.PureComponent<Props, State> {
  get tabs() {
    return tabs;
  }

  private loadRequiredData() {
    const { dispatch } = this.props;
    // for volumes
    dispatch(loadSimpleOptionsAction());
    dispatch(loadStatefulSetOptionsAction());
  }

  componentDidMount() {
    this.loadRequiredData();
  }

  private renderScheduleHelperText = () => {
    return (
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
    );
  };

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
          parse={NormalizePositiveNumber}
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
                <KMLink href="https://en.wikipedia.org/wiki/Cron" rel="noopener noreferrer" target="_blank">
                  Cron
                </KMLink>
                {" \n"}
                format string. You can create schedule expressions with{" "}
                <KMLink href="https://crontab.guru/" target="_blank" rel="noopener noreferrer">
                  Crontab Guru
                </KMLink>
                .
              </span>
            }
          />
        </>
      );
    }
  };

  private preInjectedFiles = () => {
    return <PreInjectedFiles />;
  };

  private renderEnvs() {
    return <Envs />;
  }

  public renderPorts() {
    return <Ports />;
  }

  private renderDisks(isEdit: boolean) {
    return (
      <FormSpy subscription={{ values: true }}>
        {({ values }: FormSpyRenderProps<ComponentLike>) => {
          return <Disks isEdit={isEdit} workloadType={values.workloadType} componentName={values.name} />;
        }}
      </FormSpy>
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
          <Field
            component={FinalCodeEditor}
            name="command"
            label="Command"
            placeholder={sc.COMMAND_INPUT_PLACEHOLDER}
            height="100%"
            showLineNumbers={false}
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
      <FormSpy subscription={{ values: true }}>
        {({
          values: { ports, readinessProbe, livenessProbe },
          form: { change },
        }: FormSpyRenderProps<ComponentLike>) => {
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
                <ProbeFields name="readinessProbe" value={readinessProbe} ports={ports} change={change} />
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
                <ProbeFields name="livenessProbe" value={livenessProbe} ports={ports} change={change} />
              </Grid>
            </Grid>
          );
        }}
      </FormSpy>
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
    const { classes, nodeLabels } = this.props;
    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Field<string | undefined>
            component={FinalTextField}
            name="cpuLimit"
            label="CPU Limit"
            validate={ValidatorCPU}
            placeholder={sc.CPU_INPUT_PLACEHOLDER}
            min="0"
            format={cpuFormat}
            parse={cpuParse}
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

        <Grid item xs={12}>
          <Field<string | undefined>
            component={FinalTextField}
            name="memoryLimit"
            label="Memory Limit"
            margin
            validate={ValidatorMemory}
            placeholder={sc.MEMORY_INPUT_PLACEHOLDER}
            min="0"
            format={memoryFormat}
            parse={memoryParse}
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

        <Grid item xs={12}>
          <Field<string | undefined>
            component={FinalTextField}
            name="cpuRequest"
            label="CPU Request"
            validate={ValidatorCPU}
            placeholder={sc.CPU_INPUT_PLACEHOLDER}
            format={cpuFormat}
            parse={cpuParse}
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

        <Grid item xs={12}>
          <Field<string | undefined>
            component={FinalTextField}
            name="memoryRequest"
            label="Memory Request"
            margin
            validate={ValidatorMemory}
            placeholder={sc.MEMORY_INPUT_PLACEHOLDER}
            format={memoryFormat}
            parse={memoryParse}
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

        <>
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
              type="checkbox"
              component={FinalBoolCheckboxRender}
              label={sc.SCHEDULING_COLOCATE_CHECKBOX}
            />
          </Grid>
        </>
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
            // won't fix, https://github.com/final-form/react-final-form/issues/392
            // type="radio"
            name="restartStrategy"
            component={FinalRadioGroupRender}
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
          <Field
            component={FinalTextField}
            name="terminationGracePeriodSeconds"
            label="Termination Grace Period (seconds)"
            parse={NormalizePositiveNumber}
            placeholder={sc.GRACEFUL_TERM_INPUT_PLACEHOLDER}
          />
        </Grid>
      </Grid>
    );
  }

  private getCurrentTabIndex() {
    const { anchor } = this.props;
    let currentTabIndex = this.tabs.map((t) => t.replace(/\s/g, "")).indexOf(`${anchor}`);
    if (currentTabIndex < 0) {
      currentTabIndex = 0;
    }
    return currentTabIndex;
  }

  private renderTabDetails(isEdit: boolean) {
    const { classes } = this.props;
    const currentTabIndex = this.getCurrentTabIndex();

    return (
      <>
        <div className={`${this.tabs[currentTabIndex] === Configurations ? "" : classes.displayNone}`}>
          {this.renderConfigurations()}
        </div>
        <div className={`${this.tabs[currentTabIndex] === NetworkingTab ? "" : classes.displayNone}`}>
          {this.renderNetworking()}
        </div>
        <div className={`${this.tabs[currentTabIndex] === DisksTab ? "" : classes.displayNone}`}>
          {this.renderDisks(isEdit)}
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
        <div className={`${this.tabs[currentTabIndex] === Access ? "" : classes.displayNone}`}>
          <FormSpy subscription={{ pristine: true, values: true }}>
            {({ form: { change }, values }: FormSpyRenderProps<ComponentLike>) => (
              <ComponentAccess ports={values.ports} change={change} protectedEndpoint={values.protectedEndpoint} />
            )}
          </FormSpy>
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

  private handleChangeTab(event: React.ChangeEvent<{}>, value: number) {
    this.pushToTab(value);
  }

  private renderTabs() {
    const { classes } = this.props;
    const currentTabIndex = this.getCurrentTabIndex();

    return (
      <FormSpy subscription={{ errors: true }}>
        {({ errors }: FormSpyRenderProps<ComponentLike>) => {
          return (
            <Tabs
              className={clsx(classes.tabsRoot)}
              value={currentTabIndex}
              variant="scrollable"
              scrollButtons="auto"
              indicatorColor="primary"
              textColor="primary"
              onChange={this.handleChangeTab.bind(this)}
              aria-label="component form tabs"
            >
              {this.tabs.map((tab) => {
                if (
                  this.tabs[currentTabIndex] !== tab &&
                  ((tab === Configurations && (errors!.preInjectedFiles || errors!.env || errors!.command)) ||
                    (tab === NetworkingTab && errors!.ports) ||
                    (tab === DisksTab && errors!.volumes) ||
                    (tab === HealthTab && (errors!.livenessProbe || errors!.readinessProbe)) ||
                    (tab === Scheduling && (errors!.cpuLimit || errors!.memoryLimit || errors!.nodeSelectorLabels)))
                ) {
                  return <Tab key={tab} label={tab} className={classes.hasError} />;
                }

                return <Tab key={tab} label={tab} />;
              })}
            </Tabs>
          );
        }}
      </FormSpy>
    );
  }

  private renderMain(isEdit: boolean) {
    return (
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Field
            autoFocus
            component={FinalTextField}
            id="component-name"
            name="name"
            label="Name"
            validate={ValidatorIsDNS123Label}
            parse={trimParse}
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
            parse={trimParse}
            placeholder={sc.IMAGE_PLACEHOLDER}
            validate={ValidatorRequired}
            helperText={sc.IMAGE_INPUT_HELPER}
          />
        </Grid>

        <Grid item xs={6}>
          <FormSpy subscription={{ values: true }}>
            {({ values }: FormSpyRenderProps<ComponentLike>) => {
              let hasVolumes = false;
              if (values.volumes && values.volumes.length > 0) {
                hasVolumes = true;
              }

              return (
                <Field
                  name="workloadType"
                  component={FinalSelectField}
                  label="Type"
                  disabled={isEdit || hasVolumes}
                  options={[
                    makeSelectOption(workloadTypeServer, "Service Component", sc.COMPONENT_TYPE_SERVICE_OPTION),
                    makeSelectOption(workloadTypeCronjob, "CronJob", sc.COMPONENT_TYPE_CRONJOB_OPTION),
                    makeSelectOption(workloadTypeDaemonSet, "DaemonSet", sc.COMPONENT_TYPE_DAEMON_OPTION),
                    makeSelectOption(workloadTypeStatefulSet, "StatefulSet", sc.COMPONENT_TYPE_STATEFUL_SET_OPTION),
                  ]}
                  helperText={!isEdit && hasVolumes ? "Type can't be changed after created disks" : ""}
                />
              );
            }}
          </FormSpy>
        </Grid>

        <FormSpy subscription={{ values: true }}>
          {({ values }: FormSpyRenderProps<ComponentLike>) => {
            return (
              <>
                <Grid item xs={6}>
                  {this.renderReplicasOrSchedule(values.workloadType)}
                </Grid>
                {this.renderPrivateRegistryAlert(values.image)}
              </>
            );
          }}
        </FormSpy>
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

    return !registries.find((r) => r.host && r.host.includes(parts[0]));
  };

  private renderPrivateRegistryAlert = (image: string) => {
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
              to="/cluster/pull-secrets"
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

  private renderDeployButton(isEdit: boolean) {
    const { classes, isSubmittingApplicationComponent } = this.props;

    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={12} md={12} style={{ display: "flex", justifyContent: "flex-end" }}>
          <SubmitButton
            pending={isSubmittingApplicationComponent}
            disabled={isSubmittingApplicationComponent}
            className={classes.deployBtn}
            id="add-component-submit-button"
          >
            {isEdit ? "Update" : "Deploy"} Component
          </SubmitButton>
        </Grid>
      </Grid>
    );
  }

  public render() {
    const { classes, _initialValues, onSubmit, form } = this.props;
    const isEdit = !!_initialValues.name;
    return (
      <Form
        // debug={process.env.REACT_APP_DEBUG === "true" ? console.log : undefined}
        initialValues={_initialValues}
        onSubmit={onSubmit}
        subscription={{ submitting: true, pristine: true, dirty: true }}
        keepDirtyOnReinitialize
        mutators={{
          ...arrayMutators,
        }}
        render={({ handleSubmit }: RenderProps) => (
          <form onSubmit={handleSubmit} className={classes.root} id="component-form">
            <Prompt />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12} md={12}>
                <KPanel title="Define Component" content={<Box p={2}>{this.renderMain(isEdit)}</Box>} />
              </Grid>
            </Grid>

            <Box mt={2}>
              <KPanel
                content={
                  <>
                    {this.renderTabs()}
                    <Box p={2}>{this.renderTabDetails(isEdit)}</Box>
                  </>
                }
              />
            </Box>
            <FormDataPreview />
            {this.renderDeployButton(isEdit)}
          </form>
        )}
      />
    );
  }
}

export const ComponentLikeForm = connect(mapStateToProps)(
  withStyles(styles)(withRouter(withTheme(ComponentLikeFormRaw))),
);
