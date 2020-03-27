import React from "react";
import { BasePage } from "../BasePage";
import { connect } from "react-redux";
import { RootState } from "../../reducers";
import { IconButton, Theme, withStyles, Breadcrumbs, Link, WithStyles, createStyles } from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import NoteAddIcon from "@material-ui/icons/NoteAdd";
import CreateNewFolderIcon from "@material-ui/icons/CreateNewFolder";
import { deleteConfigAction, duplicateConfigAction } from "../../actions/config";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "../../types";
import { FileTree } from "../../widgets/FileTree";
import { getCurrentConfig } from "../../selectors/config";
import SyntaxHighlighter from "react-syntax-highlighter";
import { monokai } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { ConfigNewDialog } from "../../widgets/ConfigNewDialog";
import { ConfigEditDialog } from "../../widgets/ConfigEditDialog";
import { setErrorNotificationAction } from "../../actions/notification";
import { ConfirmDialog } from "../../widgets/ConfirmDialog";
import { loadConfigsAction } from "../../actions/config";
import { ConfigNode, initialRootConfigNode, ConfigNodeType } from "../../types/config";

const styles = (theme: Theme) =>
  createStyles({
    fileIcon: {
      marginRight: "15px"
    },
    fileName: {
      verticalAlign: "super"
    },
    root: {
      display: "flex",
      padding: "24px"
    },
    leftTree: {
      width: "400px",
      padding: "15px"
    },
    fileDetail: {
      width: "100%",
      minHeight: "800px",
      padding: "15px",
      backgroundColor: "#fff"
    },
    breadcrumbsAndAction: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    },
    noSelectedFile: {
      width: "100%",
      height: "300px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  });

const mapStateToProps = (state: RootState, ownProps: any) => {
  return {
    currentConfig: getCurrentConfig(),
    rootConfig: state.get("configs").get("rootConfig"),
    currentConfigIdChain: state.get("configs").get("currentConfigIdChain")
  };
};

type StateProps = ReturnType<typeof mapStateToProps>;

interface Props extends StateProps, WithStyles<typeof styles> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
  rootConfig: ConfigNode;
}

interface State {
  showConfigNewDialog: boolean;
  newConfigType: ConfigNodeType;
  showConfigEditDialog: boolean;
  isDeleteConfirmDialogOpen: boolean;
}

class ConfigListRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showConfigNewDialog: false,
      newConfigType: "file",
      showConfigEditDialog: false,
      isDeleteConfirmDialogOpen: false
    };
  }

  public componentDidMount() {
    const { dispatch } = this.props;

    dispatch(loadConfigsAction());
  }

  private showDeleteConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: true
    });
  };

  private closeDeleteConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: false
    });
  };

  private renderDeleteConfirmDialog = () => {
    const { isDeleteConfirmDialogOpen } = this.state;

    return (
      <ConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={this.closeDeleteConfirmDialog}
        title="Are you sure to delete this Config?"
        content="You will lost this config, and this action is irrevocable."
        onAgree={this.confirmDelete}
      />
    );
  };

  private confirmDelete = async () => {
    const { dispatch } = this.props;
    try {
      await dispatch(deleteConfigAction(getCurrentConfig()));
    } catch {
      dispatch(setErrorNotificationAction("Something wrong"));
    }
  };

  public handleAdd = (configType: ConfigNodeType) => {
    this.setState({
      showConfigNewDialog: true,
      newConfigType: configType
    });
  };

  public handleEdit = () => {
    this.setState({ showConfigEditDialog: true });
  };

  public handleDuplicate = () => {
    const { dispatch } = this.props;
    const config = getCurrentConfig();
    dispatch(duplicateConfigAction(config));
  };

  public handleDelete = () => {
    this.showDeleteConfirmDialog();
  };

  public renderFileBreadcrumbs() {
    const { rootConfig, currentConfigIdChain } = this.props;

    let tmpConfig = rootConfig;
    const links: React.ReactElement[] = [];
    currentConfigIdChain.forEach((configId: string) => {
      if (tmpConfig.get("id") !== configId) {
        tmpConfig = tmpConfig.get("children").get(configId) as ConfigNode;
      }

      if (tmpConfig.get("id") === initialRootConfigNode.get("id")) {
        links.push(
          <Link key={configId} color="inherit" onClick={() => console.log("link", configId)}>
            {""}
          </Link>
        );
        return;
      }

      links.push(
        <Link key={configId} color="inherit" onClick={() => console.log("link", configId)}>
          {tmpConfig.get("name")}
        </Link>
      );
    });

    return <Breadcrumbs aria-label="breadcrumb">{links}</Breadcrumbs>;
  }

  public renderActions() {
    const { currentConfig } = this.props;
    if (currentConfig.get("type") === "file") {
      return (
        <div>
          <IconButton aria-label="edit" onClick={() => this.handleEdit()}>
            <EditIcon />
          </IconButton>

          <IconButton aria-label="duplicate" onClick={() => this.handleDuplicate()}>
            <FileCopyIcon />
          </IconButton>

          <IconButton aria-label="add-file" onClick={() => this.handleAdd("file")}>
            <NoteAddIcon />
          </IconButton>

          <IconButton aria-label="add-folder" onClick={() => this.handleAdd("folder")}>
            <CreateNewFolderIcon />
          </IconButton>

          <IconButton aria-label="delete" onClick={() => this.handleDelete()}>
            <DeleteIcon />
          </IconButton>
        </div>
      );
    } else {
      return (
        <div>
          <IconButton aria-label="add-file" onClick={() => this.handleAdd("file")}>
            <NoteAddIcon />
          </IconButton>

          <IconButton aria-label="add-folder" onClick={() => this.handleAdd("folder")}>
            <CreateNewFolderIcon />
          </IconButton>
        </div>
      );
    }
  }

  public render() {
    const { dispatch, rootConfig, classes, currentConfig } = this.props;
    const { showConfigNewDialog, showConfigEditDialog, newConfigType } = this.state;

    return (
      <BasePage title="Configs">
        {this.renderDeleteConfirmDialog()}
        <div className={classes.root}>
          <div className={classes.leftTree}>
            <FileTree
              rootConfig={rootConfig}
              dispatch={dispatch}
              handleAdd={(configType: ConfigNodeType) => this.handleAdd(configType)}
              handleEdit={() => this.handleEdit()}
              handleDuplicate={() => this.handleDuplicate()}
              handleDelete={() => this.handleDelete()}
            />
          </div>
          <div className={classes.fileDetail}>
            <div className={classes.breadcrumbsAndAction}>
              {this.renderFileBreadcrumbs()}
              {this.renderActions()}
            </div>

            {currentConfig.get("type") === "file" ? (
              <SyntaxHighlighter style={monokai}>{currentConfig.get("content")}</SyntaxHighlighter>
            ) : (
              <div className={classes.noSelectedFile}>No selected file</div>
            )}
          </div>
        </div>

        <ConfigNewDialog
          dispatch={dispatch}
          open={showConfigNewDialog}
          configType={newConfigType}
          onClose={() => this.setState({ showConfigNewDialog: false })}
        />
        <ConfigEditDialog
          dispatch={dispatch}
          open={showConfigEditDialog}
          config={currentConfig}
          onClose={() => this.setState({ showConfigEditDialog: false })}
        />
      </BasePage>
    );
  }
}

export const ConfigListPage = connect(mapStateToProps)(withStyles(styles)(ConfigListRaw));
