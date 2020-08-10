import React from "react";
import MuiTable from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import { useTable } from "react-table";

export const KRTable = ({ columns, data }: { columns: any[]; data: any[] }) => {
  const columnsMemo = React.useMemo(
    () =>
      [
        {
          Header: "First Name",
          accessor: "firstName",
        },
        {
          Header: "Last Name",
          accessor: "lastName",
        },
        {
          Header: "Age",
          accessor: "age",
        },
      ] as any[],
    [],
  );

  const dataMemo = React.useMemo(
    () => [
      {
        firstName: "aaa frist",
        lastName: (
          <div
            onClick={() => {
              alert("ok");
            }}
          >
            aaaa
          </div>
        ),
        age: 10,
      },
    ],
    [],
  );

  const { getTableProps, headerGroups, rows, prepareRow } = useTable({
    columns: columnsMemo,
    data: dataMemo,
  });

  return (
    <MuiTable {...getTableProps()}>
      <TableHead>
        {headerGroups.map((headerGroup) => (
          <TableRow {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <TableCell {...column.getHeaderProps()}>{column.render("Header")}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableHead>
      <TableBody>
        {rows.map((row, i) => {
          prepareRow(row);
          return (
            <TableRow {...row.getRowProps()}>
              {row.cells.map((cell) => {
                return <TableCell {...cell.getCellProps()}>{cell.render("Cell")}</TableCell>;
              })}
            </TableRow>
          );
        })}
      </TableBody>
    </MuiTable>
  );
};
