import React from "react";
import { BasePage } from "../BasePage";
import MaterialTable from "material-table";
import { connect, DispatchProp } from "react-redux";
import { RootState } from "../../reducers";
import { IconButton } from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { push } from "connected-react-router";

const mapStateToProps = (state: RootState) => {
  return {
    components: state.components
      .get("components")
      .toList()
      .toArray()
  };
};

type StateProps = ReturnType<typeof mapStateToProps>;

class List extends React.PureComponent<StateProps & DispatchProp> {
  public render() {
    const data = this.props.components.map(component => {
      return {
        action: (
          <>
            <IconButton
              aria-label="edit"
              onClick={() => {
                this.props.dispatch(push(`/components/${component.id}/edit`));
              }}
            >
              <EditIcon />
            </IconButton>

            <IconButton
              aria-label="edit"
              onClick={() => {
                this.props.dispatch(
                  push(`/components/${component.id}/duplicate`)
                );
              }}
            >
              <FileCopyIcon />
            </IconButton>

            <IconButton aria-label="delete" onClick={() => {}}>
              <DeleteIcon />
            </IconButton>
          </>
        ),
        name: component.name,
        image: component.image,
        cpu: component.cpu,
        memory: component.memory
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
            { title: "Image", field: "image", sorting: false },
            { title: "CPU", field: "cpu", searchable: false },
            { title: "Memory", field: "memory", searchable: false },
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

export const ComponentList = connect(mapStateToProps)(List);
