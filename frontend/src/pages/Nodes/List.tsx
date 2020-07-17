import { Box, Button, createStyles, Grid, Popover, Theme, WithStyles, withStyles } from "@material-ui/core";
import { api } from "api";
import { Expansion } from "forms/Route/expansion";
import PopupState, { bindPopover, bindTrigger } from "material-ui-popup-state";
import { NodeStatus } from "pages/Nodes/NodeStatus";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { Node } from "types/node";
import { formatTimeDistance } from "utils";
import { H4, H5 } from "widgets/Label";
import { BigCPULineChart, BigMemoryLineChart, SmallCPULineChart, SmallMemoryLineChart } from "widgets/SmallLineChart";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";
import { BasePage } from "../BasePage";
import { NodeCPU } from "./CPU";
import { NodeMemory } from "./Memory";
import { NodePods } from "./Pods";

const mapStateToProps = (state: RootState) => {
  return {
    nodes: state.get("nodes").get("nodes"),
    metrics: state.get("nodes").get("metrics"),
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface States {}

type Props = ReturnType<typeof mapStateToProps> & TDispatchProp & WithStyles<typeof styles>;

export class NodeListRaw extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private hasCordon = (node: Node) => node.get("statusTexts").includes("SchedulingDisabled");

  private handleClickCordonButton = (event: React.MouseEvent) => {
    const name = event.currentTarget!.getAttribute("node-name")!;
    if (!name) return;

    const node = this.props.nodes.find((n) => n.get("name") === name)!;
    if (!node) return;

    if (this.hasCordon(node)) {
      api.uncordonNode(name);
    } else {
      api.cordonNode(name);
    }
  };

  private renderNodePanel = (node: Node) => {
    let labels: React.ReactNode[] = [];
    let annotations: React.ReactNode[] = [];
    node.get("labels").forEach((value: string, key: string) => {
      labels.push(
        <Box key={key}>
          {key}: {value}
        </Box>,
      );
    });

    node.get("annotations").forEach((value: string, key: string) => {
      annotations.push(
        <Box key={key}>
          {key}: {value}
        </Box>,
      );
    });

    return (
      <Expansion
        title={
          <Grid container spacing={2}>
            <Grid item>
              <Box display="flex">
                <NodeStatus node={node} enableMarginRight /> <H5>{node.get("name")}</H5>
              </Box>
            </Grid>
            <Grid item>{node.get("roles").join(",")}</Grid>
            <Grid item>{node.get("status").get("nodeInfo").get("kubeletVersion")}</Grid>
            <Grid item>Age: {formatTimeDistance(node.get("creationTimestamp"))}</Grid>
            <Grid item>{node.get("statusTexts").join(",")}</Grid>
          </Grid>
        }
      >
        <Box pb={2} pt={2}>
          <Button
            style={{ marginRight: 20 }}
            color="primary"
            size="small"
            variant="outlined"
            node-name={node.get("name")}
            onClick={this.handleClickCordonButton}
          >
            {this.hasCordon(node) ? "Enable Scheduling" : "Disable Scheduling"}
          </Button>
        </Box>

        <VerticalHeadTable
          items={[
            {
              name: "Name",
              content: node.get("name"),
            },
            {
              name: "Status",
              content: node.get("statusTexts").join(", "),
            },
            {
              name: "Age",
              content: formatTimeDistance(node.get("creationTimestamp")),
            },
            {
              name: "CPU",
              content: <SmallCPULineChart data={node.get("metrics").get("cpu")} />,
            },
            {
              name: "Memory",
              content: <SmallMemoryLineChart data={node.get("metrics").get("memory")} />,
            },
            {
              name: "CPU (Allocated / Total allocatable)",
              content: <NodeCPU node={node} />,
            },
            {
              name: "Memory (Allocated / Total allocatable)",
              content: <NodeMemory node={node} />,
            },
            {
              name: "Pods (Allocated / Total allocatable)",
              content: <NodePods node={node} />,
            },
            {
              name: "Internal IP",
              content: node.get("internalIP"),
            },
            {
              name: "External IP",
              content: node.get("externalIP"),
            },
            {
              name: "OS",
              content: `${node.get("status").get("nodeInfo").get("operatingSystem")}(${node
                .get("status")
                .get("nodeInfo")
                .get("architecture")})`,
            },
            {
              name: "OS Image",
              content: node.get("status").get("nodeInfo").get("osImage"),
            },
            {
              name: "Kernel Version",
              content: node.get("status").get("nodeInfo").get("kernelVersion"),
            },
            {
              name: "Kubelet version",
              content: node.get("status").get("nodeInfo").get("kubeletVersion"),
            },
            {
              name: "Labels",
              content: labels,
            },
            {
              name: "Annotations",
              content: annotations,
            },
          ]}
        />
      </Expansion>
    );
  };

  private renderSecondHeaderRight = () => {
    return (
      <>
        <H4>Nodes</H4>
        <PopupState variant="popover" popupId={"nodes"}>
          {(popupState) => (
            <>
              <Button color="primary" size="small" variant="text" {...bindTrigger(popupState)}>
                How to add a new node?
              </Button>
              <Popover
                {...bindPopover(popupState)}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "center",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "center",
                }}
              >
                <Box p={2}>
                  Kalm is not responsible for managing the addition and deletion of nodes. You need to operate where
                  your kubernetes cluster is created.
                </Box>
              </Popover>
            </>
          )}
        </PopupState>
      </>
    );
  };

  render() {
    const { metrics, nodes } = this.props;
    return (
      <BasePage secondHeaderRight={this.renderSecondHeaderRight()}>
        <Box p={2}>
          <Grid container spacing={2}>
            <Grid item md={6}>
              <BigCPULineChart data={metrics.get("cpu")} />
            </Grid>
            <Grid item md={6}>
              <BigMemoryLineChart data={metrics.get("memory")} />
            </Grid>
          </Grid>
        </Box>

        <Box p={2}>
          {nodes.map((node, index) => (
            <Box pb={1} key={node.get("name")}>
              {this.renderNodePanel(node)}
            </Box>
          ))}
        </Box>
      </BasePage>
    );
  }
}

export const NodeListPage = connect(mapStateToProps)(withStyles(styles)(NodeListRaw));
