import { Box, createStyles, Fade, IconButton, Theme, Tooltip, WithStyles, withStyles } from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { Alert } from "@material-ui/lab";
import { push } from "connected-react-router";
import MaterialTable from "material-table";
import React from "react";
import { deleteComponentAction, duplicateComponentAction } from "../../actions/componentTemplate";
import { setErrorNotificationAction, setSuccessNotificationAction } from "../../actions/notification";
import { ConfirmDialog } from "../../widgets/ConfirmDialog";
import {
  defaultDuplicateDialogHostStateValue,
  DuplicateDialog,
  DuplicateDialogHostState
} from "../../widgets/DuplicateDialog";
import { HelperContainer } from "../../widgets/Helper";
import { Loading } from "../../widgets/Loading";
import { BasePage } from "../BasePage";
import { ComponentTemplateDataWrapper, WithComponentTemplatesDataProps } from "./DataWrapper";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(3)
    }
  });

interface Props extends WithComponentTemplatesDataProps, WithStyles<typeof styles> {}

interface States extends DuplicateDialogHostState {
  isDeleteConfirmDialogOpen: boolean;
  deletingComponentTemplateName?: string;
}

class ComponentTemplateListRaw extends React.PureComponent<Props, States> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isDeleteConfirmDialogOpen: false,
      ...defaultDuplicateDialogHostStateValue
    };
  }

  public onCreate = () => {
    this.props.dispatch(push(`/componenttemplates/new`));
  };

  private closeConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: false,
      deletingComponentTemplateName: undefined
    });
  };

  private closeDuplicateDialog = () => {
    this.setState({
      isDuplicateDialogShow: false,
      duplicatingItemId: ""
    });
  };

  private deleteComponent = async () => {
    const { dispatch } = this.props;
    try {
      await dispatch(deleteComponentAction(this.state.deletingComponentTemplateName!));
      await dispatch(setSuccessNotificationAction("Successfully delete a component"));
    } catch {
      dispatch(setErrorNotificationAction("Something wrong"));
    }
  };

  private duplicateComponent = async (newName: string) => {
    const { dispatch } = this.props;
    try {
      await dispatch(duplicateComponentAction(this.state.duplicatingItemId!, newName));
      await dispatch(setSuccessNotificationAction("Successfully duplicate a component"));
    } catch {
      dispatch(setErrorNotificationAction("Something wrong"));
    }
  };

  private setDeletingIdAndConfirm = (componentTemplateName: string) => {
    this.setState({
      isDeleteConfirmDialogOpen: true,
      deletingComponentTemplateName: componentTemplateName
    });
  };

  private setDuplicatingIdAndConfrim = (componentTemplateName: string) => {
    this.setState({
      isDuplicateDialogShow: true,
      duplicatingItemId: componentTemplateName
    });
  };

  private renderDataContent() {
    const { dispatch, componentTemplates } = this.props;
    const data = componentTemplates.map(componentTemplate => {
      const onDeleteClick = () => {
        this.setDeletingIdAndConfirm(componentTemplate.get("name"));
      };
      return {
        action: (
          <>
            <Tooltip title="Edit this component" aria-label="duplicate">
              <IconButton
                aria-label="edit"
                onClick={() => {
                  dispatch(push(`/componenttemplates/${componentTemplate.get("name")}/edit`));
                }}>
                <EditIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Duplicate this component" aria-label="duplicate">
              <IconButton
                aria-label="edit"
                onClick={() => {
                  this.setDuplicatingIdAndConfrim(componentTemplate.get("name"));
                }}>
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
        name: componentTemplate.get("name"),
        image: componentTemplate.get("image"),
        cpu: componentTemplate.get("cpu"),
        memory: componentTemplate.get("memory"),
        port: (
          <div>
            {componentTemplate.get("ports")
              ? componentTemplate
                  .get("ports")!
                  .map(port => {
                    return (
                      <span key={port.get("name")}>
                        {port.get("containerPort")} -> {port.get("servicePort")}
                      </span>
                    );
                  })
                  .toArray()
              : []}
          </div>
        ),
        disks: componentTemplate.get("disks")
          ? componentTemplate
              .get("disks")!
              .map(disk => {
                return (
                  <div key={disk.get("name")}>
                    <strong>{disk.get("size")}M</strong> mount at <strong>{disk.get("path")}</strong>
                  </div>
                );
              })
              .toArray()
          : []
      };
    });
    return (
      <Fade in={true} timeout={500}>
        <MaterialTable
          actions={[
            {
              isFreeAction: true,
              icon: "add",
              tooltip: "Add",
              onClick: this.onCreate
            }
          ]}
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
            { title: "Disks", field: "disks", sorting: false },
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
          title="Component Templates"
        />
      </Fade>
    );
  }

  public render() {
    const { classes, isLoading, isFirstLoaded } = this.props;
    const { isDeleteConfirmDialogOpen, isDuplicateDialogShow } = this.state;

    return (
      <BasePage title="Component Templates">
        <ConfirmDialog
          open={isDeleteConfirmDialogOpen}
          onClose={this.closeConfirmDialog}
          title="Are you sure to delete this Component?"
          content="Delete this Component will NOT affect applications that includes this component."
          onAgree={this.deleteComponent}
        />

        <DuplicateDialog
          open={isDuplicateDialogShow}
          onClose={this.closeDuplicateDialog}
          title="Duplicate Component Template"
          content={
            <span>
              You need to give your comming Component Template a new name. <br />
              The name can <strong>NOT</strong> be modified later.
            </span>
          }
          textFieldProps={{
            type: "text",
            label: "Name",
            placeholder: "Name of your new Component Template",
            variant: "outlined",
            helperText: 'Allowed characters are: digits (0-9), lower case letters (a-z), "-", and "."'
          }}
          onAgree={this.duplicateComponent}
        />

        <div className={classes.root}>
          <HelperContainer>
            <Alert severity="info">
              Component templates are stored configs that describe how to deploy software images on kapp system.
              Component template can't run independently, but it can be easily copy into any application as a component
              to run.
              {/* When adding a component
            into an application, the component config will be copyed into the
            application, which mean it's free to update existing component
            anytime without worring about breaking running applications. */}
            </Alert>
          </HelperContainer>
          <Box mt={3}>{isLoading && !isFirstLoaded ? <Loading /> : this.renderDataContent()}</Box>
        </div>
      </BasePage>
    );
  }
}

export const ComponentTemplateListPage = withStyles(styles)(ComponentTemplateDataWrapper(ComponentTemplateListRaw));
