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
  withStyles
} from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { push } from "connected-react-router";
import { deleteConfigAction } from "../../actions/config";
import { ThunkDispatch } from "redux-thunk";
import { Actions, ConfigFormValues } from "../../actions";
import { Link } from "react-router-dom";
import { FileTree } from "../../widgets/FileTree";
import { getCurrentConfig } from "../../selectors/config";

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
  }
});

const mapStateToProps = (state: RootState, ownProps: any) => {
  return {
    currentConfig: getCurrentConfig(),
    rootConfig: state.get("configs").get("rootConfig")
  };
};

type StateProps = ReturnType<typeof mapStateToProps>;

interface Props extends StateProps {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
  classes: any;
  rootConfig: ConfigFormValues;
}

class List extends React.PureComponent<Props> {
  public onCreate = () => {
    this.props.dispatch(push(`/configs/new`));
  };

  public render() {
    const { dispatch, rootConfig, classes, currentConfig } = this.props;

    return (
      <BasePage title="Configs" onCreate={this.onCreate}>
        <div className={classes.displayFlex}>
          <div className={classes.leftTree}>
            <FileTree rootConfig={rootConfig} dispatch={dispatch} />
          </div>
          <div className={classes.fileDetail}>
            {currentConfig.get("type") === "file"
              ? currentConfig.get("content")
              : "No selected file"}
          </div>
        </div>
      </BasePage>
    );
  }
}

export default connect(mapStateToProps)(withStyles(styles)(List));
