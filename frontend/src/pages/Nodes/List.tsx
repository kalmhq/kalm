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
import { Expansion } from "forms/Route/expansion";
import { POPPER_ZINDEX } from "layout/Constants";
import PopupState, { bindToggle, bindTrigger } from "material-ui-popup-state";
import { NodeStatus } from "pages/Nodes/NodeStatus";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { Node } from "types/node";
import { formatTimeDistance, TimestampFilter } from "utils/date";
import { customBindHover, customBindPopover } from "utils/popper";
import { sizeStringToNumber } from "utils/sizeConv";
import sc from "utils/stringConstants";
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
    nodes: state.get("nodes").get("nodes"),
    metrics: state.get("nodes").get("metrics"),
    applications: state.get("applications").get("applications"),
    componentsMap: state.get("components").get("components"),
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface States {
  chartDateFilter: string;
}

// TODO remove this and use real
const fakePopperData = [
  {
    name: "application1",
    value: 1000,
    unit: "m",
  },
  {
    name: "application2",
    value: 800,
    unit: "m",
  },
  {
    name: "application3",
    value: 700,
    unit: "m",
  },
  {
    name: "application4",
    value: 500,
    unit: "m",
  },
  {
    name: "application5",
    value: 300,
    unit: "m",
  },
];

type Props = ReturnType<typeof mapStateToProps> & TDispatchProp & WithStyles<typeof styles>;

