import { Box, Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { deleteRouteAction } from "actions/routes";
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
import { DangerButton, CustomizedButton } from "widgets/Button";
import { Loading } from "widgets/Loading";
import { Namespaces } from "widgets/Namespaces";
import { KTable } from "widgets/Table";
import { Targets } from "widgets/Targets";
import { OpenInBrowser } from "widgets/OpenInBrowser";
import { CopyAsCurl } from "widgets/CopyAsCurl";
import { EmptyList } from "widgets/EmptyList";
import { KalmRoutesIcon } from "widgets/Icon";
import { indigo } from "@material-ui/core/colors";

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

    return <Targets activeNamespaceName={activeNamespaceName} destinations={row.get("destinations")} />;
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
        <OpenInBrowser route={row as HttpRoute} />
        <CopyAsCurl route={row as HttpRoute} />
        <Button
          size="small"
          variant="outlined"
          style={{ marginLeft: 16, marginRight: 16 }}
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
            dispatch(deleteRouteAction(row.get("name"), row.get("namespace")));
          }}
        >
          Delete
        </DangerButton>
      </>
    );
  };

  private renderEmpty() {
    const { dispatch, activeNamespaceName } = this.props;

    return (
      <EmptyList
        image={<KalmRoutesIcon style={{ height: 120, width: 120, color: indigo[200] }} />}
        title={"You don't have any Routes"}
        content="Add a Route to allow external requests to your Application. You can use Routes to specify how hosts and paths map to components, configure HTTPS, and setup canary and blue-green deployments."
        button={
          <CustomizedButton
            variant="contained"
            color="primary"
            onClick={() => {
              blinkTopProgressAction();
              dispatch(push(`/applications/${activeNamespaceName}/routes/new`));
            }}
          >
            Add Route
          </CustomizedButton>
        }
      />
    );
  }

  public render() {
    const { isRoutesFirstLoaded, isRoutesLoading, activeNamespaceName, httpRoutes } = this.props;
    const tableData = this.getData();
    return (
      <BasePage
        leftDrawer={<ApplicationSidebar />}
        secondHeaderLeft={<Namespaces />}
        secondHeaderRight={
          <>
            {/* <H4>Routes</H4> */}
            <Button
              tutorial-anchor-id="add-route"
              component={Link}
              color="primary"
              size="small"
              variant="outlined"
              to={`/applications/${activeNamespaceName}/routes/new`}
            >
              Add Route
            </Button>
          </>
        }
      >
        <Box p={2}>
          {isRoutesLoading && !isRoutesFirstLoaded ? (
            <Loading />
          ) : httpRoutes && httpRoutes.size > 0 ? (
            <KTable
              options={{
                paging: tableData.length > 20,
              }}
              columns={[
                {
                  title: "Methods",
                  field: "methods",
                  sorting: false,
                  render: this.renderMethods,
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
                  title: "Domain",
                  field: "host",
                  sorting: false,
                  render: this.renderHosts,
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
          ) : (
            this.renderEmpty()
          )}
        </Box>
      </BasePage>
    );
  }
}

export const RouteListPage = withRoutesData(withStyles(styles)(RouteListPageRaw));
