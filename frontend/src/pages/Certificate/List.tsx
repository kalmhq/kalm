import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { NewModal, addCertificateDialogId } from "./New";
import { CustomizedButton } from "widgets/Button";
import { H4 } from "widgets/Label";
import { Loading } from "widgets/Loading";
import { loadCertificates, deleteCertificateAction, loadCertificateIssuers } from "actions/certificate";
import { grey } from "@material-ui/core/colors";
import MaterialTable from "material-table";
import { customSearchForImmutable } from "../../utils/tableSearch";
import { Certificate } from "types/certificate";
import { FoldButtonGroup } from "widgets/FoldButtonGroup";
import { ConfirmDialog } from "widgets/ConfirmDialog";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { openDialogAction } from "actions/dialog";

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

const mapStateToProps = (state: RootState) => {
  return {
    isLoading: state.get("certificates").get("isLoading"),
    isFirstLoaded: state.get("certificates").get("isFirstLoaded"),
    certificates: state.get("certificates").get("certificates")
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {
  isDeleteConfirmDialogOpen: boolean;
  deletingCertificate: Certificate | null;
}

interface RowData extends Certificate {
  index: number;
}

class CertificateListPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isDeleteConfirmDialogOpen: false,
      deletingCertificate: null
    };
  }

  componentDidMount() {
    this.props.dispatch(loadCertificates());
    this.props.dispatch(loadCertificateIssuers());
  }

  private renderName = (rowData: RowData) => {
    return rowData.get("name");
  };

  private renderDomains = (rowData: RowData) => {
    return (
      <>
        {rowData.get("domains")?.map(domain => {
          return <div key={domain}>{domain}</div>;
        })}
      </>
    );
  };

  private renderMoreActions = (rowData: RowData) => {
    let options = [
      {
        text: "Delete",
        onClick: () => {
          this.showDeleteConfirmDialog(rowData);
        },
        iconName: "delete",
        requiredRole: "writer"
      }
    ];
    return <FoldButtonGroup options={options} />;
  };

  private renderDeleteConfirmDialog = () => {
    const { isDeleteConfirmDialogOpen } = this.state;

    return (
      <ConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={this.closeDeleteConfirmDialog}
        title="Are you sure to delete this Certificate?"
        content=""
        onAgree={this.confirmDelete}
      />
    );
  };

  private closeDeleteConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: false,
      deletingCertificate: null
    });
  };

  private showDeleteConfirmDialog = (deletingCertificate: Certificate) => {
    this.setState({
      isDeleteConfirmDialogOpen: true,
      deletingCertificate
    });
  };

  private confirmDelete = async () => {
    const { dispatch } = this.props;
    try {
      const { deletingCertificate } = this.state;
      if (deletingCertificate) {
        await dispatch(deleteCertificateAction(deletingCertificate.get("name")));
        await dispatch(setSuccessNotificationAction("Successfully delete a certificate"));
      }
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  private renderStatus = (rowData: RowData) => {
    return rowData.get("ready") === "True" ? "Normal" : rowData.get("reason");
  };

  private renderType = (rowData: RowData) => {
    return rowData.get("isSelfManaged") ? "SELF MANAGED" : "KAPP ISSUED";
  };

  private renderInUse = (rowData: RowData) => {
    return "Yes";
  };

  private renderRenewal = (rowData: RowData) => {
    return "ineligible";
  };

  private getColumns() {
    const columns = [
      // @ts-ignore
      {
        title: "Name",
        field: "name",
        sorting: false,
        render: this.renderName,
        customFilterAndSearch: customSearchForImmutable
      },
      {
        title: "Domains",
        field: "domains",
        sorting: false,
        render: this.renderDomains
      },
      {
        title: "Status",
        field: "status",
        sorting: false,
        render: this.renderStatus
      },
      {
        title: "Type",
        field: "isSelfManaged",
        sorting: false,
        render: this.renderType
      },
      {
        title: "In Use?",
        field: "inUse",
        sorting: false,
        render: this.renderInUse
      },
      {
        title: "Renewal Eligibility",
        field: "Renewal",
        sorting: false,
        render: this.renderRenewal
      },
      {
        title: "Actions",
        field: "moreAction",
        sorting: false,
        searchable: false,
        render: this.renderMoreActions
      }
    ];

    return columns;
  }

  private getData = () => {
    const { certificates } = this.props;
    const data: RowData[] = [];

    certificates.forEach((certificate, index) => {
      const rowData = certificate as RowData;
      rowData.index = index;
      data.push(rowData);
    });

    return data;
  };

  public render() {
    const { classes, dispatch, isFirstLoaded, isLoading } = this.props;
    return (
      <BasePage
        secondHeaderRight={
          <div className={classes.secondHeaderRight}>
            <H4 className={classes.secondHeaderRightItem}>Certificates</H4>
            <CustomizedButton
              color="primary"
              size="large"
              className={classes.secondHeaderRightItem}
              onClick={() => {
                dispatch(openDialogAction(addCertificateDialogId));
              }}>
              Add
            </CustomizedButton>
          </div>
        }>
        <NewModal />
        {this.renderDeleteConfirmDialog()}
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
              columns={this.getColumns()}
              data={this.getData()}
              title=""
            />
          )}
        </div>
      </BasePage>
    );
  }
}

export const CertificateListPage = withStyles(styles)(connect(mapStateToProps)(CertificateListPageRaw));
