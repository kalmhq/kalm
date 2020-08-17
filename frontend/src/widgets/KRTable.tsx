import Paper from "@material-ui/core/Paper";
import MuiTable from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TablePagination from "@material-ui/core/TablePagination";
import TableRow from "@material-ui/core/TableRow";
import React, { useCallback } from "react";
import { usePagination, useTable } from "react-table";

interface RowData {
  [key: string]: any;
}

const DefaultPageSize = 20;

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
    prepareRow,
    rows,
    // Instead of using 'rows', we'll use page,
    page,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable<RowData>(
    {
      columns: columnsMemo,
      data: dataMemo,
      initialState: { pageIndex: 0, pageSize: DefaultPageSize },
    },
    usePagination,
  );

  // https://codesandbox.io/s/github/ggascoigne/react-table-example?file=/src/Table/TablePagination.tsx
  const handleChangePage = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, newPage: number) => {
      if (newPage === pageIndex + 1) {
        nextPage();
      } else if (newPage === pageIndex - 1) {
        previousPage();
      } else {
        gotoPage(newPage);
      }
    },
    [gotoPage, nextPage, pageIndex, previousPage],
  );

  const onChangeRowsPerPage = useCallback(
    (e) => {
      setPageSize(Number(e.target.value));
    },
    [setPageSize],
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
          {page.map((row, i) => {
            prepareRow(row);
            return (
              <TableRow {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return (
                    <TableCell
                      {...cell.getCellProps()}
                      style={rows.length <= DefaultPageSize && i === rows.length - 1 ? { borderBottom: "none" } : {}}
                    >
                      {cell.render("Cell")}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </MuiTable>
      {rows.length > DefaultPageSize ? (
        <TablePagination
          rowsPerPageOptions={[5, 10, 20, 50]}
          component="div"
          count={rows.length}
          rowsPerPage={pageSize}
          page={pageIndex}
          onChangePage={handleChangePage}
          onChangeRowsPerPage={onChangeRowsPerPage}
        />
      ) : null}
    </TableContainer>
  );
};
