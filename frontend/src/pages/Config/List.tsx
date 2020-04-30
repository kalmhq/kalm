import { Breadcrumbs, Box, createStyles, Link, Theme, withStyles, WithStyles } from "@material-ui/core";
import {
  deleteConfigAction,
  duplicateConfigAction,
  loadConfigsAction,
  setCurrentConfigIdChainAction
} from "actions/config";
import { setErrorNotificationAction } from "actions/notification";
import React from "react";
import { connect } from "react-redux";
import SyntaxHighlighter from "react-syntax-highlighter";
import { monokai } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { RootState } from "reducers";
import { ThunkDispatch } from "redux-thunk";
import { getCurrentConfig } from "selectors/config";
import { Actions } from "types";
import { ConfigNode, ConfigNodeType, initialRootConfigNode } from "types/config";
import { ConfigEditDialog } from "widgets/ConfigEditDialog";
import { ConfigNewDialog } from "widgets/ConfigNewDialog";
import { ConfigUploadDialog } from "widgets/ConfigUploadDialog";
import { ConfirmDialog } from "widgets/ConfirmDialog";
import { FileTree } from "widgets/FileTree";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { BasePage } from "../BasePage";
import { withNamespace, withNamespaceProps } from "permission/Namespace";
import { NormalInfoPaper } from "widgets/Paper";
import { H4 } from "widgets/Label";
import { AddFileIcon, UploadIcon, AddFolderIcon, EditIcon, CopyIcon, DeleteIcon, DeleteWhiteIcon } from "widgets/Icon";

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
      height: "100%"
    },
    leftTree: {
      width: "330px",
      minWidth: "330px",
      padding: "0",
      backgroundColor: "#252526"
    },
    fileDetail: {
      minHeight: "800px",
      padding: "0",
      backgroundColor: "#272822",
      flexGrow: 1,
      width: "200px"
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
      justifyContent: "center",
      color: "white"
    },
    fileViewer: {
      minWidth: "200px",
      height: "85vh",
      overflow: "auto"
    },
    fileTreeAction: {
      display: "flex",
      justifyContent: "flex-end",
      borderRadius: "0px",
      background: "#383838",
      padding: 0
    },
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

const mapStateToProps = (state: RootState, ownProps: any) => {
  return {
    currentConfig: getCurrentConfig(),
    rootConfig: state.get("configs").get("rootConfig"),
    currentConfigIdChain: state.get("configs").get("currentConfigIdChain"),
    currentNamespace: state.get("namespaces").get("active")
  };
};

type StateProps = ReturnType<typeof mapStateToProps>;

interface Props extends StateProps, WithStyles<typeof styles>, withNamespaceProps {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
  rootConfig: ConfigNode;
}

interface State {
  showConfigNewDialog: boolean;
  newConfigType: ConfigNodeType;
  showConfigEditDialog: boolean;
  showConfigDeleteDialog: boolean;
  showConfigUploadDialog: boolean;
}

class ConfigListRaw extends React.PureComponent<Props, State> {
  private initialState: State = {
    showConfigNewDialog: false,
    newConfigType: "file",
    showConfigEditDialog: false,
    showConfigDeleteDialog: false,
    showConfigUploadDialog: false
  };

  constructor(props: Props) {
    super(props);
    this.state = this.initialState;
  }

  public componentDidMount() {
    const { dispatch, currentNamespace } = this.props;

    dispatch(loadConfigsAction(currentNamespace));
  }

  public componentDidUpdate(prevProps: Props) {
    if (prevProps.currentNamespace !== this.props.currentNamespace) {
      this.props.dispatch(setCurrentConfigIdChainAction([initialRootConfigNode.get("id")]));
      this.props.dispatch(loadConfigsAction(this.props.currentNamespace));
      this.setState(this.initialState);
    }
  }

  private showDeleteConfirmDialog = () => {
    this.setState({
      showConfigDeleteDialog: true
    });
  };

  private closeDeleteConfirmDialog = () => {
    this.setState({
      showConfigDeleteDialog: false
    });
  };

  private renderDeleteConfirmDialog = () => {
    const { showConfigDeleteDialog } = this.state;

    return (
      <ConfirmDialog
        open={showConfigDeleteDialog}
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
      dispatch(setErrorNotificationAction());
    }
  };

