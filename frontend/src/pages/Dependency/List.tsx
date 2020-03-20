import { Box, Button, Grid, LinearProgress, Tooltip, Typography } from "@material-ui/core";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import WarningIcon from "@material-ui/icons/Warning";
import MaterialTable from "material-table";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "../../types";
import { loadDependenciesAction } from "../../actions/dependency";
import { CustomizedDialog } from "../../forms/Application/ComponentModal";
import { RootState } from "../../reducers";
import { KappDependencyContent, KappDependencyStatus, KappDependencyStatusText } from "../../types/dependency";
import { FlexRowItemCenterBox } from "../../widgets/Box";
import { CustomizedButton } from "../../widgets/Button";
import { BasePage } from "../BasePage";

interface State {
  isDialogOpen: boolean;
  dialogDependency?: KappDependencyContent;
}

interface Props extends ReturnType<typeof mapStateToProps> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

const mapStateToProps = (state: RootState) => {
  const dependenciesState = state.get("dependencies");
  return {
    dependencies: dependenciesState.get("dependencies").toList(),
    isLoading: dependenciesState.get("isListLoading"),
    isFirstLoaded: dependenciesState.get("isListFirstLoaded")
  };
};

class DependencyListRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isDialogOpen: false
    };
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(loadDependenciesAction());
  }

  private getTableData = (): KappDependencyContent[] => {
    const { dependencies } = this.props;

    const res: KappDependencyContent[] = [];
    dependencies.forEach(x => {
      res.push({
        name: x.get("name"),
        type: x.get("type"),
        version: x.get("version"),
        imageLink: require("../../images/kong-logo.png"),
        description:
          "Kong is a popular open source API gateway. Built for multi-cloud and hybrid, optimized for microservices and distributed architectures. \n" +
          "\n" +
          "Kapp use Kong as a kuberntes ingress. With this dependency intalled, you are able to configure external access, bind domain and certification for your applications.",
        provider: "official",
        status: x.get("status"),
        projectHomepageLink: "https://www.kongcompany.com/"
      });
    });

    return res;
    // return [
    //   {
    //     name: "Kong",
    //     version: "0.1 (kong 0.14)",
    //     imageLink: require("../../images/kong-logo.png"),
    //     description:
    //       "Kong is a popular open source API gateway. Built for multi-cloud and hybrid, optimized for microservices and distributed architectures. \n" +
    //       "\n" +
    //       "Kapp use Kong as a kuberntes ingress. With this dependency intalled, you are able to configure external access, bind domain and certification for your applications.",
    //     provider: "official",
    //     status: KappDependencyStatus.NotInstalled,
    //     projectHomepageLink: "https://www.kongcompany.com/"
    //   },
    //   {
    //     name: "Prometheus",
    //     imageLink: require("../../images/prometheus-logo.png"),
    //     description:
    //       "Prometheus is an open-source monitoring system with a dimensional data model, flexible query language, efficient time series database and modern alerting approach.\n" +
    //       "\n" +
    //       "Kapp use Prometheus as a time series database and alert manager. With this dependency installed, you are able to configure alerts.",
    //     version: "0.1 (prometheus 1.2)",
    //     provider: "official",
    //     status: KappDependencyStatus.InstallFailed,
    //     statusText: "Disk not enough",
    //     projectHomepageLink: "https://www.kongcompany.com/"
    //   },
    //   {
    //     name: "Prometheus",
    //     imageLink: require("../../images/prometheus-logo.png"),
    //     description:
    //       "Prometheus is an open-source monitoring system with a dimensional data model, flexible query language, efficient time series database and modern alerting approach.\n" +
    //       "\n" +
    //       "Kapp use Prometheus as a time series database and alert manager. With this dependency installed, you are able to configure alerts.",
    //     version: "0.1 (prometheus 1.2)",
    //     provider: "official",
    //     status: KappDependencyStatus.Installing,
    //     projectHomepageLink: "https://www.kongcompany.com/"
    //   },
    //   {
    //     name: "Prometheus",
    //     imageLink: require("../../images/prometheus-logo.png"),
    //     description:
    //       "Prometheus is an open-source monitoring system with a dimensional data model, flexible query language, efficient time series database and modern alerting approach.\n" +
    //       "\n" +
    //       "Kapp use Prometheus as a time series database and alert manager. With this dependency installed, you are able to configure alerts.",
    //     version: "0.1 (prometheus 1.2)",
    //     provider: "official",
    //     status: KappDependencyStatus.Uninstalling,
    //     projectHomepageLink: "https://www.kongcompany.com/"
    //   },
    //   {
    //     name: "Prometheus",
    //     imageLink: require("../../images/prometheus-logo.png"),
    //     description:
    //       "Prometheus is an open-source monitoring system with a dimensional data model, flexible query language, efficient time series database and modern alerting approach.\n" +
    //       "\n" +
    //       "Kapp use Prometheus as a time series database and alert manager. With this dependency installed, you are able to configure alerts.",
    //     version: "0.1 (prometheus 1.2)",
    //     provider: "official",
    //     status: KappDependencyStatus.Running,
    //     projectHomepageLink: "https://www.kongcompany.com/"
    //   }
    // ];
  };

  private renderName = (rowData: KappDependencyContent) => (
    <FlexRowItemCenterBox>
      <img src={rowData.imageLink} width="20px" alt="" />
      <Box ml={1}>{rowData.name}</Box>
    </FlexRowItemCenterBox>
  );

  private renderStatus = (rowData: KappDependencyContent) => {
    let content: React.ReactNode;
    let tooltipText: string = "";

    switch (rowData.status) {
      case KappDependencyStatus.Running: {
        content = <CheckCircleIcon color="primary" />;
        break;
      }
      case KappDependencyStatus.Uninstalling: {
        content = <LinearProgress variant="determinate" value={50} color="secondary" style={{ width: "50px" }} />;
        break;
      }
      case KappDependencyStatus.NotInstalled: {
        break;
      }
      case KappDependencyStatus.InstallFailed: {
        tooltipText = rowData.statusText!;
        content = <WarningIcon color="secondary" />;
        break;
      }
      case KappDependencyStatus.Installing: {
        content = <LinearProgress variant="determinate" value={50} style={{ width: "50px" }} />;
        break;
      }
    }

    let text = <Box ml={1}>{KappDependencyStatusText[rowData.status]}</Box>;

    if (!!tooltipText) {
      text = (
        <Tooltip title={tooltipText} arrow>
          {text}
        </Tooltip>
      );
    }

    return (
      <Box display="flex" alignItems="center">
        {content}
        {text}
      </Box>
    );
  };

  private renderDataTable() {
    return (
      <MaterialTable
        options={{
          search: false,
          toolbar: false,
          paging: false,
          draggable: false
        }}
        // components={{ Container: props => props.children }}
        onRowClick={this.openDialog}
        columns={[
          {
            title: "Name",
            field: "name",
            sorting: false,
            render: this.renderName
          },
          { title: "Version", field: "version", sorting: false },
          { title: "Type", field: "type", sorting: false },
          { title: "Provider", field: "provider", sorting: false },
          { title: "Status", field: "status", sorting: false, render: this.renderStatus }
        ]}
        data={this.getTableData()}
        title=""
      />
    );
  }

  private handleDialogClose = () => {
    this.setState({
      isDialogOpen: false
      //   dialogDependency: undefined
    });
  };

  private openDialog = (_event?: React.MouseEvent, rowData?: KappDependencyContent) => {
    this.setState({
      isDialogOpen: true,
      dialogDependency: rowData!
    });
  };

  private install = () => {};

  private uninstall = () => {};

  private renderDialogMainButton = () => {
    const { dialogDependency } = this.state;
    if (!dialogDependency) {
      return null;
    }

    switch (dialogDependency.status) {
      case KappDependencyStatus.Running: {
        return (
          <CustomizedButton onClick={this.uninstall} color="primary" variant="contained">
            Uninstall
          </CustomizedButton>
        );
      }
      case KappDependencyStatus.Uninstalling: {
        return (
          <CustomizedButton onClick={() => {}} pending color="primary" variant="contained">
            Uninstall
          </CustomizedButton>
        );
      }
      case KappDependencyStatus.NotInstalled: {
        return (
          <CustomizedButton onClick={this.install} color="primary" variant="contained">
            Install
          </CustomizedButton>
        );
      }
      case KappDependencyStatus.InstallFailed: {
        return (
          <CustomizedButton onClick={this.install} color="primary" variant="contained">
            Retry
          </CustomizedButton>
        );
      }
      case KappDependencyStatus.Installing: {
        return (
          <CustomizedButton onClick={() => {}} pending color="primary" variant="contained">
            Installing
          </CustomizedButton>
        );
      }
    }
  };

  private renderDialog() {
    const { isDialogOpen, dialogDependency } = this.state;

    if (!dialogDependency) {
      return null;
    }

    return (
      <CustomizedDialog
        title={dialogDependency.name}
        open={isDialogOpen}
        handleClose={this.handleDialogClose}
        dialogProps={{ maxWidth: "sm" }}
        actions={
          <>
            <Button onClick={this.handleDialogClose} color="default" variant="contained">
              Close
            </Button>
            {this.renderDialogMainButton()}
          </>
        }>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Box display="flex" flexDirection="column" alignItems="center">
              <img src={dialogDependency.imageLink} width="100px" alt="" />
              <Box mt={2}>{this.renderStatus(dialogDependency)}</Box>
            </Box>
          </Grid>
          <Grid item xs={9}>
            {
              <Typography
                dangerouslySetInnerHTML={{
                  __html: dialogDependency.description.replace(/\n/g, "<br />")
                }}></Typography>
            }
          </Grid>
        </Grid>
      </CustomizedDialog>
    );
  }

  public render() {
    return (
      <BasePage title="Kapp dependencies" noBreadcrumb>
        {this.renderDialog()}
        {this.renderDataTable()}
      </BasePage>
    );
  }
}

export const DependencyListPage = connect(mapStateToProps)(DependencyListRaw);
