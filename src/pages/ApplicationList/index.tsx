import {
  createStyles,
  IconButton,
  Theme,
  WithStyles,
  withStyles
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { push } from "connected-react-router";
import MaterialTable from "material-table";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "../../actions";
import { deleteApplicationAction } from "../../actions/application";
import { RootState } from "../../reducers";
import { BasePage } from "../BasePage";

const mapStateToProps = (state: RootState) => {
  return {
    applications: state
      .get("applications")
      .get("applications")
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

class List extends React.PureComponent<Props> {
  public onCreate = () => {
    this.props.dispatch(push(`/applications/new`));
  };

  public render() {
    const { dispatch, applications, classes } = this.props;
    const data = applications.map(application => {
      return {
        action: (
          <>
            <IconButton
              aria-label="edit"
              onClick={() => {
                dispatch(push(`/applications/${application.get("id")}/edit`));
              }}
            >
              <EditIcon />
            </IconButton>

            <IconButton
              aria-label="edit"
              onClick={() => {
                dispatch(
                  push(`/applications/${application.get("id")}/duplicate`)
                );
              }}
            >
              <FileCopyIcon />
            </IconButton>

            <IconButton
              aria-label="delete"
              onClick={() => {
                // TODO delete confirmation
                dispatch(deleteApplicationAction(application.get("id")));
              }}
            >
              <DeleteIcon />
            </IconButton>
          </>
        ),
        name: application.get("name"),
        components: application
          .get("components")
          .map(x => x.get("name"))
          .toArray()
      };
    });
    return (
      <BasePage
        title="Applications"
        onCreate={this.onCreate}
        createButtonText="Add An Application"
      >
        <div className={classes.root}>
          <MaterialTable
            options={{
              padding: "dense"
            }}
            columns={[
              { title: "Name", field: "name", sorting: false },
              { title: "Components", field: "components", sorting: false },
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
        </div>
      </BasePage>
    );
  }
}

export default withStyles(styles)(connect(mapStateToProps)(List));
