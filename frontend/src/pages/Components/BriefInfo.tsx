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
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import clsx from "clsx";
import { RootState } from "configureStore";
import { push } from "connected-react-router";
import { HealthTab, NetworkingTab } from "forms/ComponentLike";
import { ComponentCPUChart, ComponentMemoryChart } from "pages/Components/Chart";
import { renderCommandValue, renderCopyableImageName } from "pages/Components/InfoComponents";
import { NoLivenessProbeWarning, NoPortsWarning, NoReadinessProbeWarning } from "pages/Components/NoPortsWarning";
import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { ApplicationComponentDetails } from "types/application";
import { Probe } from "types/componentTemplate";
import { sizeStringToGi, sizeStringToMi } from "utils/sizeConv";
import stringConsts from "utils/stringConstants";
import { WrenchIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { ItemWithHoverIcon } from "widgets/ItemWithHoverIcon";
import { SecretValueLabel } from "widgets/Label";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";

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
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  activeNamespaceName: string;
  component: ApplicationComponentDetails;
}

const ComponentBriefInfoRaw: React.FC<Props> = (props) => {
  // const renderCreatedAt = () => {
  //   const { component } = props;
  //   return getComponentCreatedFromAndAtString(component);
  // };

  // const renderComponentStatus = () => {
  //   const { component } = props;

  //   let running = 0;
  //   let pending = 0;
  //   let error = 0;

  //   component.pods?.forEach((pod) => {
  //     if (pod.isTerminating) {
  //       pending = pending + 1;
  //     } else {
  //       switch (pod.status) {
  //         case "Pending": {
  //           pending = pending + 1;
  //           break;
  //         }
  //         case "Failed": {
  //           error = error + 1;
  //           break;
  //         }
  //         case "Running":
  //         case "Succeeded": {
  //           running = running + 1;
  //           break;
  //         }
  //       }
  //     }
  //   });
  //   let displayInfo = "";
  //   if (running > 0) {
  //     displayInfo += `Running: ${running} `;
  //   }

  //   if (pending > 0) {
  //     displayInfo += `Pending: ${pending} `;
  //   }

  //   if (error > 0) {
  //     displayInfo += `Error: ${error} `;
  //   }

  //   return displayInfo;
  // };

  const renderComponentCPU = () => {
    const { component, classes } = props;
    return (
      <Grid container className={classes.gridWrapper}>
        <Grid item md={2}>
          {component.cpuLimit ? `Limit: ${component.cpuLimit}` : stringConsts.LIMIT_NOT_SET}
        </Grid>
        <Grid item md={2}>
          {component.cpuRequest ? `Request: ${component.cpuRequest}` : stringConsts.REQUEST_NOT_SET}
        </Grid>
        <Grid item md={8}>
          <ComponentCPUChart component={component} />
        </Grid>
      </Grid>
    );
  };

  const renderComponentMemory = () => {
    const { component, classes } = props;
    return (
      <Grid container className={classes.gridWrapper}>
        <Grid item md={2}>
          {component.memoryLimit
            ? `Limit: ${sizeStringToMi(`${component.memoryLimit}`)}Mi`
            : stringConsts.LIMIT_NOT_SET}
        </Grid>
        <Grid item md={2}>
          {component.memoryRequest
            ? `Request: ${sizeStringToMi(`${component.memoryRequest}`)}Mi`
            : stringConsts.REQUEST_NOT_SET}
        </Grid>
        <Grid item md={8}>
          <ComponentMemoryChart component={component} />
        </Grid>
      </Grid>
    );
  };

  const renderPort = (key: any, protocol: string, port: number) => {
    const { classes } = props;
    return (
      <div className={classes.port} key={key}>
        {protocol}:{port}
      </div>
    );
  };
  const renderPorts = () => {
    const { classes, activeNamespaceName, component } = props;

    if (component.ports && component.ports!.length > 0) {
      const ports = component.ports?.map((port, index) => {
        const portString = port.servicePort ?? port.containerPort;
        return renderPort(index, port.protocol, portString);
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
                props.dispatch(
                  push(`/applications/${activeNamespaceName}/components/${component.name}/edit#${NetworkingTab}`),
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

  const getProbeType = (probe: Probe) => {
    if (probe.httpGet) {
      return "httpGet";
    }

    if (probe.exec) {
      return "exec";
    }

    if (probe.tcpSocket) {
      return "tcpSocket";
    }

    return "unknown";
  };

  const renderHealth = () => {
    const { component, activeNamespaceName, dispatch } = props;
    const readinessProbe = component.readinessProbe;
    const livenessProbe = component.livenessProbe;
    const icon =
      !readinessProbe || !livenessProbe ? (
        <IconButtonWithTooltip
          tooltipPlacement="top"
          tooltipTitle="Add Health Probes"
          aria-label="add-health-probes"
          onClick={() =>
            dispatch(push(`/applications/${activeNamespaceName}/components/${component.name}/edit#${HealthTab}`))
          }
        >
          <WrenchIcon fontSize="small" />
        </IconButtonWithTooltip>
      ) : undefined;
    return (
      <ItemWithHoverIcon icon={icon}>
        <Box pr={2}>
          {readinessProbe ? `${getProbeType(readinessProbe)} readiness probe configured.` : <NoReadinessProbeWarning />}
        </Box>
        <Box pr={2}>
          {livenessProbe ? `${getProbeType(livenessProbe)} liveness probe configured.` : <NoLivenessProbeWarning />}
        </Box>
      </ItemWithHoverIcon>
    );
  };

  const renderEnvs = () => {
    const { component, classes } = props;
    const envs = component.env;
    if (envs === undefined || envs?.length === 0) {
      return null;
    }
    return (
      <ExpansionPanel className={clsx(classes.rootEnv)} elevation={0} defaultExpanded={envs.length <= 1}>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>{envs.length} variables</ExpansionPanelSummary>
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
                    <TableCell className={classes.envKey}>{env.name}</TableCell>
                    <TableCell className={classes.envValue}>
                      <SecretValueLabel>{env.value}</SecretValueLabel>
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

  const renderConfigFiles = () => {
    const { component, classes } = props;
    const configs = component.preInjectedFiles;
    if (configs === undefined || configs?.length === 0) {
      return null;
    }
    return (
      <div>
        {configs?.map((config, index) => {
          return (
            <Box key={index} className={classes.columnWrapper}>
              <div className={classes.rowWrapper}>
                <div className={classes.envKey}>MountPath:</div>
                <div className={clsx(index % 2 === 0 ? classes.rowEven : classes.rowOdd, classes.envValue)}>
                  {config.mountPath}
                </div>
              </div>
            </Box>
          );
        })}
      </div>
    );
  };

  const renderRestartStrategy = () => {
    const { component } = props;
    if (component.restartStrategy === undefined) return null;
    return component.restartStrategy ?? "Rolling Update";
  };

  const renderGracefulTermination = () => {
    const { component } = props;
    if (component.terminationGracePeriodSeconds === undefined) return null;
    const duration =
      component.terminationGracePeriodSeconds === undefined ? "30" : component.terminationGracePeriodSeconds;

    return duration + "s";
  };

  const renderDisks = () => {
    const { component, classes } = props;
    const disks = component.volumes;
    if (disks === undefined || disks?.length === 0) {
      return null;
    }
    return (
      <ExpansionPanel className={clsx(classes.rootEnv)} elevation={0} defaultExpanded={false}>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          {disks?.length} {disks?.length > 1 ? "disks" : "disk"}
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
                    <TableCell>{disk.type}</TableCell>
                    <TableCell>{disk.pvc}</TableCell>
                    <TableCell>{disk.storageClassName}</TableCell>
                    <TableCell>{disk.path}</TableCell>
                    <TableCell>{`${sizeStringToGi(disk.size)}Gi`}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  };

  const { component, dispatch } = props;
  const items = [
    { name: "Image", content: renderCopyableImageName(component.image, dispatch) },
    { name: "Command", content: renderCommandValue(component.command, dispatch) },
    { name: "Environment Variables", content: renderEnvs() },
    { name: "Configuration Files", content: renderConfigFiles() },
    { name: "Exposed Ports", content: renderPorts() },
    { name: "Disks", content: renderDisks() },
    { name: "Health", content: renderHealth() },
    { name: "CPU", content: renderComponentCPU() },
    { name: "Memory", content: renderComponentMemory() },
    { name: "Restart Strategy", content: renderRestartStrategy() },
    { name: "Graceful Termination", content: renderGracefulTermination() },
  ];

  return (
    <VerticalHeadTable
      items={items.filter((item) => {
        return item.content !== null;
      })}
    />
  );
};

export const ComponentBriefInfo = withStyles(styles)(connect(mapStateToProps)(ComponentBriefInfoRaw));
