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
  DialogActions,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  FormControlLabel,
  Switch,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from "@material-ui/core";
import { connect } from "react-redux";
import { loadUsersAction, createUserAction } from "../../actions/user";
import { Loading } from "../Loading";
import Immutable from "immutable";
import { allClusterRoleNames, User } from "../../types/user";
import SettingsIcon from "@material-ui/icons/Settings";
import TextField, { FilledTextFieldProps } from "@material-ui/core/TextField";

const styles = (theme: Theme) =>
  createStyles({
    expansionPanel: {
      boxShadow: "none"
    },
    panelDetail: {
      display: "block"
    },
    formControlWidth: {
      width: "100%"
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

interface State {}

const switchItems = [
  {
    label: "Applications View",
    key: "application_viewer_role"
  },
  {
    label: "Applications Edit",
    key: "application_editor_role"
  },
  {
    label: "Components View",
    key: "component_viewer_role"
  },
  {
    label: "Components Edit",
    key: "component_editor_role"
  },
  {
    label: "Configs View",
    key: "file_viewer_role"
  },
  {
    label: "Configs Edit",
    key: "file_editor_role"
  },
  {
    label: "Dependencies View",
    key: "dependency_viewer_role"
  },
  {
    label: "Dependencies Edit",
    key: "dependency_editor_role"
  }
];

class UsersDialogRaw extends React.PureComponent<Props, State> {
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
    return (
      <ExpansionPanel className={classes.expansionPanel}>
        <ExpansionPanelSummary aria-controls="panel1bh-content">
          <IconButton>
            <SettingsIcon fontSize="default" />
          </IconButton>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.panelDetail}>
          {switchItems.map(item => (
            <FormControlLabel
              key={item.label}
              control={
                <Switch
                  checked={!!rowData.permissions.get(item.key)}
                  onChange={() => console.log("123")}
                  color="primary"
                />
              }
              label={item.label}
            />
          ))}
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }

  private renderType(rowData: any) {
    if (rowData.type === "oidc") {
      return <div>External Auth</div>;
    }
    return <div>Auth Token</div>;
  }

  private renderTable() {
    const { dispatch, users, classes, isLoading } = this.props;

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
        isLoading={isLoading}
        title="Users Management"
        columns={[
          {
            title: "User Name",
            field: "name",
            initialEditValue: "",
            editComponent: props => (
              <TextField
                required
                className={classes.formControlWidth}
                label="User Name"
                variant="outlined"
                value={props.value ? props.value : ""}
                onChange={e => props.onChange(e.target.value)}
              />
            )
          },
          {
            title: "Token Provider",
            field: "type",
            initialEditValue: "oidc",
            render: rowData => this.renderType(rowData),
            editComponent: props => (
              <FormControl variant="outlined" className={classes.formControlWidth}>
                <InputLabel>Token Provider</InputLabel>
                <Select
                  value={props.value ? props.value : "oidc"}
                  onChange={e => props.onChange(e.target.value)}
                  labelId="demo-simple-select-outlined-label"
                  label="Token Provider">
                  <MenuItem value={"serviceAccount"}>Auth Token</MenuItem>
                  <MenuItem value={"oidc"}>External Auth</MenuItem>
                </Select>
              </FormControl>
            )
          },
          {
            title: "Permissions",
            field: "permissions",
            initialEditValue: Immutable.fromJS({
              application_viewer_role: true,
              component_viewer_role: true,
              file_viewer_role: true,
              dependency_viewer_role: true
            }),
            render: rowData => this.renderPermissions(rowData),
            editComponent: props => {
              console.log("props", props);
              return (
                <div>
                  {switchItems.map(item => (
                    <FormControlLabel
                      key={item.label}
                      control={
                        <Switch
                          checked={!!props.value.get(item.key)}
                          onChange={() => props.onChange(props.value.set(item.key, !props.value.get(item.key)))}
                          color="primary"
                        />
                      }
                      label={item.label}
                    />
                  ))}
                </div>
              );
            }
          }
        ]}
        data={tableData.reverse()}
        options={{
          actionsColumnIndex: -1,
          addRowPosition: "first",
          padding: "dense",
          draggable: false,
          rowStyle: {
            verticalAlign: "baseline"
          }
        }}
        // detailPanel={() => this.renderPermissions()}
        // onRowClick={(_event, _rowData, togglePanel) => togglePanel!()}
        editable={{
          onRowAdd: newData =>
            new Promise((resolve, reject) => {
              console.log("newData", newData);
              const user: User = Immutable.fromJS({
                name: newData.name,
                type: newData.type,
                clusterRoleNames: newData.permissions
              });
              dispatch(createUserAction(user));

              // reject();
            }),
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
          <DialogContent>{this.renderTable()}</DialogContent>
          <DialogActions></DialogActions>
        </Dialog>
      </div>
    );
  }
}

export const UsersDialog = connect(mapStateToProps)(withStyles(styles)(UsersDialogRaw));
