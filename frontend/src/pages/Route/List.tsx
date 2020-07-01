import { Box, Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { deleteRoute, loadRoutes } from "actions/routes";
import { blinkTopProgressAction } from "actions/settings";
import { push } from "connected-react-router";
import { withRoutesData, WithRoutesDataProps } from "hoc/withRoutesData";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { BasePage } from "pages/BasePage";
import { Methods } from "pages/Route/Methods";
import React from "react";
import { Link } from "react-router-dom";
import { HttpRoute } from "types/route";
import { SuccessBadge } from "widgets/Badge";
import { H4 } from "widgets/Label";
import { Loading } from "widgets/Loading";
import { Namespaces } from "widgets/Namespaces";
import { KTable } from "widgets/Table";
import { DangerButton } from "widgets/Button";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles>, WithRoutesDataProps {}

interface State {}

interface RowData extends HttpRoute {
  index: number;
}

class RouteListPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const { dispatch, activeNamespaceName } = this.props;
    dispatch(loadRoutes(activeNamespaceName));
  }

  componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
    const { dispatch, activeNamespaceName } = this.props;

    if (prevProps.activeNamespaceName !== activeNamespaceName) {
      dispatch(loadRoutes(activeNamespaceName));
    }
  }

  private renderHosts(row: RowData) {
    return (
      <Box>
        {row.get("hosts").map((h) => {
          return <Box key={h}>{h}</Box>;
        })}
      </Box>
    );
  }

  private renderUrls(row: RowData) {
    return (
      <Box>
        {row.get("paths").map((h) => {
          return <Box key={h}>{h}</Box>;
        })}
      </Box>
    );
  }

  private renderRules(row: RowData) {
    if (!row.get("conditions")) {
      return null;
    }

    return row.get("conditions")!.map((x) => {
      return (
        <div>
          {x.get("type")} {x.get("name")} {x.get("operator")} {x.get("value")}{" "}
        </div>
      );
    });
  }

  private renderMethods(row: RowData) {
    return <Methods methods={row.get("methods")} />;
  }

  private renderSupportHttp(row: RowData) {
    if (row.get("schemes").find((x) => x === "http")) {
      return <SuccessBadge />;
    }
  }

  private renderSupportHttps(row: RowData) {
    if (row.get("schemes").find((x) => x === "https")) {
      return <SuccessBadge />;
    }
  }

  private renderTargets = (row: RowData) => {
    const { activeNamespaceName } = this.props;
    let sum = 0;
    row.get("destinations").forEach((x) => (sum += x.get("weight")));

    return row.get("destinations").map((x) => (
      <div key={x.get("host")}>
        {x.get("host").replace(`.${activeNamespaceName}.svc.cluster.local`, "").replace(`.svc.cluster.local`, "")}(
        {Math.floor((x.get("weight") / sum) * 1000 + 0.5) / 10}%)
      </div>
    ));
  };

  private renderAdvanced(row: RowData) {
    let res: string[] = [];
    if (row.get("mirror")) {
      res.push("mirror");
    }
    if (row.get("delay")) {
      res.push("delay");
    }
    if (row.get("fault")) {
      res.push("fault");
    }
    if (row.get("cors")) {
      res.push("cors");
    }
    if (row.get("retries")) {
      res.push("retries");
    }
    return res.join(",");
  }

  private getData() {
    const { httpRoutes } = this.props;
    const data: RowData[] = [];

    httpRoutes &&
      httpRoutes.forEach((httpRoute, index) => {
        const rowData = httpRoute as RowData;
        rowData.index = index;
        data.push(rowData);
      });

    return data;
  }

  private renderActions = (row: RowData) => {
    const { activeNamespaceName, dispatch } = this.props;
    return (
      <>
        {/* <IconButtonWithTooltip
          tooltipPlacement="top"
          tooltipTitle="Delete"
          aria-label="delete"
          onClick={() => {
            blinkTopProgressAction();
            dispatch(push(`/applications/${activeNamespaceName}/routes/${row.get("name")}/edit`));
          }}
        >
          <EditIcon />
        </IconButtonWithTooltip>
        <IconButtonWithTooltip
          tooltipPlacement="top"
          tooltipTitle="Delete"
          aria-label="delete"
          onClick={() => {
            blinkTopProgressAction();
            dispatch(deleteRoute(row.get("name"), row.get("namespace")));
          }}
        >
          <DeleteIcon />
        </IconButtonWithTooltip> */}
        <Button
          size="small"
          variant="outlined"
          style={{ marginRight: 16 }}
          color="primary"
          onClick={() => {
            blinkTopProgressAction();
            dispatch(push(`/applications/${activeNamespaceName}/routes/${row.get("name")}/edit`));
          }}
        >
          Edit
        </Button>
        <DangerButton
          variant="outlined"
          size="small"
          onClick={() => {
            blinkTopProgressAction();
            dispatch(deleteRoute(row.get("name"), row.get("namespace")));
          }}
        >
          Delete
        </DangerButton>
      </>
    );
  };

  public render() {
    const { isRoutesFirstLoaded, isRoutesLoading, activeNamespaceName } = this.props;
    const tableData = this.getData();
    return (
      <BasePage
        leftDrawer={<ApplicationSidebar />}
        secondHeaderLeft={<Namespaces />}
        secondHeaderRight={
          <>
            <H4>Routes</H4>
            <Button
              tutorial-anchor-id="add-route"
              component={(props: any) => <Link {...props} />}
              color="primary"
              size="small"
              variant="outlined"
              to={`/applications/${activeNamespaceName}/routes/new`}
            >
              Add
            </Button>
          </>
        }
      >
        <Box p={2}>
          {isRoutesLoading && !isRoutesFirstLoaded ? (
            <Loading />
          ) : (
            <KTable
              options={{
                paging: tableData.length > 20,
              }}
              columns={[
                {
                  title: "Domain",
                  field: "host",
                  sorting: false,
                  render: this.renderHosts,
                },
                {
                  title: "Http",
                  field: "http",
                  sorting: false,
                  render: this.renderSupportHttp,
                },
                {
                  title: "Https",
                  field: "https",
                  sorting: false,
                  render: this.renderSupportHttps,
                },
                {
                  title: "Methods",
                  field: "methods",
                  sorting: false,
                  render: this.renderMethods,
                },
                {
                  title: "Urls",
                  field: "urls",
                  sorting: false,
                  render: this.renderUrls,
                },
                {
                  title: "Targets",
                  field: "targets",
                  sorting: false,
                  render: this.renderTargets,
                },
                {
                  title: "Rules",
                  field: "rules",
                  sorting: false,
                  render: this.renderRules,
                },
                // {
                //   title: "Advanced Settings",
                //   field: "advanced",
                //   sorting: false,
                //   render: this.renderAdvanced
                // },
                {
                  title: "Actions",
                  field: "action",
                  sorting: false,
                  searchable: false,
                  render: this.renderActions,
                },
              ]}
              data={tableData}
              title=""
            />
          )}
        </Box>
      </BasePage>
    );
  }
}

export const RouteListPage = withRoutesData(withStyles(styles)(RouteListPageRaw));
