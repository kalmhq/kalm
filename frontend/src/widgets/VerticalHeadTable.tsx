import { Table, TableContainer, TableBody, TableRow, TableCell } from "@material-ui/core";
import React from "react";

export interface VerticalHeadTableItem {
  name: string | React.ReactNode;
  content: React.ReactNode;
}

interface Props {
  items: VerticalHeadTableItem[];
}

export class VerticalHeadTable extends React.PureComponent<Props> {
  render() {
    const { items } = this.props;
    return (
      <TableContainer>
        <Table aria-label="table" size="small">
          <TableBody>
            {items.map((item, index) => {
              return (
                <TableRow key={index}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.content}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
}
