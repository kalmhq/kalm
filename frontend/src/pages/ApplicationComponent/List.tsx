import { Box, createStyles, Theme, Typography, WithStyles, withStyles } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import WarningIcon from "@material-ui/icons/Warning";
import { push } from "connected-react-router";
import Immutable from "immutable";
import MaterialTable from "material-table";
import { withNamespaceProps } from "permission/Namespace";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { formValueSelector } from "redux-form/immutable";
import { ButtonGrey } from "widgets/Button";
import { KappTooltip } from "../../forms/Application/KappTooltip";
import { ApplicationComponentDetails, SharedEnv } from "../../types/application";
import { EnvTypeExternal } from "../../types/common";
import { H4 } from "../../widgets/Label";
import { Loading } from "../../widgets/Loading";
import { BasePage } from "../BasePage";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      // padding: theme.spacing(3),
      "& tr.MuiTableRow-root td": {
        verticalAlign: "middle"
      }
    },
    sencondHeaderRight: {
      height: "100%",
      width: "100%",
      display: "flex",
      alignItems: "center"
    },
    sencondHeaderRightItem: {
      marginLeft: 20
    }
  });

const mapStateToProps = (state: RootState) => {
  const applicationsRoot = state.get("applications");
  const activeNamespace = state.get("namespaces").get("active");
  const isApplicationListLoading = applicationsRoot.get("isListLoading");
  const isApplicationListFirstLoaded = applicationsRoot.get("isListFirstLoaded");
  const application = applicationsRoot
    .get("applications")
    .find(application => application.get("name") === activeNamespace);
  const isAdmin = state.get("auth").get("isAdmin");

  const selector = formValueSelector("application");
  const sharedEnv: Immutable.List<SharedEnv> = selector(state, "sharedEnvs");

  return {
    sharedEnv,
    isAdmin,
    isLoading: isApplicationListLoading,
    isFirstLoaded: isApplicationListFirstLoaded,
    application
  };
};
interface Props extends WithStyles<typeof styles>, withNamespaceProps, ReturnType<typeof mapStateToProps> {}

interface State {}

interface RowData extends ApplicationComponentDetails {
  index: number;
}

class ApplicationComponentListRaw extends React.PureComponent<Props, State> {
  private tableRef: React.RefObject<MaterialTable<ApplicationComponentDetails>> = React.createRef();

  private defaultState = {};

  constructor(props: Props) {
    super(props);
    this.state = this.defaultState;
  }

  private getData = () => {
    const { application } = this.props;
    const data: RowData[] = [];

    application?.get("components").forEach((component, index) => {
      const rowData = component as RowData;
      rowData.index = index;
      data.push(rowData);
    });

    return data;
  };

  private renderNameColumn = (rowData: RowData) => rowData.get("name");
  private renderTypeColumn = (rowData: RowData) => rowData.get("workloadType");
  private renderReplicasColumn = (rowData: RowData) => rowData.get("replicas");
  private renderCpuColumn = (rowData: RowData) => rowData.get("cpu") || "-";
  private renderMemoryColumn = (rowData: RowData) => rowData.get("memory") || "-";
  private renderPortsColumn = (rowData: RowData) =>
    rowData.get("ports")
      ? rowData
          .get("ports")!
          .map(
            x =>
              (x.get("containerPort") === undefined ? "" : x.get("containerPort")) +
              ":" +
              (x.get("servicePort") === undefined ? "" : x.get("servicePort"))
          )
          .toArray()
          .join(", ")
      : "-";

  private renderVolumesColumn = (rowData: RowData) =>
    rowData.get("volumes") && rowData.get("volumes")!.size > 0
      ? rowData
          .get("volumes")!
          .map(x => x.get("path"))
          .toArray()
          .join(", ")
      : "-";

  private renderPluginsColumn = (rowData: RowData) => {
    return rowData.get("plugins")
      ? Array.from(
          new Set(
            rowData
              .get("plugins")!
              .map(x => x.get("name"))
              .toArray()
          )
        ).join(",")
      : "-";
  };

  private isEnvInSharedEnv = (envName: string) => {
    const { sharedEnv } = this.props;
    return !!sharedEnv.find(x => x.get("name") === envName);
  };

