import React from "react";
import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";
import { ApplicationComponentDetails } from "types/application";
import { getComponentCreatedAtString } from "utils/application";
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
    return getComponentCreatedAtString(component);
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
    const { classes, component } = this.props;

    if (component.get("ports") && component.get("ports")!.size > 0) {
      // <<<<<<< HEAD
      const ports = component.get("ports", List<ComponentLikePort>())?.map((port, index) => {
        const portString = port.get("servicePort") ?? port.get("containerPort");
        return this.renderPort(index, port.get("name"), portString);
      });
      return <div className={classes.portContainer}>{ports}</div>;
      // =======
      //       return component
      //         .get("ports")
      //         ?.map((port) => {
      //           return `${port.get("containerPort")}:${port.get("servicePort")}`;
      //         })
      //         .join("/");
      // >>>>>>> f3dc64cd95f71ad48762e30e03d1bbc53a48ba1e
    } else {
      return (
        <div>
          <NoPortsWarning />{" "}
          <IconButtonWithTooltip
            tooltipPlacement="top"
            tooltipTitle="Add Exposed Ports"
            aria-label="add-exposed-ports"
            onClick={() =>
              this.props.dispatch(push(`applications/:applicationName/components/web/edit#${NetworkingTab}`))
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

  private renderImage = (image: string) => {
    return (
      <>
        {image}
        <span
          style={{ cursor: "pointer" }}
          onClick={() => {
            copy(image);
            this.props.dispatch(setSuccessNotificationAction("Copied to clipboard"));
          }}
        >
          <CopyIconDefault style={{ height: 13 }} />
        </span>
      </>
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
          { name: "Image", content: this.renderImage(component.get("image")) },
          { name: "Workload Type", content: component.get("workloadType") },
          { name: "Update Strategy", content: component.get("restartStrategy") },
          { name: "Pod Status", content: this.renderComponentStatus() },
          { name: "CPU", content: this.renderComponentCPU() },
          { name: "Memory", content: this.renderComponentMemory() },
          { name: "Exposed ports", content: this.renderPorts() },
          { name: "Health", content: this.renderHealth() },
        ]}
      />
    );
  }
}

export const ComponentBasicInfo = withStyles(styles)(connect(mapStateToProps)(ComponentBasicInfoRaw));
