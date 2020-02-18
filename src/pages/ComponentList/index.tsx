import {
  Box,
  createStyles,
  IconButton,
  Theme,
  Tooltip,
  WithStyles,
  withStyles
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { Alert } from "@material-ui/lab";
import { push } from "connected-react-router";
import MaterialTable from "material-table";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "../../actions";
import {
  deleteComponentAction,
  duplicateComponentAction,
  loadComponentAction
} from "../../actions/component";
import {
  setErrorNotificationAction,
  setSuccessNotificationAction
} from "../../actions/notification";
import { RootState } from "../../reducers";
import { ConfirmDialog } from "../../widgets/ConfirmDialog";
import { BasePage } from "../BasePage";

const mapStateToProps = (state: RootState) => {
  return {
    components: state
      .get("components")
      .get("components")
      .toList()
  };
};

type StateProps = ReturnType<typeof mapStateToProps>;

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(3)
    }
  });

interface Props extends StateProps, WithStyles<typeof styles> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

interface States {
  isDeleteConfirmDialogOpen: boolean;
  deletingComponentId?: string;
}

class List extends React.PureComponent<Props, States> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isDeleteConfirmDialogOpen: false
    };
  }

  public onCreate = () => {
    this.props.dispatch(push(`/components/new`));
  };

  componentWillMount() {
    this.props.dispatch(loadComponentAction());
  }

  private closeConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: false,
      deletingComponentId: undefined
    });
  };

  private deleteConfirmedComponent = async () => {
    const { dispatch } = this.props;
    try {
      await dispatch(deleteComponentAction(this.state.deletingComponentId!));
      await dispatch(
        setSuccessNotificationAction("Successfully delete a component")
      );
    } catch {
      dispatch(setErrorNotificationAction("Something wrong"));
    }
  };

  private setDeletingComponentAndConfirm = (componentId: string) => {
    this.setState({
      isDeleteConfirmDialogOpen: true,
      deletingComponentId: componentId
    });
  };

  public render() {
    const { dispatch, components, classes } = this.props;
    const { isDeleteConfirmDialogOpen } = this.state;
    const data = components.map(component => {
      const onDeleteClick = () => {
        this.setDeletingComponentAndConfirm(component.get("id"));
      };
      return {
        action: (
          <>
            <Tooltip title="Edit this component" aria-label="duplicate">
              <IconButton
                aria-label="edit"
                onClick={() => {
                  dispatch(push(`/components/${component.get("id")}/edit`));
                }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Duplicate this component" aria-label="duplicate">
              <IconButton
                aria-label="edit"
                onClick={() => {
                  dispatch(duplicateComponentAction(component.get("id")));
                }}
              >
                <FileCopyIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete this component" aria-label="duplicate">
              <IconButton aria-label="delete" onClick={onDeleteClick}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </>
        ),
        name: component.get("name"),
        image: component.get("image"),
        cpu: component.get("cpu"),
        memory: component.get("memory"),
        port: (
          <div>
            {component
              .get("ports")
              .map(port => {
                return (
                  <span key={port.get("name")}>
                    {port.get("containerPort")} -> {port.get("servicePort")}
                  </span>
                );
              })
              .toArray()}
          </div>
        ),
        disk: component
          .get("disk")
          .map(disk => {
            return (
              <div key={disk.get("name")}>
                <strong>{disk.get("size")}M</strong> mount at{" "}
                <strong>{disk.get("path")}</strong>
              </div>
            );
          })
          .toArray()
      };
    });
    return (
      <BasePage
        title="Components"
        onCreate={this.onCreate}
        createButtonText="Add A Component"
      >
        <ConfirmDialog
          open={isDeleteConfirmDialogOpen}
          onClose={this.closeConfirmDialog}
          title="Are you sure to delete this Component?"
          content="Delete this Component will NOT affect applications that includes this component."
          onAgree={this.deleteConfirmedComponent}
        />

        <div className={classes.root}>
          <Alert severity="info">
            Component is a template config describes how to deploy a software on
            kapp system. Component can't run independently, but it can be easily
            added into any application. When adding a component into an
            application, the component config will be copyed into the
            application, which mean it's free to update existing component
            anytime without worring about breaking running applications.
          </Alert>
          <Box mt={3}>
            <MaterialTable
              options={{
                padding: "dense",
                pageSize: 20
              }}
              columns={[
                {
                  title: "Name",
                  field: "name",
                  sorting: false
                },
                { title: "Image", field: "image", sorting: false },
                { title: "CPU", field: "cpu", searchable: false },
                { title: "Memory", field: "memory", searchable: false },
                { title: "Disk", field: "disk", sorting: false },
                {
                  title: "Port",
                  field: "port",

                  sorting: false,
                  searchable: false
                },
                {
                  title: "Action",
                  field: "action",
                  sorting: false,
                  searchable: false
                }
              ]}
              data={data.toArray()}
              title=""
            />
          </Box>
        </div>
      </BasePage>
    );
  }
}

export default withStyles(styles)(connect(mapStateToProps)(List));
