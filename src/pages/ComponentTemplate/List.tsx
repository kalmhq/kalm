import {
  Box,
  createStyles,
  Fade,
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
import {
  deleteComponentAction,
  duplicateComponentAction,
  loadComponentTemplatesAction
} from "../../actions/component";
import {
  setErrorNotificationAction,
  setSuccessNotificationAction
} from "../../actions/notification";
import { ConfirmDialog } from "../../widgets/ConfirmDialog";
import { Loading } from "../../widgets/Loading";
import { BasePage } from "../BasePage";
import {
  ComponentTemplateDataWrapper,
  WithComponentTemplatesDataProps
} from "./DataWrapper";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(3)
    }
  });

interface Props
  extends WithComponentTemplatesDataProps,
    WithStyles<typeof styles> {}

interface States {
  isDeleteConfirmDialogOpen: boolean;
  deletingComponentTemplateId?: string;
}

class ComponentTemplateListRaw extends React.PureComponent<Props, States> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isDeleteConfirmDialogOpen: false
    };
  }

  public onCreate = () => {
    this.props.dispatch(push(`/componenttemplates/new`));
  };

  componentDidMount() {
    this.props.dispatch(loadComponentTemplatesAction());
  }

  private closeConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: false,
      deletingComponentTemplateId: undefined
    });
  };

  private deleteConfirmedComponent = async () => {
    const { dispatch } = this.props;
    try {
      await dispatch(deleteComponentAction(this.state.deletingComponentTemplateId!));
      await dispatch(
        setSuccessNotificationAction("Successfully delete a component")
      );
    } catch {
      dispatch(setErrorNotificationAction("Something wrong"));
    }
  };

  private setDeletingComponentAndConfirm = (componentTemplateId: string) => {
    this.setState({
      isDeleteConfirmDialogOpen: true,
      deletingComponentTemplateId: componentTemplateId
    });
  };

  private renderDataContent() {
    const { dispatch, components } = this.props;
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
                  dispatch(
                    push(`/componenttemplates/${component.get("id")}/edit`)
                  );
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
      <Fade in={true} timeout={500}>
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
      </Fade>
    );
  }

  public render() {
    const { classes, isLoading } = this.props;
    const { isDeleteConfirmDialogOpen } = this.state;

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
          <Box mt={3}>{isLoading ? <Loading /> : this.renderDataContent()}</Box>
        </div>
      </BasePage>
    );
  }
}

export const ComponentTemplateList = withStyles(styles)(
  ComponentTemplateDataWrapper(ComponentTemplateListRaw)
);
