import {
  Box,
  Button,
  createStyles,
  Fade,
  Grid,
  Link,
  Paper,
  Popover,
  Popper,
  Theme,
  WithStyles,
  withStyles,
} from "@material-ui/core";
import { api } from "api";
import { POPPER_ZINDEX } from "layout/Constants";
import PopupState, { bindTrigger } from "material-ui-popup-state";
import { NodeStatus } from "pages/Nodes/NodeStatus";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "store";
import CustomButton from "theme/Button";
import { TDispatchProp } from "types";
import { Node } from "types/node";
import { formatAgeFromNow, TimestampFilter } from "utils/date";
import { customBindHover, customBindPopover } from "utils/popper";
import { sizeStringToNumber } from "utils/sizeConv";
import sc from "utils/stringConstants";
import { Expansion } from "widgets/expansion";
import { InfoBox } from "widgets/InfoBox";
import { Subtitle1 } from "widgets/Label";
import { InfoPaper } from "widgets/Paper";
import { BigCPULineChart, BigMemoryLineChart, SmallCPULineChart, SmallMemoryLineChart } from "widgets/SmallLineChart";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";
import { BasePage } from "../BasePage";
import { NodeCPU, NodesCPU } from "./CPU";
import { NodeMemory, NodesMemory } from "./Memory";
import { NodePods } from "./Pods";
import { ResourceRank } from "./ResourceRank";

