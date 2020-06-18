import { Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import { deleteRoute, loadRoutes } from "actions/routes";
import { push } from "connected-react-router";
import MaterialTable from "material-table";
import { BasePage } from "pages/BasePage";
import queryString from "query-string";
import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { HttpRoute } from "types/route";
import { ApplicationViewDrawer } from "widgets/ApplicationViewDrawer";
import { SuccessBadge } from "widgets/Badge";
import { CustomizedButton } from "widgets/Button";
import { H4 } from "widgets/Label";
import { Loading } from "widgets/Loading";
import { Namespaces } from "widgets/Namespaces";
import { blinkTopProgressAction } from "../../actions/settings";
import Immutable from "immutable";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    secondHeaderRight: {
      height: "100%",
      width: "100%",
      display: "flex",
      alignItems: "center"
    },
    secondHeaderRightItem: {
      marginLeft: 20
    }
  });

const mapStateToProps = (state: RootState, ownProps: RouteComponentProps) => {
  const query = queryString.parse(ownProps.location.search);
  const activeNamespace = state.get("namespaces").get("active");
  return {
    namespace: (query.namespace as string) || activeNamespace,
    isLoading: state.get("routes").get("isLoading"),
    isFirstLoaded: state.get("routes").get("isFirstLoaded"),
    httpRoutes: state
      .get("routes")
      .get("httpRoutes")
      .get(activeNamespace) as Immutable.List<HttpRoute> | undefined
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

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
    const { dispatch, namespace } = this.props;
    dispatch(loadRoutes(namespace));
  }

  private renderHosts(row: RowData) {
    return row.get("hosts").join(",");
  }

  private renderUrls(row: RowData) {
    return row.get("paths").join(",");
  }

  private renderRules(row: RowData) {
    if (!row.get("conditions")) {
      return null;
    }

    return row.get("conditions")!.map(x => {
      return (
        <div>
          {x.get("type")} {x.get("name")} {x.get("operator")} {x.get("value")}{" "}
        </div>
      );
    });
  }

  private renderMethods(row: RowData) {
    return row.get("methods").join(",");
  }

  private renderSupportHttp(row: RowData) {
    if (row.get("schemes").find(x => x === "http")) {
      return <SuccessBadge />;
    }
  }

  private renderSupportHttps(row: RowData) {
    if (row.get("schemes").find(x => x === "https")) {
      return <SuccessBadge />;
    }
  }

  private renderTargets = (row: RowData) => {
    const { namespace } = this.props;
    let sum = 0;
    row.get("destinations").forEach(x => (sum += x.get("weight")));

    return row.get("destinations").map(x => (
      <div key={x.get("host")}>
        {x
          .get("host")
          .replace(`.${namespace}.svc.cluster.local`, "")
          .replace(`.svc.cluster.local`, "")}
        ({Math.floor((x.get("weight") / sum) * 1000 + 0.5) / 10}%)
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
    const { namespace, dispatch } = this.props;
    return (
      <>
        <Button
          onClick={() => {
            blinkTopProgressAction();
            dispatch(push(`/routes/${row.get("name")}/edit?namespace=${namespace}`));
          }}>
          Edit
        </Button>
        <Button
          onClick={() => {
            blinkTopProgressAction();
            dispatch(deleteRoute(row.get("name"), row.get("namespace")));
          }}>
          Delete
        </Button>
      </>
    );
  };

  public render() {
    const { classes, dispatch, isFirstLoaded, isLoading } = this.props;
    const tableData = this.getData();
    return (
      <BasePage
        leftDrawer={<ApplicationViewDrawer />}
        secondHeaderLeft={<Namespaces />}
        secondHeaderRight={
          <div className={classes.secondHeaderRight}>
            <H4 className={classes.secondHeaderRightItem}>Routes</H4>
            <CustomizedButton
              color="primary"
              size="large"
              className={classes.secondHeaderRightItem}
              onClick={() => {
                blinkTopProgressAction();
                dispatch(push(`/routes/new`));
              }}>
              Add
            </CustomizedButton>
          </div>
        }>
        <div>
          {isLoading && !isFirstLoaded ? (
            <Loading />
          ) : (
            <MaterialTable
              options={{
                pageSize: 20,
                paging: tableData.length > 20,
                padding: "dense",
                draggable: false,
                rowStyle: {
                  verticalAlign: "baseline"
                },
                headerStyle: {
                  color: "black",
                  backgroundColor: grey[100],
                  fontSize: 12,
                  fontWeight: 400,
                  height: 20,
                  paddingTop: 0,
                  paddingBottom: 0
                }
              }}
              columns={[
                {
                  title: "Host",
                  field: "host",
                  sorting: false,
                  render: this.renderHosts
                },

                {
                  title: "Http",
                  field: "http",
                  sorting: false,
                  render: this.renderSupportHttp
                },
                {
                  title: "Https",
                  field: "https",
                  sorting: false,
                  render: this.renderSupportHttps
                },
                {
                  title: "Methods",
                  field: "methods",
                  sorting: false,
                  render: this.renderMethods
                },
                {
                  title: "Urls",
                  field: "urls",
                  sorting: false,
                  render: this.renderUrls
                },
                {
                  title: "Targets",
                  field: "targets",
                  sorting: false,
                  render: this.renderTargets
                },
                {
                  title: "Rules",
                  field: "rules",
                  sorting: false,
                  render: this.renderRules
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
                  render: this.renderActions
                }
              ]}
              data={tableData}
              title=""
            />
          )}
        </div>
      </BasePage>
    );
  }
}

export const RouteListPage = withStyles(styles)(connect(mapStateToProps)(RouteListPageRaw));
