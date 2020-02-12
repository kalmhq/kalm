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
import { Actions } from "../../actions";
import { Link } from "react-router-dom";
import FileTree from "../../widgets/FileTree";

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
  const queryParams = new URLSearchParams(ownProps.location.search);
  const parentId = queryParams.get("parentId") || "";
  // console.log("parentId", parentId);
  return {
    configs: state
      .get("configs")
      .get("configs")
      .toList()
      .filter(config => config.parentId === parentId)
      .toArray()
  };
};

type StateProps = ReturnType<typeof mapStateToProps>;

interface Props extends StateProps {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
  classes: any;
}

class List extends React.PureComponent<Props> {
  public render() {
    const { dispatch, configs, classes } = this.props;
    const data = configs.map((config: any) => {
      return {
        action: (
          <>
            <IconButton
              aria-label="edit"
              onClick={() => {
                dispatch(push(`/configs/${config.id}/edit`));
              }}
            >
              <EditIcon />
            </IconButton>

            <IconButton
              aria-label="edit"
              onClick={() => {
                dispatch(push(`/configs/${config.id}/duplicate`));
              }}
            >
              <FileCopyIcon />
            </IconButton>

            <IconButton
              aria-label="delete"
              onClick={() => {
                dispatch(deleteConfigAction(config.id));
              }}
            >
              <DeleteIcon />
            </IconButton>
          </>
        ),
        name: (
          <span>
            <Icon className={classes.fileIcon}>
              {config.type === "folder" ? "folder" : "insert_drive_file"}
            </Icon>
            {config.type === "folder" ? (
              <Link
                className={classes.fileName}
                to={`/configs?parentId=${config.id}`}
              >
                {config.name}
              </Link>
            ) : (
              <span className={classes.fileName}>{config.name}</span>
            )}
          </span>
        ),
        type: config.type,
        value: config.value
      };
    });
    return (
      <BasePage title="Configs">
        <div className={classes.displayFlex}>
          <div className={classes.leftTree}>
            <FileTree />
          </div>
          <div className={classes.fileDetail}>file detail</div>
        </div>
      </BasePage>
    );
  }
}

export default connect(mapStateToProps)(withStyles(styles)(List));
