import { Box, Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { blue } from "@material-ui/core/colors";
import CheckIcon from "@material-ui/icons/Check";
import { deleteRouteAction } from "actions/routes";
import { blinkTopProgressAction } from "actions/settings";
import { push } from "connected-react-router";
import { withClusterInfo } from "hoc/withClusterInfo";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { withRoutesData, WithRoutesDataProps } from "hoc/withRoutesData";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
import { BasePage } from "pages/BasePage";
import { Methods } from "pages/Route/Methods";
import React from "react";
import { Link } from "react-router-dom";
import { ClusterInfo } from "types/cluster";
import { HttpRoute } from "types/route";
import sc from "utils/stringConstants";
import { FlexRowItemCenterBox } from "widgets/Box";
import { CustomizedButton } from "widgets/Button";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { EditIcon, ForwardIcon, KalmRoutesIcon } from "widgets/Icon";
import { IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { InfoBox } from "widgets/InfoBox";
import { KRTable } from "widgets/KRTable";
import { KMLink } from "widgets/Link";
import { Loading } from "widgets/Loading";
import { getRouteUrl } from "widgets/OpenInBrowser";
import { Targets } from "widgets/Targets";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles>, WithRoutesDataProps, WithNamespaceProps, WithUserAuthProps {}

interface State {}

type HostCellProps = { row: HttpRoute; clusterInfo: ClusterInfo };

/**
 * A component that renders a cell for the "Domain" column of the Routes table
 * Note: currently handle multiple hosts, but not multiple paths, which should probably be changed.
 */
const HostCellRaw = ({ row, clusterInfo }: HostCellProps) => {
  return (
    <Box>
      {row.hosts.map((h) => {
        const url = getRouteUrl(row as HttpRoute, clusterInfo, h);
        return (
          <FlexRowItemCenterBox key={h}>
            {/* <ItemWithHoverIcon icon={<CopyAsCurl route={row as HttpRoute} showIconButton={true} host={h} />}> */}
            <KMLink href={url} target="_blank" rel="noopener noreferrer">
              {h}
            </KMLink>
            {/* </ItemWithHoverIcon> */}
          </FlexRowItemCenterBox>
        );
      })}
    </Box>
  );
};

const HostCell = withClusterInfo(HostCellRaw);

class RouteListPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private renderHosts(row: HttpRoute) {
    return <HostCell row={row} />;
  }

  private renderUrls(row: HttpRoute) {
    return (
      <Box>
        {row.paths.map((h) => {
          return <Box key={h}>{h}</Box>;
        })}
      </Box>
    );
  }

  private renderRules(row: HttpRoute) {
    if (!row.conditions) {
      return null;
    }

    return row.conditions!.map((x) => {
      return (
        <div>
          {x.type} {x.name} {x.operator} {x.value}{" "}
        </div>
      );
    });
  }

  private renderMethods(row: HttpRoute) {
    return <Methods methods={row.methods} />;
  }

  private renderSupportHttp(row: HttpRoute) {
    if (row.httpRedirectToHttps && row.schemes.includes("http") && row.schemes.includes("https")) {
      return <ForwardIcon />;
    }

    if (row.schemes.find((x) => x === "http")) {
      return <CheckIcon />;
    }
  }

  private renderSupportHttps(row: HttpRoute) {
    if (row.schemes.find((x) => x === "https")) {
      return <CheckIcon />;
    }
  }

  private renderTargets = (row: HttpRoute) => {
    return <Targets destinations={row.destinations} destinationsStatus={row.destinationsStatus} />;
  };

  private renderAdvanced(row: HttpRoute) {
    let res: string[] = [];
    if (row.mirror) {
      res.push("mirror");
    }
    if (row.delay) {
      res.push("delay");
    }
    if (row.fault) {
      res.push("fault");
    }
    if (row.cors) {
      res.push("cors");
    }
    if (row.retries) {
      res.push("retries");
    }
    return res.join(",");
  }

  private renderActions = (row: HttpRoute) => {
    const { dispatch, canEditCluster } = this.props;

    return canEditCluster() ? (
      <>
        <IconLinkWithToolTip
          onClick={() => {
            blinkTopProgressAction();
          }}
          tooltipTitle="Edit"
          to={`/routes/${row.name}/edit`}
        >
          <EditIcon />
        </IconLinkWithToolTip>
        <DeleteButtonWithConfirmPopover
          popupId="delete-route-popup"
          popupTitle="DELETE ROUTE?"
          confirmedAction={() => dispatch(deleteRouteAction(row))}
        />
      </>
    ) : null;
  };

  private renderEmpty() {
    const { dispatch, canEditCluster } = this.props;

    return (
      <EmptyInfoBox
        image={<KalmRoutesIcon style={{ height: 120, width: 120, color: blue[200] }} />}
        title={sc.EMPTY_ROUTES_TITLE}
        content={sc.EMPTY_ROUTES_SUBTITLE}
        button={
          canEditCluster() ? (
            <CustomizedButton
              variant="contained"
              color="primary"
              onClick={() => {
                blinkTopProgressAction();
                dispatch(push(`/routes/new`));
              }}
            >
              Add Route
            </CustomizedButton>
          ) : null
        }
      />
    );
  }

  private showActions() {
    const { httpRoutes, canEditCluster } = this.props;
    let show = false;
    httpRoutes.forEach((route) => {
      if (canEditCluster()) {
        show = true;
      }
    });
    return show;
  }

  private getKRTableColumns() {
    const columns = [
      {
        Header: "Domain",
        accessor: "host",
      },
      {
        Header: "Urls",
        accessor: "urls",
      },
      {
        Header: "Http",
        accessor: "http",
      },
      {
        Header: "Https",
        accessor: "https",
      },
      {
        Header: "Methods",
        accessor: "methods",
      },
      {
        Header: "Targets",
        accessor: "targets",
      },
    ];

    if (this.showActions()) {
      columns.push({
        Header: "Actions",
        accessor: "actions",
      });
    }

    return columns;
  }

  private renderInfoBox() {
    const title = "References";

    const options = [
      {
        title: (
          <KMLink href="https://docs.kalm.dev/TODO" target="_blank">
            How a http route works?
          </KMLink>
        ),
        content: "",
      },
      {
        title: (
          <KMLink href="https://docs.kalm.dev/TODO" target="_blank">
            HttpRoute CRD
          </KMLink>
        ),
        draft: true,
        content: "",
      },
    ];

    return (
      <Box mt={2}>
        <InfoBox title={title} options={options} />
      </Box>
    );
  }

  private getKRTableData() {
    const { httpRoutes } = this.props;
    const data: any[] = [];

    httpRoutes &&
      httpRoutes.forEach((httpRoute, index) => {
        data.push({
          host: this.renderHosts(httpRoute),
          urls: this.renderUrls(httpRoute),
          http: this.renderSupportHttp(httpRoute),
          https: this.renderSupportHttps(httpRoute),
          methods: this.renderMethods(httpRoute),
          targets: this.renderTargets(httpRoute),
          actions: this.renderActions(httpRoute),
        });
      });

    return data;
  }

  private renderKRTable() {
    return <KRTable showTitle={true} title="Routes" columns={this.getKRTableColumns()} data={this.getKRTableData()} />;
  }

  public render() {
    const { isRoutesFirstLoaded, isRoutesLoading, httpRoutes, canEditAnyNamespace } = this.props;

    return (
      <BasePage
        secondHeaderRight={
          canEditAnyNamespace() ? (
            <Button
              tutorial-anchor-id="add-route"
              component={Link}
              color="primary"
              size="small"
              variant="contained"
              to={`/routes/new`}
            >
              Add Route
            </Button>
          ) : null
        }
      >
        <Box p={2}>
          {isRoutesLoading && !isRoutesFirstLoaded ? (
            <Loading />
          ) : httpRoutes && httpRoutes.length > 0 ? (
            <>
              {this.renderKRTable()}
              {/* {this.renderInfoBox()} */}
            </>
          ) : (
            this.renderEmpty()
          )}
        </Box>
      </BasePage>
    );
  }
}
export const RouteListPage = withNamespace(withUserAuth(withRoutesData(withStyles(styles)(RouteListPageRaw))));
