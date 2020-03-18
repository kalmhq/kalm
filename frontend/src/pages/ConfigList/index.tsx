import React from "react";
import { BasePage } from "../BasePage";
import { connect } from "react-redux";
import { RootState } from "../../reducers";
import { IconButton, Theme, withStyles, Breadcrumbs, Link, Button, WithStyles, createStyles } from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { deleteConfigAction, duplicateConfigAction } from "../../actions/config";
import { ThunkDispatch } from "redux-thunk";
import { Actions, ConfigNode } from "../../actions";
import { FileTree } from "../../widgets/FileTree";
import { getCurrentConfig } from "../../selectors/config";
import SyntaxHighlighter from "react-syntax-highlighter";
import { monokai } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { ConfigNewDialog } from "../../widgets/ConfigNewDialog";
import { ConfigEditDialog } from "../../widgets/ConfigEditDialog";
import { setSuccessNotificationAction, setErrorNotificationAction } from "../../actions/notification";
import { ConfirmDialog } from "../../widgets/ConfirmDialog";
import { loadConfigsAction } from "../../actions/config";

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
  showConfigEditDialog: boolean;
  isDeleteConfirmDialogOpen: boolean;
}

class List extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showConfigNewDialog: false,
      showConfigEditDialog: false,
      isDeleteConfirmDialogOpen: false
    };
  }

  public componentDidMount() {
    const { dispatch } = this.props;

    dispatch(loadConfigsAction());
  }

  private closeConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: false
    });
  };

  private deleteConfirmedConfig = async () => {
    const { dispatch } = this.props;
    try {
      await dispatch(deleteConfigAction(getCurrentConfig()));
      await dispatch(setSuccessNotificationAction("Successfully delete an config"));
    } catch {
      dispatch(setErrorNotificationAction("Something wrong"));
    }
  };

  private setDeletingConfigAndConfirm = () => {
    this.setState({
      isDeleteConfirmDialogOpen: true
    });
  };

  private renderDeleteConfirmDialog = () => {
    const { isDeleteConfirmDialogOpen } = this.state;

    return (
      <ConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={this.closeConfirmDialog}
        title="Are you sure to delete this Config?"
        content="You will lost this config, and this action is irrevocable."
        onAgree={this.deleteConfirmedConfig}
      />
    );
  };

  public onCreate = () => {
    this.setState({
      showConfigNewDialog: true
    });
  };

  public renderFileBreadcrumbs() {
    const { rootConfig, currentConfigIdChain } = this.props;

    let tmpConfig = rootConfig;
    const links: React.ReactElement[] = [];
    currentConfigIdChain.forEach((configId: string) => {
      if (tmpConfig.get("id") !== configId) {
        tmpConfig = tmpConfig.get("children").get(configId) as ConfigNode;
      }

      if (tmpConfig.get("id") === "0") {
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
    const { dispatch } = this.props;
    return (
      <div>
        <IconButton
          aria-label="edit"
          onClick={() => {
            this.setState({ showConfigEditDialog: true });
          }}>
          <EditIcon />
        </IconButton>

        <IconButton
          aria-label="edit"
          onClick={() => {
            const config = getCurrentConfig();
            dispatch(duplicateConfigAction(config));
          }}>
          <FileCopyIcon />
        </IconButton>

        <IconButton
          aria-label="delete"
          onClick={() => {
            this.setDeletingConfigAndConfirm();
          }}>
          <DeleteIcon />
        </IconButton>
      </div>
    );
  }

  public render() {
    const { dispatch, rootConfig, classes, currentConfig } = this.props;
    const { showConfigNewDialog, showConfigEditDialog } = this.state;

    return (
      <BasePage
        title="Configs"
        rightAction={
          <Button variant="contained" color="primary" onClick={this.onCreate}>
            Add
          </Button>
        }>
        {this.renderDeleteConfirmDialog()}
        <div className={classes.root}>
          <div className={classes.leftTree}>
            <FileTree rootConfig={rootConfig} dispatch={dispatch} />
          </div>
          <div className={classes.fileDetail}>
            <div className={classes.breadcrumbsAndAction}>
              {this.renderFileBreadcrumbs()}
              {currentConfig.get("type") === "file" && this.renderActions()}
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

export default connect(mapStateToProps)(withStyles(styles)(List));
