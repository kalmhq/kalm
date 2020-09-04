import React from "react";
import {
  Box,
  createStyles,
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Theme,
  withStyles,
  WithStyles,
} from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";
import { ApplicationComponentDetails } from "types/application";
import { getComponentCreatedFromAndAtString } from "utils/application";
import { SmallCPULineChart, SmallMemoryLineChart } from "widgets/SmallLineChart";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { NoLivenessProbeWarning, NoPortsWarning, NoReadinessProbeWarning } from "pages/Components/NoPortsWarning";
import { HealthTab, NetworkingTab } from "forms/ComponentLike";
import { ComponentLikePort, Probe } from "types/componentTemplate";
import { List } from "immutable";
import { CopyIcon, WrenchIcon } from "widgets/Icon";
import copy from "copy-to-clipboard";
import { setSuccessNotificationAction } from "actions/notification";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { push } from "connected-react-router";
import clsx from "clsx";
import { SecretValueLabel } from "widgets/Label";
import { ItemWithHoverIcon } from "widgets/ItemWithHoverIcon";
import { sizeStringToMi, sizeStringToGi } from "utils/sizeConv";
import stringConsts from "utils/stringConstants";

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
    gridWrapper: {
      display: "flex",
      alignItems: "center",
    },

    envKey: {
      paddingRight: 16,
      minWidth: 50,
      maxWidth: 300,
      overflowWrap: "break-word",
    },
    envValue: {
      paddingLeft: 16,
      paddingRight: 16,
      minWidth: 200,
      maxWidth: 500,
      overflowWrap: "break-word",
    },
    rowWrapper: {
      display: "flex",
      flexDirection: "row",
    },
    rowOdd: {
      backgroundColor: theme.palette.type === "light" ? theme.palette.grey[100] : theme.palette.grey[700],
    },
    rowEven: {
      backgroundColor: theme.palette.type === "light" ? theme.palette.grey[50] : theme.palette.grey[800],
    },
    columnWrapper: {
      display: "flex",
      flexDirection: "column",
    },
    copyIcon: {
      cursor: "pointer",
      "& > svg": {
        position: "relative",
        top: 4,
        marginLeft: 6,
      },
    },
    rootEnv: {
      marginBottom: 4,
      marginTop: 4,
      padding: 0,
      paddingLeft: 0,
      paddingRight: 0,
      "& .MuiExpansionPanelSummary-root": {
        padding: 0,
        minHeight: 24,
        height: 24,
      },
      "& .MuiExpansionPanelSummary-content": {
        transition: theme.transitions.create("all", {
          duration: theme.transitions.duration.short,
        }),
      },
      "& .MuiExpansionPanelSummary-content.Mui-expanded": {
        color: "transparent",
        transition: theme.transitions.create("all", {
          duration: theme.transitions.duration.short,
        }),
      },
      "& .MuiExpansionPanelDetails-root": {
        display: "flex",
        flexDirection: "column",
        padding: 0,
      },
      "& .MuiIconButton-edgeEnd": {
        marginRight: 0,
      },
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
    let displayInfo = "";
    if (running > 0) {
      displayInfo += `Running: ${running} `;
    }

    if (pending > 0) {
      displayInfo += `Pending: ${pending} `;
    }

    if (error > 0) {
      displayInfo += `Error: ${error} `;
    }

    return displayInfo;
  };

  private renderComponentCPU = () => {
    const { component, classes } = this.props;
    return (
      <Grid container className={classes.gridWrapper}>
        <Grid item md={2}>
          {component.get("cpuLimit") ? `Limit: ${component.get("cpuLimit")}` : stringConsts.LIMIT_NOT_SET}
        </Grid>
        <Grid item md={2}>
          {component.get("cpuRequest") ? `Request: ${component.get("cpuRequest")}` : stringConsts.REQUEST_NOT_SET}
        </Grid>
        <Grid item md={8}>
          Usage: <SmallCPULineChart data={component.get("metrics").get("cpu")!} />
        </Grid>
      </Grid>
    );
  };

  private renderComponentMemory = () => {
    const { component, classes } = this.props;
    return (
      <Grid container className={classes.gridWrapper}>
        <Grid item md={2}>
          {component.get("memoryLimit")
            ? `Limit: ${sizeStringToMi(`${component.get("memoryLimit")}`)}Mi`
            : stringConsts.LIMIT_NOT_SET}
        </Grid>
        <Grid item md={2}>
          {component.get("memoryRequest")
            ? `Request: ${sizeStringToMi(`${component.get("memoryRequest")}`)}Mi`
            : stringConsts.REQUEST_NOT_SET}
        </Grid>
        <Grid item md={8}>
          Usage: <SmallMemoryLineChart data={component.get("metrics").get("memory")!} />
        </Grid>
      </Grid>
    );
  };

  private renderPort = (key: any, protocol: string, port: number) => {
    const { classes } = this.props;
    return (
      <div className={classes.port} key={key}>
        {protocol}:{port}
      </div>
    );
  };
  private renderPorts = () => {
    const { classes, activeNamespaceName, component } = this.props;

    if (component.get("ports") && component.get("ports")!.size > 0) {
      const ports = component.get("ports", List<ComponentLikePort>())?.map((port, index) => {
        const portString = port.get("servicePort") ?? port.get("containerPort");
        return this.renderPort(index, port.get("protocol"), portString);
      });
      return <div className={classes.portContainer}>{ports}</div>;
    } else {
      return (
        <ItemWithHoverIcon
          icon={
            <IconButtonWithTooltip
              tooltipPlacement="top"
              tooltipTitle="Add Exposed Ports"
              aria-label="add-exposed-ports"
              onClick={() =>
                this.props.dispatch(
                  push(
                    `/applications/${activeNamespaceName}/components/${component.get("name")}/edit#${NetworkingTab}`,
                  ),
                )
              }
            >
              <WrenchIcon fontSize="small" />
            </IconButtonWithTooltip>
          }
        >
          <Box display="inline-block" pr={2}>
            <NoPortsWarning />
          </Box>
        </ItemWithHoverIcon>
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
    const icon =
      !readinessProbe || !livenessProbe ? (
        <IconButtonWithTooltip
          tooltipPlacement="top"
          tooltipTitle="Add Health Probes"
          aria-label="add-health-probes"
          onClick={() =>
            dispatch(push(`/applications/${activeNamespaceName}/components/${component.get("name")}/edit#${HealthTab}`))
          }
        >
          <WrenchIcon fontSize="small" />
        </IconButtonWithTooltip>
      ) : undefined;
    return (
      <ItemWithHoverIcon icon={icon}>
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
      </ItemWithHoverIcon>
    );
  };

  private renderCopiableValue = (value: any) => {
    if (value === undefined || value === "") {
      return "-";
    } else {
      return (
        <ItemWithHoverIcon
          icon={
            <IconButtonWithTooltip
              tooltipTitle="Copy"
              aria-label="copy"
              onClick={() => {
                copy(value);
                this.props.dispatch(setSuccessNotificationAction("Copied successful!"));
              }}
            >
              <CopyIcon fontSize="small" />
            </IconButtonWithTooltip>
          }
        >
          {value}
        </ItemWithHoverIcon>
      );
    }
  };

  private renderEnvs = () => {
    const { component, classes } = this.props;
    const envs = component.get("env");
    if (envs === undefined || envs?.size === 0) {
      return "-";
    }
    return (
      <ExpansionPanel square className={clsx(classes.rootEnv)} elevation={0} defaultExpanded={envs.size <= 1}>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>{envs.size} variables</ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <Table size="small" aria-label="Envs-Table">
            <TableHead key="title">
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {envs?.map((env, index) => {
                return (
                  <TableRow key={index}>
                    <TableCell className={classes.envKey}>{env.get("name")}</TableCell>
                    <TableCell className={classes.envValue}>
                      <SecretValueLabel>{env.get("value")}</SecretValueLabel>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
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
    if (disks === undefined || disks?.size === 0) {
      return "-";
    }
    return (
      <ExpansionPanel square className={clsx(classes.rootEnv)} elevation={0} defaultExpanded={true}>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          {disks?.size} {disks?.size > 1 ? "disks" : "disk"}
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <Table size="small" aria-label="Envs-Table">
            <TableHead key="title">
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>PVC</TableCell>
                <TableCell>Storage Class</TableCell>
                <TableCell>Path</TableCell>
                <TableCell>Size</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {disks?.map((disk, index) => {
                return (
                  <TableRow key={index}>
                    <TableCell>{disk.get("type")}</TableCell>
                    <TableCell>{disk.get("pvc")}</TableCell>
                    <TableCell>{disk.get("storageClassName")}</TableCell>
                    <TableCell>{disk.get("path")}</TableCell>
                    <TableCell>{`${sizeStringToGi(disk.get("size"))}Gi`}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  };

  public render() {
    const { component, activeNamespaceName } = this.props;
    return (
      <VerticalHeadTable
        items={[
          { name: "Created At", content: this.renderCreatedAt() },
          { name: "Name", content: component.get("name") },
          { name: "Namespace", content: activeNamespaceName },
          { name: "Workload Type", content: component.get("workloadType") },
          { name: "Pod Status", content: this.renderComponentStatus() },
          { name: "Image", content: this.renderCopiableValue(component.get("image")) },
          { name: "Command", content: this.renderCopiableValue(component.get("command")) },
          { name: "Environment Variables", content: this.renderEnvs() },
          { name: "Configuration Files", content: this.renderConfigFiles() },
          { name: "Exposed Ports", content: this.renderPorts() },
          { name: "Disks", content: this.renderDisks() },
          { name: "Health", content: this.renderHealth() },
          { name: "CPU", content: this.renderComponentCPU() },
          { name: "Memory", content: this.renderComponentMemory() },
          { name: "Restart Strategy", content: this.renderRestartStrategy() },
          { name: "Graceful Termination", content: this.renderGracefulTermination() },
        ]}
      />
    );
  }
}

export const ComponentBasicInfo = withStyles(styles)(connect(mapStateToProps)(ComponentBasicInfoRaw));
