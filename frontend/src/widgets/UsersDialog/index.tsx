import React from "react";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { TDispatch } from "../../types";
import MaterialTable from "material-table";
import { RootState } from "../../reducers";
import { WithStyles, withStyles, Theme, createStyles, IconButton, DialogActions, Paper } from "@material-ui/core";
import { connect } from "react-redux";
import { loadUsersAction, createUserAction } from "../../actions/user";
import { Loading } from "../Loading";
import Immutable from "immutable";
import { clusterRoleNames, User } from "../../types/user";
import SettingsIcon from "@material-ui/icons/Settings";

const styles = (theme: Theme) => createStyles({});

const mapStateToProps = (state: RootState) => {
  return {
    users: state.get("users").get("users"),
    isLoading: state.get("users").get("isLoading")
  };
};

type StateProps = ReturnType<typeof mapStateToProps>;

interface Props extends StateProps, WithStyles<typeof styles> {
  open: boolean;
  onClose?: () => void;
  dispatch: TDispatch;
}

interface State {
  selectedUser?: User;
  clickedPanelName?: string;
}

class UsersDialogRaw extends React.PureComponent<Props, State> {
  private tableRef: React.RefObject<any>;

  constructor(props: Props) {
    super(props);
    this.state = {
      selectedUser: undefined,
      clickedPanelName: undefined
    };

    this.tableRef = React.createRef();
  }

  public componentDidMount() {
    const { dispatch } = this.props;
    dispatch(loadUsersAction());

    // this.tableRef &&
    //   this.tableRef.current &&
    //   this.tableRef.current.onToggleDetailPanel([0], this.tableRef.current.props.detailPanel);
  }

  private handleClose() {
    const { onClose } = this.props;

    onClose && onClose();
  }

  private renderPermissions() {
    const { selectedUser } = this.state;
    return <Paper>{selectedUser && selectedUser?.get("clusterRoleNames")}</Paper>;
  }

  private renderTable() {
    const { dispatch, users } = this.props;

    const tableData: any[] = [];
    users.forEach(user => {
      tableData.push({
        name: user.get("name"),
        type: user.get("type"),
        permissions: (
          <IconButton
            onClick={() => {
              this.setState({
                selectedUser: user
              });
              // hack, first time expand panel by click setting, need click twice
              // if (user.get("name") !== this.state.clickedPanelName) {
              //   console.log("aaaaaaaaaaaaaaaaaaa");
              //   this.tableRef.current.onToggleDetailPanel(
              //     [
              //       this.tableRef.current.dataManager.sortedData.findIndex(
              //         (item: any) => item.name === user.get("name")
              //       )
              //     ],
              //     () => this.renderPermissions()
              //   );
              // }

              this.tableRef.current.onToggleDetailPanel(
                [this.tableRef.current.dataManager.sortedData.findIndex((item: any) => item.name === user.get("name"))],
                () => this.renderPermissions()
              );

              this.setState({ clickedPanelName: user.get("name") });
            }}>
            <SettingsIcon fontSize="default" />
          </IconButton>
        )
      });
    });

    return (
      <MaterialTable
        tableRef={this.tableRef}
        title="Users Management"
        columns={[
          { title: "User Name", field: "name" },
          { title: "Token Provider", field: "type" },
          { title: "Permissions", field: "permissions" }
        ]}
        data={tableData}
        options={{
          actionsColumnIndex: -1
        }}
        // detailPanel={() => this.renderPermissions()}
        // onRowClick={(_event, _rowData, togglePanel) => togglePanel!()}
        editable={{
          onRowAdd: async newData => {
            const user: User = Immutable.fromJS({
              name: newData.name,
              type: newData.type,
              clusterRoleNames: clusterRoleNames
            });
            dispatch(createUserAction(user));
          },
          // onRowUpdate: (newData, oldData) =>
          //   new Promise((resolve, reject) => {
          //     setTimeout(() => {
          //         //   const data = this.state.data;
          //         //   const index = data.indexOf(oldData);
          //         //   data[index] = newData;
          //         //   this.setState({ data }, () => resolve());
          //       resolve();
          //     }, 1000);
          //   }),
          onRowDelete: oldData =>
            new Promise((resolve, reject) => {
              setTimeout(() => {
                console.log("oldData", oldData);
                //   let data = this.state.data;
                //   const index = data.indexOf(oldData);
                //   data.splice(index, 1);
                //   this.setState({ data }, () => resolve());
              }, 1000);
            })
        }}
      />
    );
  }

  public render() {
    const { open, isLoading } = this.props;

    return (
      <div>
        <Dialog
          open={open}
          onClose={() => this.handleClose()}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          maxWidth={"md"}
          fullWidth={true}>
          <DialogTitle id="alert-dialog-title">Settings</DialogTitle>
          <DialogContent>{isLoading ? <Loading /> : this.renderTable()}</DialogContent>
          <DialogActions></DialogActions>
        </Dialog>
      </div>
    );
  }
}

export const UsersDialog = connect(mapStateToProps)(withStyles(styles)(UsersDialogRaw));
