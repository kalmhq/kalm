import React from "react";
import { Box, Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";
import { ApplicationComponentDetails } from "types/application";
import { getComponentCreatedFromAndAtString } from "utils/application";
import { SmallCPULineChart, SmallMemoryLineChart } from "widgets/SmallLineChart";
import { NoLivenessProbeWarning, NoPortsWarning, NoReadinessProbeWarning } from "pages/Components/NoPortsWarning";
import { HealthTab } from "forms/ComponentLike";
import { Probe, ComponentLikePort } from "types/componentTemplate";
import { Link } from "react-router-dom";
import { List } from "immutable";
import { CopyIconDefault } from "widgets/Icon";
import copy from "copy-to-clipboard";
import { setSuccessNotificationAction } from "actions/notification";

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
    return (
      <SmallCPULineChart
        data={component.get("metrics").get("cpu")!}
        isMetricServerEnabled={component.get("metrics").get("isMetricServerEnabled")}
      />
    );
  };

  private renderComponentMemory = () => {
    const { component } = this.props;
    return (
      <SmallMemoryLineChart
        data={component.get("metrics").get("memory")!}
        isMetricServerEnabled={component.get("metrics").get("isMetricServerEnabled")}
      />
    );
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
      const ports = component.get("ports", List<ComponentLikePort>())?.map((port, index) => {
        const portString = port.get("servicePort") ?? port.get("containerPort");
        return this.renderPort(index, port.get("name"), portString);
      });
      return <div className={classes.portContainer}>{ports}</div>;
    } else {
      return <NoPortsWarning />;
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
    const { component, activeNamespaceName } = this.props;
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
          <Button
            component={Link}
            to={`/applications/${activeNamespaceName}/components/${component.get("name")}/edit#${HealthTab}`}
            variant="text"
            size="small"
            color="primary"
          >
            Add Health Probes
          </Button>
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
