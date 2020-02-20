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
} from "../../actions/componentTemplate";
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
import {
  DuplicateDialog,
  DuplicateDialogHostState,
  defaultDuplicateDialogHostStateValue
} from "../../widgets/DuplicateDialog";
import { HelperContainer } from "../../widgets/Helper";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(3)
    }
  });

interface Props
  extends WithComponentTemplatesDataProps,
    WithStyles<typeof styles> {}

interface States extends DuplicateDialogHostState {
  isDeleteConfirmDialogOpen: boolean;
  deletingComponentTemplateId?: string;
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

  componentDidMount() {
    this.props.dispatch(loadComponentTemplatesAction());
  }

  private closeConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: false,
      deletingComponentTemplateId: undefined
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
      await dispatch(
        deleteComponentAction(this.state.deletingComponentTemplateId!)
      );
      await dispatch(
        setSuccessNotificationAction("Successfully delete a component")
      );
    } catch {
      dispatch(setErrorNotificationAction("Something wrong"));
    }
  };

  private duplicateComponent = async (newName: string) => {
    const { dispatch } = this.props;
    try {
      await dispatch(
        duplicateComponentAction(this.state.duplicatingItemId!, newName)
      );
      await dispatch(
        setSuccessNotificationAction("Successfully duplicate a component")
      );
    } catch {
      dispatch(setErrorNotificationAction("Something wrong"));
    }
  };

  private setDeletingIdAndConfirm = (componentTemplateId: string) => {
    this.setState({
      isDeleteConfirmDialogOpen: true,
      deletingComponentTemplateId: componentTemplateId
    });
  };

  private setDuplicatingIdAndConfrim = (componentTemplateId: string) => {
    this.setState({
      isDuplicateDialogShow: true,
      duplicatingItemId: componentTemplateId
    });
  };

  private renderDataContent() {
    const { dispatch, componentTemplates } = this.props;
    const data = componentTemplates.map(componentTemplate => {
      const onDeleteClick = () => {
        this.setDeletingIdAndConfirm(componentTemplate.get("id"));
      };
      return {
        action: (
          <>
            <Tooltip title="Edit this component" aria-label="duplicate">
              <IconButton
                aria-label="edit"
                onClick={() => {
                  dispatch(
                    push(
                      `/componenttemplates/${componentTemplate.get("id")}/edit`
                    )
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
                  this.setDuplicatingIdAndConfrim(componentTemplate.get("id"));
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
        name: componentTemplate.get("name"),
        image: componentTemplate.get("image"),
        cpu: componentTemplate.get("cpu"),
        memory: componentTemplate.get("memory"),
        port: (
          <div>
            {componentTemplate
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
        disk: componentTemplate
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
    const { isDeleteConfirmDialogOpen, isDuplicateDialogShow } = this.state;

    return (
      <BasePage
        title="Component Templates"
        onCreate={this.onCreate}
        createButtonText="Add A Component"
      >
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
              You need to give your comming Component Template a new name.{" "}
              <br />
              The name can <strong>NOT</strong> be modified later.
            </span>
          }
          textFieldProps={{
            type: "text",
            label: "Name",
            placeholder: "Name of your new Component Template",
            variant: "outlined",
            helperText:
              'Allowed characters are: digits (0-9), lower case letters (a-z), "-", and "."'
          }}
          onAgree={this.duplicateComponent}
        />

        <div className={classes.root}>
          <HelperContainer>
            <Alert severity="info">
              Component templates are stored configs that describe how to deploy
              software images on kapp system. Component template can't run
              independently, but it can be easily copy into any application as a
              component to run.
              {/* When adding a component
            into an application, the component config will be copyed into the
            application, which mean it's free to update existing component
            anytime without worring about breaking running applications. */}
            </Alert>
          </HelperContainer>
          <Box mt={3}>{isLoading ? <Loading /> : this.renderDataContent()}</Box>
        </div>
      </BasePage>
    );
  }
}

export const ComponentTemplateList = withStyles(styles)(
  ComponentTemplateDataWrapper(ComponentTemplateListRaw)
);
