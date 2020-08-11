import Paper from "@material-ui/core/Paper";
import MuiTable from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import React from "react";
import { useTable } from "react-table";

export const KRTable = ({
  columns,
  data,
}: {
  columns: { Header: any; accessor: string; Cell?: any }[];
  data: any[];
}) => {
  // https://reactjs.org/docs/hooks-faq.html#is-it-safe-to-omit-functions-from-the-list-of-dependencies
  const columnsMemo = React.useMemo(() => {
    return columns;
  }, [columns]);

  const dataMemo = React.useMemo(() => {
    return data;
  }, [data]);

  const {
    getTableProps,
    headerGroups,
    rows,
    prepareRow,
    // @ts-ignore
    // state: { expanded },
  } = useTable(
    {
      columns: columnsMemo,
      data: dataMemo,
    },
    // useExpanded,
  );

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
