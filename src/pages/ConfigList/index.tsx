import React from "react";
import { BasePage } from "../BasePage";
import MaterialTable from "material-table";
import { connect, DispatchProp } from "react-redux";
import { RootState } from "../../reducers";
import {
  IconButton,
  Icon,
  makeStyles,
  Theme,
  withStyles,
  Breadcrumbs,
  Typography,
  Link
} from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { push } from "connected-react-router";
import { deleteConfigAction } from "../../actions/config";
import { ThunkDispatch } from "redux-thunk";
import { Actions, Config } from "../../actions";
import { FileTree } from "../../widgets/FileTree";
import { getCurrentConfig } from "../../selectors/config";
import SyntaxHighlighter from "react-syntax-highlighter";
import { monokai } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { ConfigNewDialog } from "../../widgets/ConfigNewDialog";
import { ConfigEditDialog } from "../../widgets/ConfigEditDialog";

const styles = (theme: Theme) => ({
  fileIcon: {
    marginRight: "15px"
  },
  fileName: {
    verticalAlign: "super"
  },
  displayFlex: {
    display: "flex"
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

interface Props extends StateProps {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
  classes: any;
  rootConfig: Config;
}

interface State {
  showConfigNewDialog: boolean;
  showConfigEditDialog: boolean;
}

class List extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showConfigNewDialog: false,
      showConfigEditDialog: false
    };
  }

  public onCreate = () => {
    this.setState({
      showConfigNewDialog: true
    });
  };

  public renderFileBreadcrumbs() {
    const { dispatch, rootConfig, currentConfigIdChain } = this.props;

    let tmpConfig = rootConfig;
    const links: React.ReactElement[] = [];
    currentConfigIdChain.forEach((configId: string) => {
      if (tmpConfig.get("id") !== configId) {
        tmpConfig = tmpConfig.get("children").get(configId) as Config;
      }

      links.push(
        <Link color="inherit" onClick={() => console.log("link", configId)}>
          {tmpConfig.get("name")}
        </Link>
      );
    });

    return <Breadcrumbs aria-label="breadcrumb">{links}</Breadcrumbs>;
  }

  public renderAction() {
    const { dispatch } = this.props;
    return (
      <div>
        <IconButton
          aria-label="edit"
          onClick={() => {
            this.setState({ showConfigEditDialog: true });
          }}
        >
          <EditIcon />
        </IconButton>

        <IconButton
          aria-label="edit"
          onClick={() => {
            // TODO duplicate config
          }}
        >
          <FileCopyIcon />
        </IconButton>

        <IconButton
          aria-label="delete"
          onClick={() => {
            // TODO delete config
          }}
        >
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
        onCreate={this.onCreate}
        createButtonText="Add A Config"
      >
        <div className={classes.displayFlex}>
          <div className={classes.leftTree}>
            <FileTree rootConfig={rootConfig} dispatch={dispatch} />
          </div>
          <div className={classes.fileDetail}>
            <div className={classes.breadcrumbsAndAction}>
              {this.renderFileBreadcrumbs()}
              {this.renderAction()}
            </div>

            {currentConfig.get("type") === "file" ? (
              <SyntaxHighlighter>
                {currentConfig.get("content")}
              </SyntaxHighlighter>
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
