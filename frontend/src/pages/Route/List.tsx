import { Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import { deleteRoute, loadRoutes } from "actions/routes";
import { push } from "connected-react-router";
import MaterialTable from "material-table";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { HttpRoute } from "types/route";
import { ApplicationViewDrawer } from "widgets/ApplicationViewDrawer";
import { CustomizedButton } from "widgets/Button";
import { H4 } from "widgets/Label";
import { Loading } from "widgets/Loading";
import queryString from "query-string";
import { Namespaces } from "widgets/Namespaces";

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
    httpRoutes: state.get("routes").get("httpRoutes")
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

  private renderConditions(row: RowData) {
    if (row.get("conditions")) {
      return row.get("conditions")!.size + " Conditions";
    } else {
      return null;
    }
  }

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
        <Button onClick={() => dispatch(push(`/routes/${row.get("name")}/edit?namespace=${namespace}`))}>Edit</Button>
        <Button onClick={() => dispatch(deleteRoute(row.get("name"), row.get("namespace")))}>Delete</Button>
      </>
    );
  };

  public render() {
    const { classes, dispatch, isFirstLoaded, isLoading } = this.props;
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
                dispatch(push(`/routes/new`));
              }}>
              Add
            </CustomizedButton>
          </div>
        }>
        <div className={classes.root}>
          {isLoading && !isFirstLoaded ? (
            <Loading />
          ) : (
            <MaterialTable
              options={{
                pageSize: 20,
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
                  title: "Urls",
                  field: "urls",
                  sorting: false,
                  render: this.renderUrls
                },
                {
                  title: "Conditions",
                  field: "conditions",
                  sorting: false,
                  render: this.renderConditions
                },
                {
                  title: "Advanced Settings",
                  field: "advanced",
                  sorting: false,
                  render: this.renderAdvanced
                },
                {
                  title: "Actions",
                  field: "action",
                  sorting: false,
                  searchable: false,
                  render: this.renderActions
                }
              ]}
              data={this.getData()}
              title=""
            />
          )}
        </div>
      </BasePage>
    );
  }
}

export const RouteListPage = withStyles(styles)(connect(mapStateToProps)(RouteListPageRaw));
