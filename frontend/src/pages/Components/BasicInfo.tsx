import React from "react";
import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";
import { ApplicationComponentDetails } from "types/application";
import { getComponentCreatedFromAndAtString } from "utils/application";
import { SmallCPULineChart, SmallMemoryLineChart } from "widgets/SmallLineChart";
import { NoLivenessProbeWarning, NoPortsWarning, NoReadinessProbeWarning } from "pages/Components/NoPortsWarning";
import { HealthTab, NetworkingTab } from "forms/ComponentLike";
import { Probe, ComponentLikePort } from "types/componentTemplate";
import { List } from "immutable";
import { CopyIconDefault, WrenchIcon } from "widgets/Icon";
import copy from "copy-to-clipboard";
import { setSuccessNotificationAction } from "actions/notification";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { push } from "connected-react-router";
import clsx from "clsx";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    portContainer: {
      display: "flex",
      flexDirection: "column",
    },
    port: {
      padding: "1 2",
    },

    envKey: { paddingRight: 4 },
    envValue: {
      paddingLeft: 4,
    },
    rowWrapper: {
      display: "flex",
      flexDirection: "row",
    },
    rowEven: {
      backgroundColor: theme.palette.grey[100],
    },
    rowOdd: {
      backgroundColor: theme.palette.grey[50],
    },
    columnWrapper: {
      display: "flex",
      flexDirection: "column",
    },
  });

