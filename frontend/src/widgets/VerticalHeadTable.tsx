import { Table, TableContainer, TableBody, TableRow, TableCell } from "@material-ui/core";
import React from "react";

export interface VerticalHeadTableItem {
  name: string;
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
            {items.map((item) => {
              return (
                <TableRow key={item.name}>
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
