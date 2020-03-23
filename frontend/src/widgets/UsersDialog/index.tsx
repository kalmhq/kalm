import React from "react";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { TDispatch } from "../../types";
import MaterialTable from "material-table";
import { RootState } from "../../reducers";
import {
  WithStyles,
  withStyles,
  Theme,
  createStyles,
  IconButton,
  DialogActions,
  Paper,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  FormControlLabel,
  Switch
} from "@material-ui/core";
import { connect } from "react-redux";
import { loadUsersAction, createUserAction } from "../../actions/user";
import { Loading } from "../Loading";
import Immutable from "immutable";
import { clusterRoleNames, User } from "../../types/user";
import SettingsIcon from "@material-ui/icons/Settings";

const styles = (theme: Theme) =>
  createStyles({
    expansionPanel: {
      boxShadow: "none"
    },
    panelDetail: {
      display: "block"
    }
  });

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
}

class UsersDialogRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    // this.state = {
    //   selectedUser: undefined
    // };
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

  private renderPermissions(rowData: any) {
    const { classes } = this.props;
    const switchItems = [
      {
        label: "Applications View",
        checked: rowData.permissions.indexOf("application_viewer_role") != -1,
        onChange: (v: any) => console.log(v)
      },
      {
        label: "Applications Edit",
        checked: rowData.permissions.indexOf("application_editor_role") != -1,
        onChange: (v: any) => console.log(v)
      },
      {
        label: "Components View",
        checked: rowData.permissions.indexOf("component_viewer_role") != -1,
        onChange: (v: any) => console.log(v)
      },
      {
        label: "Components Edit",
        checked: rowData.permissions.indexOf("component_editor_role") != -1,
        onChange: (v: any) => console.log(v)
      },
      {
        label: "Configs View",
        checked: rowData.permissions.indexOf("file_viewer_role") != -1,
        onChange: (v: any) => console.log(v)
      },
      {
        label: "Configs Edit",
        checked: rowData.permissions.indexOf("file_editor_role") != -1,
        onChange: (v: any) => console.log(v)
      },
      {
        label: "Dependencies View",
        checked: rowData.permissions.indexOf("dependency_viewer_role") != -1,
        onChange: (v: any) => console.log(v)
      },
      {
        label: "Dependencies Edit",
        checked: rowData.permissions.indexOf("dependency_editor_role") != -1,
        onChange: (v: any) => console.log(v)
      }
    ];
    return (
      <ExpansionPanel className={classes.expansionPanel}>
        <ExpansionPanelSummary aria-controls="panel1bh-content" id="panel1bh-header">
          <SettingsIcon />
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.panelDetail}>
          {switchItems.map(item => (
            <FormControlLabel
              key={item.label}
              control={<Switch checked={item.checked} onChange={item.onChange} name="checkedB" color="primary" />}
              label={item.label}
            />
          ))}
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }

  private renderTable() {
    const { dispatch, users } = this.props;

    const tableData: any[] = [];
    users.forEach(user => {
      tableData.push({
        name: user.get("name"),
        type: user.get("type"),
        permissions: user.get("clusterRoleNames")
      });
    });

    return (
      <MaterialTable
        title="Users Management"
        columns={[
          { title: "User Name", field: "name" },
          { title: "Token Provider", field: "type" },
          { title: "Permissions", field: "permissions", render: rowData => this.renderPermissions(rowData) }
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
          //       //   const data = this.state.data;
          //       //   const index = data.indexOf(oldData);
          //       //   data[index] = newData;
          //       //   this.setState({ data }, () => resolve());
          //       resolve();
          //     }, 1000);
          //   }),
          onRowDelete: async oldData => {
            console.log("oldData", oldData);
          }
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
