import { Box, createStyles, Link, Theme, WithStyles, withStyles } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { K8sApiPrefix } from "api/api";
import copy from "copy-to-clipboard";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { ClusterInfo } from "types/cluster";
import { FlexRowItemCenterBox } from "widgets/Box";
import { CopyIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { InfoBox } from "widgets/InfoBox";
import { ItemWithHoverIcon } from "widgets/ItemWithHoverIcon";
import { KRTable } from "widgets/KRTable";
import { BasePage } from "../BasePage";

const mapStateToProps = (state: RootState) => {
  return {
    ingressInfo: state.cluster.info,
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    portsContainer: {
      display: "flex",
      flexDirection: "column",
    },
    portItem: {
      display: "flex",
      flexDirection: "row",
    },
    portName: {
      width: 50,
    },
    portNumber: {
      fontFamily: "Hack, monospace",
      textAlign: "right",
      background: theme.palette.type === "light" ? theme.palette.grey[200] : theme.palette.grey[700],
    },
  });

interface States {
  loadLoadBalancerInfoError: boolean;
  loadingLoadBalancerInfo: boolean;
}

type Props = ReturnType<typeof mapStateToProps> & TDispatchProp & WithStyles<typeof styles>;

export class LoadBalancerInfoRaw extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loadLoadBalancerInfoError: false,
      loadingLoadBalancerInfo: true,
    };
  }

  private renderPort = (name: string, port: number) => {
    const { classes } = this.props;
    return (
      <div className={classes.portItem}>
        <div className={classes.portName}>{name}</div>
        <div className={classes.portNumber}>{port}</div>
      </div>
    );
  };

  private renderPorts = (row: ClusterInfo) => {
    const { classes } = this.props;
    const httpPort = row.httpPort;
    const httpsPort = row.httpsPort;
    const tlsPort = row.tlsPort;
    return (
      <div className={classes.portsContainer}>
        {this.renderPort("HTTP", httpPort)}
        {this.renderPort("HTTPs", httpsPort)}
        {this.renderPort("TLS", tlsPort)}
      </div>
    );
  };

  private copyText = (text: string) => {
    const { dispatch } = this.props;
    navigator.clipboard.writeText(text).then(
      function () {
        dispatch(setSuccessNotificationAction("Copied successful!"));
      },
      function (err) {
        dispatch(setErrorNotificationAction("Copied failed!"));
      },
    );
  };

  private generateCopyContent = (content: string) => {
    return (
      <ItemWithHoverIcon
        key={content}
        icon={
          <IconButtonWithTooltip
            tooltipTitle="Copy"
            aria-label="copy"
            onClick={() => {
              copy(content);
              this.props.dispatch(setSuccessNotificationAction("Copied successful!"));
            }}
          >
            <CopyIcon fontSize="small" />
          </IconButtonWithTooltip>
        }
      >
        {content}
      </ItemWithHoverIcon>
    );
  };

  private renderHostName = (row: ClusterInfo) => {
    const ipContent = row.ingressIP;
    const hostName = row.ingressHostname;
    const coms = [];
    if (hostName) {
      coms.push(this.generateCopyContent(hostName));
    }
    if (ipContent) {
      coms.push(this.generateCopyContent(ipContent));
    }

    return <FlexRowItemCenterBox>{coms}</FlexRowItemCenterBox>;
  };

  private getKRTableColumns() {
    return [
      { Header: "Hostname / IP", accessor: "ingressHostname" },
      { Header: "Ports", accessor: "ports" },
    ];
  }

  private getKRTableData() {
    const { ingressInfo } = this.props;
    const data: any[] = [];

    const rowData = ingressInfo as ClusterInfo;
    data.push({
      ingressHostname: this.renderHostName(rowData),
      ports: this.renderPorts(rowData),
    });

    return data;
  }

  private renderKRTable() {
    return <KRTable columns={this.getKRTableColumns()} data={this.getKRTableData()} />;
  }

  private renderInfoBox() {
    const title = "Load Balancer References";

    const options = [
      {
        title: (
          <Link href="#" target="_blank">
            Link to docks
          </Link>
        ),
        content: "",
      },
      {
        title: (
          <Link href="#" target="_blank">
            Link to tutorial
          </Link>
        ),
        content: "",
      },
    ];

    return <InfoBox title={title} options={options}></InfoBox>;
  }

  render() {
    const { loadLoadBalancerInfoError } = this.state;

    return (
      <BasePage>
        <Box p={2}>
          {loadLoadBalancerInfoError ? (
            <Alert severity="error">
              <Box>
                Kalm fails to load persistentVolumes from current cluster with endpoint <strong>{K8sApiPrefix}</strong>.
                Please check your connection.
              </Box>
            </Alert>
          ) : null}

          {this.renderKRTable()}
        </Box>
        {/*<Box p={2}>{this.renderInfoBox()}</Box>*/}
      </BasePage>
    );
  }
}

export const LoadBalancerInfoPage = connect(mapStateToProps)(withStyles(styles)(LoadBalancerInfoRaw));
