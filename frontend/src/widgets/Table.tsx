import { Paper } from "@material-ui/core";
import MaterialTable, { MaterialTableProps } from "material-table";
import React from "react";

// TODO remove this KTable and use KRTable
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
            Container: (props: any) => (
              <Paper
                {...props}
                variant="outlined"
                square
                elevation={0}
                style={{ borderBottom: this.props.options?.paging ? undefined : 0 }}
              />
            ),
          },
          this.props.components || {},
        )}
      />
    );
  }
}