  private showUploadConfirmDialog = () => {
    this.setState({
      showConfigUploadDialog: true
    });
  };

  private closeUploadConfirmDialog = () => {
    this.setState({
      showConfigUploadDialog: false
    });
  };

  private renderUploadConfirmDialog = () => {
    const { showConfigUploadDialog } = this.state;
    const { dispatch } = this.props;

    return (
      <ConfigUploadDialog open={showConfigUploadDialog} onClose={this.closeUploadConfirmDialog} dispatch={dispatch} />
    );
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

  public handleUpload = () => {
    this.showUploadConfirmDialog();
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
  public renderFileTreeActions() {
    const { classes } = this.props;

    return (
      <NormalInfoPaper elevation={0} className={classes.fileTreeAction}>
        <IconButtonWithTooltip
          tooltipPlacement="top"
          tooltipTitle="Add file"
          aria-label="add-file"
          onClick={() => this.handleAdd("file")}>
          <AddFileIcon />
        </IconButtonWithTooltip>

        <IconButtonWithTooltip
          tooltipPlacement="top"
          tooltipTitle="Add folder"
          aria-label="add-folder"
          onClick={() => this.handleAdd("folder")}>
          <AddFolderIcon />
        </IconButtonWithTooltip>

        <IconButtonWithTooltip
          tooltipPlacement="top"
          tooltipTitle="Upload configs"
          aria-label="upload-configs"
          onClick={() => this.handleUpload()}>
          <UploadIcon />
        </IconButtonWithTooltip>
      </NormalInfoPaper>
    );
  }
  public renderActions() {
    const { currentConfig, hasRole } = this.props;
    if (!hasRole("writer")) {
      return null;
    }
    if (currentConfig.get("type") === "file") {
      return (
        <div>
          <IconButtonWithTooltip
            tooltipPlacement="top"
            tooltipTitle="Edit"
            aria-label="edit"
            onClick={() => this.handleEdit()}>
            <EditIcon />
          </IconButtonWithTooltip>

          <IconButtonWithTooltip
            tooltipPlacement="top"
            tooltipTitle="Duplicate"
            aria-label="duplicate"
            onClick={() => this.handleDuplicate()}>
            <CopyIcon />
          </IconButtonWithTooltip>

          <IconButtonWithTooltip
            tooltipPlacement="top"
            tooltipTitle="Delete"
            aria-label="delete"
            onClick={() => this.handleDelete()}>
            <DeleteWhiteIcon />
          </IconButtonWithTooltip>
        </div>
      );
    } else {
      return (
        <div>
          {currentConfig.get("id") !== initialRootConfigNode.get("id") && currentConfig.get("children").size === 0 && (
            <IconButtonWithTooltip
              tooltipPlacement="top"
              tooltipTitle="Delete"
              aria-label="delete"
              onClick={() => this.handleDelete()}>
              <DeleteIcon />
            </IconButtonWithTooltip>
          )}
        </div>
      );
    }
  }

  public render() {
    const { dispatch, rootConfig, classes, currentConfig } = this.props;
    const { showConfigNewDialog, showConfigEditDialog, newConfigType } = this.state;

    return (
      <BasePage
        secondHeaderRight={
          <Box className={classes.secondHeaderRight}>
            <H4 className={classes.secondHeaderRightItem}>Configs</H4>
          </Box>
        }>
        <div className={classes.root}>
          <div className={classes.leftTree}>
            {this.renderFileTreeActions()}
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
              <SyntaxHighlighter showLineNumbers className={classes.fileViewer} style={monokai}>
                {currentConfig.get("content")}
              </SyntaxHighlighter>
            ) : (
              <div className={classes.noSelectedFile}>
                {currentConfig.get("children").size > 0 ? "No selected file" : "Empty folder"}{" "}
              </div>
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
        {this.renderDeleteConfirmDialog()}
        {this.renderUploadConfirmDialog()}
      </BasePage>
    );
  }
}

export const ConfigListPage = connect(mapStateToProps)(withNamespace(withStyles(styles)(ConfigListRaw)));
