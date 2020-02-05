import React from "react";
import { BasePage } from "../BasePage";
import MaterialTable from "material-table";
import { connect, DispatchProp } from "react-redux";
import { RootState } from "../../reducers";
import { IconButton, Icon } from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { push } from "connected-react-router";
import { deleteConfigAction } from "../../actions/config";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "../../actions";

const mapStateToProps = (state: RootState) => {
  return {
    configs: state.configs
      .get("configs")
      .toList()
      .toArray()
  };
};

type StateProps = ReturnType<typeof mapStateToProps>;

interface Props extends StateProps {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

class List extends React.PureComponent<Props> {
  public render() {
    const { dispatch, configs } = this.props;
    const data = configs.map(config => {
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
            <Icon>
              {config.type === "folder" ? "folder" : "insert_drive_file"}
            </Icon>
            {config.name}
          </span>
        ),
        value: config.value
      };
    });
    return (
      <BasePage title="Components">
        <MaterialTable
          options={{
            padding: "dense"
          }}
          columns={[
            { title: "Name", field: "name", sorting: false },
            { title: "Value", field: "value", sorting: false },
            {
              title: "Action",
              field: "action",
              sorting: false,
              searchable: false
            }
          ]}
          data={data}
          title=""
        />
      </BasePage>
    );
  }
}

export default connect(mapStateToProps)(List);