export class NodeListRaw extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = {
      chartDateFilter: "all",
    };
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
                <NodeStatus node={node} enableMarginRight /> <Subtitle1>{node.get("name")}</Subtitle1>
              </Box>
            </Grid>
            <Grid item>{node.get("roles").join(",")}</Grid>
            <Grid item>{node.get("status").get("nodeInfo").get("kubeletVersion")}</Grid>
            <Grid item>Age: {formatTimeDistance(node.get("creationTimestamp"))}</Grid>
            <Grid item>{node.get("statusTexts").join(",")}</Grid>
            <Grid item>
              <Box display="flex">
                <Box mr={2}>CPU:</Box>
                <PopupState variant="popper" popupId={`big-memory-popup-popper-${node.get("name")}`}>
                  {(popupState) => {
                    return (
                      <div>
                        <div {...customBindHover(popupState)}>
                          <NodeCPU node={node} />
                        </div>
                        <Popper {...customBindPopover(popupState)} style={{ zIndex: POPPER_ZINDEX }} transition>
                          {({ TransitionProps }) => (
                            <Fade {...TransitionProps} timeout={100}>
                              <Paper>
                                <ResourceRank title="Pods" allocateds={fakePopperData} />
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
                <PopupState variant="popper" popupId={`big-memory-popup-popper-${node.get("name")}`}>
                  {(popupState) => {
                    return (
                      <div>
                        <div {...customBindHover(popupState)}>
                          <NodeMemory node={node} />
                        </div>
                        <Popper {...customBindPopover(popupState)} style={{ zIndex: POPPER_ZINDEX }} transition>
                          {({ TransitionProps }) => (
                            <Fade {...TransitionProps} timeout={100}>
                              <Paper>
                                <ResourceRank title="Pods" allocateds={fakePopperData} />
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
              content: (
                <PopupState variant="popper" popupId={`big-memory-popup-popper-${node.get("name")}`}>
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
                              <Paper>
                                <ResourceRank title="Pods" allocateds={fakePopperData} />
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
                <PopupState variant="popper" popupId={`big-memory-popup-popper-${node.get("name")}`}>
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
                              <Paper>
                                <ResourceRank title="Pods" allocateds={fakePopperData} />
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
        <PopupState variant="popover" popupId={"nodes"}>
          {(popupState) => (
            <>
              <Button style={{ padding: 0 }} color="primary" size="small" variant="text" {...bindTrigger(popupState)}>
                How to add a new node?
              </Button>
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
      ></InfoBox>
    );
  }

  render() {
    const { metrics, nodes } = this.props;

    const { cpuRankData, memoryRankData } = this.getNodesResourceRankData();

    return (
      <BasePage>
        <Box p={2}>
          {/* <Grid container spacing={2}>
            <Grid item xs={10}></Grid>
            <Grid item xs={2}>
              <KSelect
                label="Filter"
                value={this.state.chartDateFilter}
                options={[
                  {
                    value: "1h",
                    text: "1h",
                  },
                  {
                    value: "12h",
                    text: "12h",
                  },
                  {
                    value: "24h",
                    text: "24h",
                  },
                  {
                    value: "7days",
                    text: "7days",
                  },
                  {
                    value: "all",
                    text: "all",
                  },
                ]}
                onChange={(x) => {
                  this.setState({ chartDateFilter: x as string });
                }}
              />
            </Grid>
          </Grid> */}
          <Grid container spacing={2}>
            <Grid item md={6}>
              <InfoPaper elevation={0} style={{ overflow: "hidden" }}>
                <BigCPULineChart data={metrics.get("cpu")} filter={this.state.chartDateFilter as TimestampFilter} />
                <PopupState variant="popper" popupId="big-cpu-popup-popper">
                  {(popupState) => {
                    return (
                      <div>
                        <div {...bindToggle(popupState)}>
                          <NodesCPU nodes={nodes} />
                        </div>
                        <Popper {...customBindPopover(popupState)} style={{ zIndex: POPPER_ZINDEX }} transition>
                          {({ TransitionProps }) => (
                            <Fade {...TransitionProps} timeout={100}>
                              <Paper>
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
                <BigMemoryLineChart
                  data={metrics.get("memory")}
                  filter={this.state.chartDateFilter as TimestampFilter}
                />
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
                              <Paper>
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
            <Box pb={index === nodes.size ? 0 : 1} key={node.get("name")}>
              {this.renderNodePanel(node)}
            </Box>
          ))}
        </Box>
        <Box p={2}>{this.renderInfoBox()}</Box>
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
      node
        .get("allocatedResources")
        .get("podsRequests")
        .forEach((podRequest) => {
          const namespace = podRequest.get("namespace");

          const cpuData = podRequest.get("requests").get("cpu");

          if (cpuData) {
            if (cpuRankMap[namespace]) {
              cpuRankMap[namespace] = cpuRankMap[namespace] + sizeStringToNumber(cpuData) * 1000;
            } else {
              cpuRankMap[namespace] = sizeStringToNumber(cpuData) * 1000;
            }
          }

          const memoryData = podRequest.get("requests").get("memory");

          if (memoryData) {
            if (memoryRankMap[namespace]) {
              memoryRankMap[namespace] = memoryRankMap[namespace] + sizeStringToNumber(memoryData);
            } else {
              memoryRankMap[namespace] = sizeStringToNumber(memoryData);
            }
          }
        });
    });

    console.log("cpuRankMap", cpuRankMap);

    for (let namespace in cpuRankMap) {
      console.log("namespace", namespace);
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

    // applications.forEach((application) => {
    //   let cpuValue = 0;
    //   let memoryValue = 0;

    //   const components = componentsMap.get(application.get("name"));

    //   components?.forEach((component) => {
    //     if (component.get("cpuRequest")) {
    //       cpuValue =
    //         cpuValue + sizeStringToNumber(component.get("cpuRequest") as string) * component.get("pods").size * 1000;

    //       memoryValue =
    //         memoryValue + sizeStringToNumber(component.get("cpuRequest") as string) * component.get("pods").size;
    //     }
    //   });

    //   if (cpuValue !== 0) {
    //     cpuRankData.push({
    //       name: application.get("name"),
    //       value: cpuValue,
    //       unit: "m",
    //     });
    //   }

    //   if (memoryValue !== 0) {
    //     memoryRankData.push({
    //       name: application.get("name"),
    //       value: memoryValue,
    //     });
    //   }
    // });

    // cpuRankData.sort(function (a, b) {
    //   return a.value - b.value;
    // });

    // memoryRankData.sort(function (a, b) {
    //   return a.value - b.value;
    // });

    return {
      cpuRankData,
      memoryRankData,
    };
  }
}

export const NodeListPage = connect(mapStateToProps)(withStyles(styles)(NodeListRaw));
