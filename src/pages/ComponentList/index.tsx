import React from "react";
import { BasePage } from "../BasePage";
import MaterialTable from "material-table";
import { connect } from "react-redux";
import { RootState } from "../../reducers";

const mapStateToProps = (state: RootState) => {
  return {
    components: state.components
      .get("components")
      .toList()
      .toArray()
  };
};

type StateProps = ReturnType<typeof mapStateToProps>;

class List extends React.PureComponent<StateProps> {
  public render() {
    const data = this.props.components.map(component => {
      return {
        action: "",
        name: component.name,
        image: component.image
      };
    });
    return (
      <BasePage title="Components">
        <MaterialTable
          columns={[
            { title: "Action", field: "action" },
            { title: "Name", field: "name" },
            { title: "Image", field: "image" }
          ]}
          data={data}
          title="Components"
        />
      </BasePage>
    );
  }
}

export const ComponentList = connect(mapStateToProps)(List);
