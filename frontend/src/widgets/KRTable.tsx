import { Box, Grid, TextField } from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import MuiTable from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TablePagination from "@material-ui/core/TablePagination";
import TableRow from "@material-ui/core/TableRow";
import React, { useCallback } from "react";
import { useAsyncDebounce, useGlobalFilter, usePagination, useTable } from "react-table";
import { FilterListIcon } from "./Icon";
import { CardTitle } from "./Label";

interface RowData {
  [key: string]: any;
}

const DefaultPageSize = 20;

export const KRTable = ({
  showTitle,
  title,
  columns,
  data,
  noOutline,
}: {
  showTitle?: boolean;
  title?: string;
  columns: { Header: any; accessor: any; Cell?: any }[];
  noOutline?: boolean;
  data: any[];
}) => {
  // https://reactjs.org/docs/hooks-faq.html#is-it-safe-to-omit-functions-from-the-list-of-dependencies
  const columnsMemo = React.useMemo(() => {
    return columns;
  }, [columns]);

  const dataMemo = React.useMemo(() => {
    return data;
  }, [data]);

  const filterTypes = React.useMemo(
    () => ({
      kFilter: kFilter,
    }),
    [],
  );

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
    preGlobalFilteredRows,
    setGlobalFilter,
    state: { pageIndex, pageSize, globalFilter },
  } = useTable<RowData>(
    {
      columns: columnsMemo,
      data: dataMemo,
      filterTypes,
      globalFilter: "kFilter",
      initialState: { pageIndex: 0, pageSize: DefaultPageSize },
      autoResetPage: false,
    },
    useGlobalFilter,
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
    <Paper elevation={0} style={noOutline ? { border: "none", width: "100%", padding: 20 } : {}}>
      {showTitle ? (
        <Grid container spacing={noOutline ? 0 : 2}>
          <Grid item md={9}>
            <Box display="flex" alignItems="center" padding="8px 16px">
              <CardTitle>{title || ""}</CardTitle>
            </Box>
          </Grid>
          <Grid item md={3}>
            <GlobalFilter
              preGlobalFilteredRows={preGlobalFilteredRows}
              globalFilter={globalFilter}
              setGlobalFilter={setGlobalFilter}
            />
          </Grid>
        </Grid>
      ) : null}
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
          {page.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length}>No Data</TableCell>
            </TableRow>
          )}
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
    </Paper>
  );
};

// https://codesandbox.io/s/github/tannerlinsley/react-table/tree/master/examples/filtering?file=/src/App.js
const GlobalFilter = ({ preGlobalFilteredRows, globalFilter, setGlobalFilter }: any) => {
  const [value, setValue] = React.useState(globalFilter);

  if (!globalFilter && value) {
    setGlobalFilter(value);
  }

  const onChange = useAsyncDebounce((value) => {
    setGlobalFilter(value || undefined);
  }, 200);

  return (
    <Box display="flex" alignItems="center" justifyContent="flex-end" padding="8px 16px">
      <TextField
        label=""
        value={value || ""}
        onChange={(e) => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder="Filter"
      />
      <FilterListIcon />
    </Box>
  );
};

const kFilter = (rows: any[], ids: any[], filterValue: string) => {
  return rows.filter((row) => {
    if (!filterValue) {
      return true;
    }

    for (let id of ids) {
      const cellValue = row.values[id];

      if (cellIncludes(cellValue, filterValue)) {
        return true;
      }
    }

    return false;
  });
};

const cellIncludes = (cellValue: any, filterValue: string): boolean => {
  if (!cellValue) {
    return false;
  }

  if (typeof cellValue === "string") {
    if (String(cellValue).toLowerCase().includes(String(filterValue).toLowerCase())) {
      return true;
    }
  }

  if (Array.isArray(cellValue)) {
    for (let child of cellValue) {
      if (cellIncludes(child, filterValue)) {
        return true;
      }
    }
  }

  if (typeof cellValue === "object") {
    if (cellValue.props) {
      if (cellValue.props.children) {
        if (typeof cellValue.props.children === "string") {
          if (cellIncludes(cellValue.props.children, filterValue)) {
            return true;
          }
        }

        if (Array.isArray(cellValue.props.children)) {
          for (let child of cellValue.props.children) {
            if (cellIncludes(child, filterValue)) {
              return true;
            }
          }
        }

        if (typeof cellValue.props.children === "object") {
          if (cellIncludes(cellValue.props.children, filterValue)) {
            return true;
          }
        }
      } else {
        for (let key in cellValue.props) {
          if (typeof cellValue.props[key] === "string") {
            if (cellIncludes(cellValue.props[key], filterValue)) {
              return true;
            }
          } else if (typeof cellValue.props[key] === "object") {
            if (cellIncludes(JSON.stringify(cellValue.props[key]), filterValue)) {
              return true;
            }
          }
        }
      }
    }
  }

  return false;
};