const mapStateToProps = (state: RootState) => {
  return {
    nodes: state.nodes.nodes,
    metrics: state.nodes.metrics,
    applications: state.applications.applications,
    componentsMap: state.components.components,
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface States {
  chartDateFilter: string;
}

type Props = ReturnType<typeof mapStateToProps> & TDispatchProp & WithStyles<typeof styles>;

export class NodeListRaw extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = {
      chartDateFilter: "all",
    };
  }

  private hasCordon = (node: Node) => node.statusTexts.includes("SchedulingDisabled");

  private handleClickCordonButton = (event: React.MouseEvent) => {
    const name = event.currentTarget!.getAttribute("node-name")!;
    if (!name) return;

    const node = this.props.nodes.find((n) => n.name === name)!;
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

    for (let key in node.labels) {
      let value = node.labels[key];
      labels.push(
        <Box key={key}>
          {key}: {value}
        </Box>,
      );
    }

    for (let key in node.annotations) {
      let value = node.annotations[key];
      annotations.push(
        <Box key={key}>
          {key}: {value}
        </Box>,
      );
    }

    const { cpuRankData, memoryRankData } = this.getNodeResourceRankData(node);
    return (
      <Expansion
        high
        title={
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Box display="flex">
                <NodeStatus node={node} enableMarginRight /> <Subtitle1>{node.name}</Subtitle1>
              </Box>
            </Grid>
            <Grid item>{node.roles.join(",")}</Grid>
            <Grid item>{node.status.nodeInfo.kubeletVersion}</Grid>
            <Grid item>Age: {formatAgeFromNow(node.creationTimestamp)}</Grid>
            <Grid item>{node.statusTexts.join(",")}</Grid>
            <Grid item>
              <Box display="flex">
                <Box mr={2}>CPU:</Box>
                <PopupState variant="popper" popupId={`big-memory-popup-popper-${node.name}`}>
                  {(popupState) => {
                    return (
                      <div>
                        <div {...customBindHover(popupState)}>
                          <NodeCPU node={node} />
                        </div>
                        <Popper {...customBindPopover(popupState)} style={{ zIndex: POPPER_ZINDEX }} transition>
                          {({ TransitionProps }) => (
                            <Fade {...TransitionProps} timeout={100}>
                              <Paper variant="outlined">
                                <ResourceRank title="Pods" allocateds={cpuRankData} />
                              </Paper>
                            </Fade>
                          )}
                        </Popper>
                      </div>
                    );
                  }}
                </PopupState>
              </Box>
            </Grid>
            <Grid item>
              <Box display="flex">
                <Box mr={2}>Memory:</Box>
                <PopupState variant="popper" popupId={`big-memory-popup-popper-${node.name}`}>
                  {(popupState) => {
                    return (
                      <div>
                        <div {...customBindHover(popupState)}>
                          <NodeMemory node={node} />
                        </div>
                        <Popper {...customBindPopover(popupState)} style={{ zIndex: POPPER_ZINDEX }} transition>
                          {({ TransitionProps }) => (
                            <Fade {...TransitionProps} timeout={100}>
                              <Paper variant="outlined">
                                <ResourceRank title="Pods" allocateds={memoryRankData} />
                              </Paper>
                            </Fade>
                          )}
                        </Popper>
                      </div>
                    );
                  }}
                </PopupState>
              </Box>
            </Grid>
          </Grid>
        }
      >
        <Box p={2}>
          <Button
            style={{ marginRight: 20 }}
            color="primary"
            size="small"
            variant="outlined"
            node-name={node.name}
            onClick={this.handleClickCordonButton}
          >
            {this.hasCordon(node) ? "Enable Scheduling" : "Disable Scheduling"}
          </Button>
        </Box>

        <VerticalHeadTable
          items={[
            {
              name: "Name",
              content: node.name,
            },
            {
              name: "Status",
              content: node.statusTexts.join(", "),
            },
            {
              name: "Age",
              content: formatAgeFromNow(node.creationTimestamp),
            },
            {
              name: "CPU",
              content: <SmallCPULineChart data={node.metrics.cpu} />,
            },
            {
              name: "Memory",
              content: <SmallMemoryLineChart data={node.metrics.memory} />,
            },
            {
              name: "CPU (Allocated / Total allocatable)",
              content: (
                <PopupState variant="popper" popupId={`big-memory-popup-popper-${node.name}`}>
                  {(popupState) => {
                    return (
                      <div>
                        <div {...customBindHover(popupState)}>
                          <NodeCPU node={node} showDetails={true} />
                        </div>
                        <Popper
                          {...customBindPopover(popupState)}
                          style={{ zIndex: POPPER_ZINDEX }}
                          placement={"bottom-start"}
                          transition
                        >
                          {({ TransitionProps }) => (
                            <Fade {...TransitionProps} timeout={100}>
                              <Paper variant="outlined">
                                <ResourceRank title="Pods" allocateds={cpuRankData} />
                              </Paper>
                            </Fade>
                          )}
                        </Popper>
                      </div>
                    );
                  }}
                </PopupState>
              ),
            },
            {
              name: "Memory (Allocated / Total allocatable)",
              content: (
                <PopupState variant="popper" popupId={`big-memory-popup-popper-${node.name}`}>
                  {(popupState) => {
                    return (
                      <div>
                        <div {...customBindHover(popupState)}>
                          <NodeMemory node={node} showDetails={true} />
                        </div>
                        <Popper
                          {...customBindPopover(popupState)}
                          style={{ zIndex: POPPER_ZINDEX }}
                          placement={"bottom-start"}
                          transition
                        >
                          {({ TransitionProps }) => (
                            <Fade {...TransitionProps} timeout={100}>
                              <Paper variant="outlined">
                                <ResourceRank title="Pods" allocateds={memoryRankData} />
                              </Paper>
                            </Fade>
                          )}
                        </Popper>
                      </div>
                    );
                  }}
                </PopupState>
              ),
            },
            {
              name: "Pods (Allocated / Total allocatable)",
              content: <NodePods node={node} />,
            },
            {
              name: "Internal IP",
              content: node.internalIP,
            },
            {
              name: "External IP",
              content: node.externalIP,
            },
            {
              name: "OS",
              content: `${node.status.nodeInfo.operatingSystem}(${node.status.nodeInfo.architecture})`,
            },
            {
              name: "OS Image",
              content: node.status.nodeInfo.osImage,
            },
            {
              name: "Kernel Version",
              content: node.status.nodeInfo.kernelVersion,
            },
            {
              name: "Kubelet version",
              content: node.status.nodeInfo.kubeletVersion,
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
        <PopupState variant="popover" popupId={"nodes"}>
          {(popupState) => (
            <>
              <CustomButton
                style={{ padding: 0 }}
                color="primary"
                size="small"
                variant="text"
                {...bindTrigger(popupState)}
              >
                How to add a new node?
              </CustomButton>
              <Popover
                {...customBindPopover(popupState)}
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

  private renderInfoBox() {
    const options = [
      {
        title: (
          <Link href="https://docs.microsoft.com/en-us/azure/aks/upgrade-cluster" target="_blank">
            Azure Kubernetes Service cluster
          </Link>
        ),
        content: "",
      },
      {
        title: (
          <Link href="https://cloud.google.com/kubernetes-engine/docs/how-to/cluster-admin-overview" target="_blank">
            Google Compute Engine cluster
          </Link>
        ),
        content: "",
      },
      {
        title: (
          <Link href="https://docs.aws.amazon.com/eks/latest/userguide/clusters.html" target="_blank">
            Amazon EKS cluster
          </Link>
        ),
        content: "",
      },
    ];

    return (
      <InfoBox
        title={
          <Box>
            <Box mb={2}>{this.renderSecondHeaderRight()}</Box>
            {sc.NODES_INFO_BOX_TEXT}
          </Box>
        }
        options={options}
      />
    );
  }

  render() {
    const { metrics, nodes } = this.props;

    const { cpuRankData, memoryRankData } = this.getNodesResourceRankData();

    return (
      <BasePage>
        <Box p={2}>
          <Grid container spacing={2}>
            <Grid item md={6}>
              <InfoPaper elevation={0} style={{ overflow: "hidden" }}>
                <BigCPULineChart data={metrics.cpu} filter={this.state.chartDateFilter as TimestampFilter} />
                <PopupState variant="popper" popupId="big-cpu-popup-popper">
                  {(popupState) => {
                    return (
                      <div>
                        <div {...customBindHover(popupState)}>
                          <NodesCPU nodes={nodes} />
                        </div>
                        <Popper {...customBindPopover(popupState)} style={{ zIndex: POPPER_ZINDEX }} transition>
                          {({ TransitionProps }) => (
                            <Fade {...TransitionProps} timeout={100}>
                              <Paper variant="outlined">
                                <ResourceRank title="Applications" allocateds={cpuRankData} />
                              </Paper>
                            </Fade>
                          )}
                        </Popper>
                      </div>
                    );
                  }}
                </PopupState>
              </InfoPaper>
            </Grid>
            <Grid item md={6}>
              <InfoPaper elevation={0} style={{ overflow: "hidden" }}>
                <BigMemoryLineChart data={metrics.memory} filter={this.state.chartDateFilter as TimestampFilter} />
                <PopupState variant="popper" popupId="big-memory-popup-popper">
                  {(popupState) => {
                    return (
                      <div>
                        <div {...customBindHover(popupState)}>
                          <NodesMemory nodes={nodes} />
                        </div>
                        <Popper {...customBindPopover(popupState)} style={{ zIndex: POPPER_ZINDEX }} transition>
                          {({ TransitionProps }) => (
                            <Fade {...TransitionProps} timeout={100}>
                              <Paper variant="outlined">
                                <ResourceRank title="Applications" allocateds={memoryRankData} />
                              </Paper>
                            </Fade>
                          )}
                        </Popper>
                      </div>
                    );
                  }}
                </PopupState>
              </InfoPaper>
            </Grid>
          </Grid>
        </Box>

        <Box p={2} pt={0} pb={0}>
          {nodes.map((node, index) => (
            <Box pb={index === nodes.length ? 0 : 1} key={node.name}>
              {this.renderNodePanel(node)}
            </Box>
          ))}
        </Box>
        {/* <Box p={2}>{this.renderInfoBox()}</Box> */}
      </BasePage>
    );
  }

  private getNodesResourceRankData() {
    const { nodes } = this.props;

    const cpuRankData: {
      name: string;
      value: number;
      unit?: string;
    }[] = [];

    const memoryRankData: {
      name: string;
      value: number;
      unit?: string;
    }[] = [];

    const cpuRankMap: { [key: string]: number } = {};

    const memoryRankMap: { [key: string]: number } = {};

    nodes.forEach((node) => {
      node.allocatedResources?.podsRequests?.forEach((podRequest) => {
        const namespace = podRequest.namespace;

        const cpuData = podRequest.requests.cpu;

        if (cpuData) {
          if (cpuRankMap[namespace]) {
            cpuRankMap[namespace] = cpuRankMap[namespace] + sizeStringToNumber(cpuData) * 1000;
          } else {
            cpuRankMap[namespace] = sizeStringToNumber(cpuData) * 1000;
          }
        }

        const memoryData = podRequest.requests.memory;

        if (memoryData) {
          if (memoryRankMap[namespace]) {
            memoryRankMap[namespace] = memoryRankMap[namespace] + sizeStringToNumber(memoryData);
          } else {
            memoryRankMap[namespace] = sizeStringToNumber(memoryData);
          }
        }
      });
    });

    for (let namespace in cpuRankMap) {
      cpuRankData.push({
        name: namespace,
        value: cpuRankMap[namespace],
        unit: "m",
      });
    }

    for (let namespace in memoryRankMap) {
      memoryRankData.push({
        name: namespace,
        value: memoryRankMap[namespace],
      });
    }

    return {
      cpuRankData,
      memoryRankData,
    };
  }

  private getNodeResourceRankData(node: Node) {
    const cpuRankData: {
      name: string;
      value: number;
      unit?: string;
    }[] = [];

    const memoryRankData: {
      name: string;
      value: number;
      unit?: string;
    }[] = [];

    const cpuRankMap: { [key: string]: number } = {};

    const memoryRankMap: { [key: string]: number } = {};

    node.allocatedResources?.podsRequests?.forEach((podRequest) => {
      const podName = podRequest.podName;

      const cpuData = podRequest.requests.cpu;

      if (cpuData) {
        if (cpuRankMap[podName]) {
          cpuRankMap[podName] = cpuRankMap[podName] + sizeStringToNumber(cpuData) * 1000;
        } else {
          cpuRankMap[podName] = sizeStringToNumber(cpuData) * 1000;
        }
      }

      const memoryData = podRequest.requests.memory;

      if (memoryData) {
        if (memoryRankMap[podName]) {
          memoryRankMap[podName] = memoryRankMap[podName] + sizeStringToNumber(memoryData);
        } else {
          memoryRankMap[podName] = sizeStringToNumber(memoryData);
        }
      }
    });

    for (let podName in cpuRankMap) {
      cpuRankData.push({
        name: podName,
        value: cpuRankMap[podName],
        unit: "m",
      });
    }

    for (let podName in memoryRankMap) {
      memoryRankData.push({
        name: podName,
        value: memoryRankMap[podName],
      });
    }

    return {
      cpuRankData,
      memoryRankData,
    };
  }
}

export const NodeListPage = connect(mapStateToProps)(withStyles(styles)(NodeListRaw));
