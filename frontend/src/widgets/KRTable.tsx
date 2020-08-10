import Paper from "@material-ui/core/Paper";
import MuiTable from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import React from "react";
import { useTable } from "react-table";

export const KRTable = ({ columns, data }: { columns: { Header: string; accessor: string }[]; data: any[] }) => {
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
    <TableContainer component={Paper} variant="outlined" square>
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
                  return (
                    <TableCell {...cell.getCellProps()} style={i === rows.length - 1 ? { borderBottom: "none" } : {}}>
                      {cell.render("Cell")}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
};