  private renderEnvsColumn = (rowData: RowData) => {
    const externalEnvs = rowData.get("env")
      ? rowData.get("env")!.filter(x => {
          return x.get("type") === EnvTypeExternal;
        })
      : Immutable.List([]);

    // const staticEnvs = rowData.get("env").filter(x => {
    //   return x.get("type") === EnvTypeStatic;
    // });

    // const linkedEnvs = rowData.get("env").filter(x => {
    //   return x.get("type") === EnvTypeLinked;
    // });

    const missingExternalVariables = externalEnvs.filter(x => {
      return !this.isEnvInSharedEnv(x.get("name"));
    });

    const missingLinkedVariables = externalEnvs.filter(x => {
      return false; //TODO
    });

    const allEnvCount = rowData.get("env") ? rowData.get("env")!.size : 0;
    const missingEnvCount = missingLinkedVariables.size + missingExternalVariables.size;

    const envContent =
      missingEnvCount > 0 ? (
        <KappTooltip
          title={
            <>
              <Typography color="inherit">
                <strong>Missing External Variables</strong>
              </Typography>
              {missingExternalVariables
                .map(x => {
                  return (
                    <div key={x.get("name")}>
                      <em>{x.get("name")}</em>
                    </div>
                  );
                })
                .toArray()}
            </>
          }>
          <Box
            color="warning.main"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            whiteSpace="nowrap">
            <Box mr={1}>{`${allEnvCount - missingEnvCount} / ${allEnvCount}`}</Box>
            <WarningIcon />
          </Box>
        </KappTooltip>
      ) : allEnvCount > 0 ? (
        <Box color="text.primary" display="flex" alignItems="center">
          <Box mr={1}>{`${allEnvCount} / ${allEnvCount}`}</Box>
        </Box>
      ) : (
        "-"
      );

    return envContent;
  };

  private renderSecondHeaderRight() {
    const { classes, dispatch, application } = this.props;
    return (
      <div className={classes.sencondHeaderRight}>
        <H4 className={classes.sencondHeaderRightItem}>Components</H4>
        <ButtonGrey
          className={classes.sencondHeaderRightItem}
          onClick={() => {
            if (application) {
              dispatch(push(`/applications/${application.get("name")}/edit?component=`));
            }
          }}>
          Add
        </ButtonGrey>
      </div>
    );
  }

  public render() {
    const { classes, isLoading, isFirstLoaded, application, dispatch } = this.props;

    return (
      <BasePage secondHeaderRight={this.renderSecondHeaderRight()}>
        <div className={classes.root}>
          {isLoading && !isFirstLoaded ? (
            <Loading />
          ) : (
            <MaterialTable
              actions={[
                {
                  icon: "edit",
                  onClick: (_event, rowData) => {
                    rowData = rowData as RowData;
                    if (application) {
                      dispatch(push(`/applications/${application.get("name")}/edit?component=${rowData.get("name")}`));
                    }
                  }
                }
              ]}
              options={{
                pageSize: 20,
                padding: "dense",
                // search: false,
                // paging: false,
                // toolbar: false,
                actionsColumnIndex: -1,
                addRowPosition: "first",
                draggable: false,
                headerStyle: { color: grey[400] }
              }}
              columns={[
                { title: "Name", field: "name", sorting: false, render: this.renderNameColumn },
                { title: "Workload", field: "type", sorting: false, render: this.renderTypeColumn },
                { title: "Replicas", field: "replicas", sorting: false, render: this.renderReplicasColumn },
                { title: "Cpu", field: "cpu", sorting: false, render: this.renderCpuColumn },
                { title: "Memory", field: "memory", sorting: false, render: this.renderMemoryColumn },
                { title: "Ports", field: "ports", sorting: false, render: this.renderPortsColumn },
                { title: "Volumes", field: "volumes", sorting: false, render: this.renderVolumesColumn },
                { title: "Plugins", field: "plugins", sorting: false, render: this.renderPluginsColumn },
                { title: "Envs", field: "envs", sorting: false, render: this.renderEnvsColumn }
              ]}
              data={this.getData()}
              title={""}
            />
          )}
        </div>
      </BasePage>
    );
  }
}

export const ApplicationComponentListPage = connect(mapStateToProps)(withStyles(styles)(ApplicationComponentListRaw));
