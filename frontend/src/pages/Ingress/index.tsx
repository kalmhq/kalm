import { Box, createStyles, Theme, WithStyles, withStyles, Typography, Link } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { K8sApiPrefix } from "api/realApi";
import React from "react";
import { connect } from "react-redux";
import { KTable } from "widgets/Table";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { BasePage } from "../BasePage";
import { ClusterInfo } from "types/cluster";
import { FlexRowItemCenterBox } from "widgets/Box";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { CopyIcon } from "widgets/Icon";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { InfoBox } from "widgets/InfoBox";

const mapStateToProps = (state: RootState) => {
  return {
    ingressInfo: state.get("cluster").get("info"),
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
      background: theme.palette.grey[200],
    },
  });

interface States {
  loadIngressInfoError: boolean;
  loadingIngressInfo: boolean;
}

interface PortsInfo {
  httpPort: number;
  httpsPort: number;
  tlsPort: number;
}

interface RowData extends ClusterInfo {
  index: number;
  // ports: ImmutableMap<PortsInfo>;
}

type Props = ReturnType<typeof mapStateToProps> & TDispatchProp & WithStyles<typeof styles>;

export class IngressInfoRaw extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loadIngressInfoError: false,
      loadingIngressInfo: true,
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

  private renderPorts = (row: RowData) => {
    const { classes } = this.props;
    const httpPort = row.get("httpPort");
    const httpsPort = row.get("httpsPort");
    const tlsPort = row.get("tlsPort");
    return (
      <div className={classes.portsContainer}>
        {this.renderPort("HTTP", httpPort)}
        {this.renderPort("HTTPs", httpsPort)}
        {this.renderPort("TLS", tlsPort)}
      </div>
    );
  };

  private renderVersion = (row: RowData) => {
    return row.get("version");
  };

  private renderHostName = (row: RowData) => {
    return row.get("ingressHostname");
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

  private renderHostIP = (row: RowData) => {
    const ipContent = row.get("ingressIP");
    return (
      <FlexRowItemCenterBox>
        <Typography>{ipContent}</Typography>
        <IconButtonWithTooltip
          size="small"
          tooltipTitle="Copy"
          onClick={() => {
            this.copyText(ipContent);
          }}
        >
          <CopyIcon style={{ fontSize: 16 }} />
        </IconButtonWithTooltip>
      </FlexRowItemCenterBox>
    );
  };

  getTableData = () => {
    const { ingressInfo } = this.props;

    const data: RowData[] = [];

    const rowData = ingressInfo as RowData;
    rowData.index = 1;
    data.push(rowData);

    return data;
  };

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
    const { loadIngressInfoError } = this.state;
    const tableData = this.getTableData();

    return (
      <BasePage>
        <Box p={2}>
          {loadIngressInfoError ? (
            <Alert severity="error">
              <Box>
                Kalm fails to load persistentVolumes from current cluster with endpoint <strong>{K8sApiPrefix}</strong>.
                Please check your connection.
              </Box>
            </Alert>
          ) : null}

          <KTable
            options={{
              paging: tableData.length > 20,
            }}
            columns={[
              { title: "Hostname", field: "ingressHostname", sorting: false, render: this.renderHostName },
              { title: "IP", field: "ingressIP", sorting: false, render: this.renderHostIP },
              { title: "Ports", field: "ports", sorting: false, render: this.renderPorts },
              { title: "Kubernetes Version", field: "version", sorting: false, render: this.renderVersion },
            ]}
            data={tableData}
            title=""
          />
        </Box>
        <Box p={2}>{this.renderInfoBox()}</Box>
      </BasePage>
    );
  }
}

export const IngressInfoPage = connect(mapStateToProps)(withStyles(styles)(IngressInfoRaw));
