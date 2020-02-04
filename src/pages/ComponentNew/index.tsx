import React from "react";
import { BasePage } from "../BasePage";
import ComponentForm from "../../forms/Component";

export class ComponentNew extends React.PureComponent {
  public render() {
    return (
      <BasePage title="New Component">
        <ComponentForm
          onSubmit={values => {
            console.log(values, JSON.stringify(values));
          }}
        />
      </BasePage>
    );
  }
}
