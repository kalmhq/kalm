import { Paper } from "@material-ui/core";
import MaterialTable, { MaterialTableProps } from "material-table";
import React from "react";

export class KTable<RowData extends object> extends React.PureComponent<MaterialTableProps<RowData>> {
  render() {
    return (
      <MaterialTable
        {...this.props}
        options={Object.assign(
          {
            toolbar: false,
            pageSize: 20,
            draggable: false,
          },
          this.props.options || {},
        )}
        components={Object.assign(
          {
            Container: (props: any) => <Paper {...props} variant="outlined" elevation={0} />,
          },
          this.props.components || {},
        )}
      />
    );
  }
}