const mapStateToProps = (state: RootState) => {
  return {
    // xxx: state.get("xxx").get("xxx"),
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  activeNamespaceName: string;
  component: ApplicationComponentDetails;
}

interface State {}

class ComponentBasicInfoRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private renderCreatedAt = () => {
    const { component } = this.props;
    return getComponentCreatedFromAndAtString(component);
  };

  private renderComponentStatus = () => {
    const { component } = this.props;

    let running = 0;
    let pending = 0;
    let error = 0;

    component.get("pods").forEach((pod) => {
      if (pod.get("isTerminating")) {
        pending = pending + 1;
      } else {
        switch (pod.get("status")) {
          case "Pending": {
            pending = pending + 1;
            break;
          }
          case "Failed": {
            error = error + 1;
            break;
          }
          case "Running":
          case "Succeeded": {
            running = running + 1;
            break;
          }
        }
      }
    });

    return `Running: ${running}, Pending: ${pending}, Error: ${error}`;
  };

  private renderComponentCPU = () => {
    const { component } = this.props;
    return <SmallCPULineChart data={component.get("metrics").get("cpu")!} />;
  };

  private renderComponentMemory = () => {
    const { component } = this.props;
    return <SmallMemoryLineChart data={component.get("metrics").get("memory")!} />;
  };

  private renderPort = (key: any, name: string, port: number) => {
    const { classes } = this.props;
    return (
      <div className={classes.port} key={key}>
        {name}:{port}
      </div>
    );
  };
  private renderPorts = () => {
    const { classes, activeNamespaceName, component } = this.props;

    if (component.get("ports") && component.get("ports")!.size > 0) {
      const ports = component.get("ports", List<ComponentLikePort>())?.map((port, index) => {
        const portString = port.get("servicePort") ?? port.get("containerPort");
        return this.renderPort(index, port.get("name"), portString);
      });
      return <div className={classes.portContainer}>{ports}</div>;
    } else {
      return (
        <div>
          <NoPortsWarning />{" "}
          <IconButtonWithTooltip
            tooltipPlacement="top"
            tooltipTitle="Add Exposed Ports"
            aria-label="add-exposed-ports"
            onClick={() =>
              this.props.dispatch(
                push(`/applications/${activeNamespaceName}/components/${component.get("name")}/edit#${NetworkingTab}`),
              )
            }
          >
            <WrenchIcon fontSize="small" />
          </IconButtonWithTooltip>
        </div>
      );
    }
  };

  private getProbeType = (probe: Probe) => {
    if (probe.get("httpGet")) {
      return "httpGet";
    }

    if (probe.get("exec")) {
      return "exec";
    }

    if (probe.get("tcpSocket")) {
      return "tcpSocket";
    }

    return "unknown";
  };

  private renderHealth = () => {
    const { component, activeNamespaceName, dispatch } = this.props;
    const readinessProbe = component.get("readinessProbe");
    const livenessProbe = component.get("livenessProbe");
    return (
      <>
        <Box display="inline-block" pr={2}>
          {readinessProbe ? (
            `${this.getProbeType(readinessProbe)} readiness probe configured.`
          ) : (
            <NoReadinessProbeWarning />
          )}
        </Box>
        <Box display="inline-block" pr={2}>
          {livenessProbe ? (
            `${this.getProbeType(livenessProbe)} liveness probe configured.`
          ) : (
            <NoLivenessProbeWarning />
          )}
        </Box>
        {!readinessProbe || !livenessProbe ? (
          <IconButtonWithTooltip
            tooltipPlacement="top"
            tooltipTitle="Add Health Probes"
            aria-label="add-health-probes"
            onClick={() =>
              dispatch(
                push(`/applications/${activeNamespaceName}/components/${component.get("name")}/edit#${HealthTab}`),
              )
            }
          >
            <WrenchIcon fontSize="small" />
          </IconButtonWithTooltip>
        ) : null}
      </>
    );
  };

  private renderCopiableValue = (value: any) => {
    if (value === undefined || value === "") {
      return "-";
    } else {
      return (
        <>
          {value}
          <span
            style={{ cursor: "pointer" }}
            onClick={() => {
              copy(value);
              this.props.dispatch(setSuccessNotificationAction("Copied to clipboard"));
            }}
          >
            <CopyIconDefault style={{ height: 13 }} />
          </span>
        </>
      );
    }
  };

  private renderEnvs = () => {
    const { component, classes } = this.props;
    const envs = component.get("env");
    if (envs === undefined || envs?.size === 0) {
      return "-";
    }
    return envs?.map((env, index) => {
      return (
        <Box key={index} className={classes.columnWrapper}>
          <div className={clsx(classes.rowWrapper, index % 2 === 0 ? classes.rowEven : classes.rowOdd)}>
            <div className={classes.envKey}>{env.get("name")}</div> =
            <div className={classes.envValue}>{env.get("value")}</div>
          </div>
        </Box>
      );
    });
  };

  private renderConfigFiles = () => {
    const { component, classes } = this.props;
    const configs = component.get("preInjectedFiles");
    if (configs === undefined || configs?.size === 0) {
      return <>-</>;
    }
    return configs?.map((config, index) => {
      return (
        <Box key={index} className={classes.columnWrapper}>
          <div className={classes.rowWrapper}>
            <div className={classes.envKey}>MountPath:</div>
            <div className={clsx(index % 2 === 0 ? classes.rowEven : classes.rowOdd, classes.envValue)}>
              {config.get("mountPath")}
            </div>
          </div>
        </Box>
      );
    });
  };

  private renderRestartStrategy = () => {
    const { component } = this.props;
    return component.get("restartStrategy") ?? "Rolling Update";
  };

  private renderGracefulTermination = () => {
    const { component } = this.props;
    const duration =
      component.get("terminationGracePeriodSeconds") === undefined
        ? "30"
        : component.get("terminationGracePeriodSeconds");

    return duration + "s";
  };

  private renderDisks = () => {
    const { component, classes } = this.props;
    const disks = component.get("volumes");
    if (disks?.size === 0) {
      return "-";
    }
    return disks?.map((disk, index) => {
      return (
        <Box key={index} className={classes.columnWrapper}>
          <div className={clsx(classes.rowWrapper, index % 2 === 0 ? classes.rowEven : classes.rowOdd)}>
            <div className={classes.envValue}>{disk.get("type")}</div>
            <div className={classes.envValue}>{disk.get("pvc")}</div>
            <div className={classes.envValue}>{disk.get("storageClassName")}</div>
            <div className={classes.envKey}>{disk.get("path")}</div>
            <div className={classes.envValue}>{disk.get("size")}</div>
          </div>
        </Box>
      );
    });
  };

  public render() {
    const { component, activeNamespaceName } = this.props;
    return (
      <VerticalHeadTable
        items={[
          { name: "Created at", content: this.renderCreatedAt() },
          { name: "Name", content: component.get("name") },
          { name: "Namespace", content: activeNamespaceName },
          { name: "Workload type", content: component.get("workloadType") },
          { name: "Pod Status", content: this.renderComponentStatus() },
          { name: "Image", content: this.renderCopiableValue(component.get("image")) },
          { name: "Command", content: this.renderCopiableValue(component.get("command")) },
          { name: "Environment variables", content: this.renderEnvs() },
          { name: "Configuration files", content: this.renderConfigFiles() },
          { name: "Exposed ports", content: this.renderPorts() },
          { name: "Disks", content: this.renderDisks() },
          { name: "Health", content: this.renderHealth() },
          { name: "CPU", content: this.renderComponentCPU() },
          { name: "Memory", content: this.renderComponentMemory() },
          { name: "Restart strategy", content: this.renderRestartStrategy() },
          { name: "Graceful termination", content: this.renderGracefulTermination() },
        ]}
      />
    );
  }
}

export const ComponentBasicInfo = withStyles(styles)(connect(mapStateToProps)(ComponentBasicInfoRaw));
