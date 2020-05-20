import { createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import { loadRegistries } from "actions/registries";
import MaterialTable from "material-table";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { RegistryType } from "types/registry";
import { SuccessBadge, ErrorBadge } from "widgets/Badge";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { Link } from "react-router-dom";

const styles = (theme: Theme) => createStyles({});

const mapStateToProps = (state: RootState) => {
  const registriesState = state.get("registries");
  return {
    isFirstLoaded: registriesState.get("isFirstLoaded"),
    isLoading: registriesState.get("isLoading"),
    registries: registriesState.get("registries")
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

interface RowData extends RegistryType {
  index: number;
}

class RegistryListPageRaw extends React.PureComponent<Props, State> {
  componentDidMount() {
    this.props.dispatch(loadRegistries());
  }

  private renderName(row: RowData) {
    return row.get("name");
  }

  private renderHost(row: RowData) {
    return row.get("host");
  }

  private renderUsername(row: RowData) {
    return "******";
  }

  private renderPassword(row: RowData) {
    return "******";
  }

  private renderVerified(row: RowData) {
    if (row.get("authenticationVerified")) {
      return <SuccessBadge />;
    } else {
      return <ErrorBadge />;
    }
  }

  private renderRepositories(row: RowData) {
    return row
      .get("repositories")
      .map(x => x.get("name"))
      .join(",");
  }

  private renderActions(row: RowData) {
    return (
      <>
        <IconButtonWithTooltip tooltipTitle="Shell" color="primary" component={Link} to={`/`}>
          Edit (TODO)
        </IconButtonWithTooltip>
        <IconButtonWithTooltip tooltipTitle="Logs" color="primary" component={Link} to={`/`}>
          Delete (TODO)
        </IconButtonWithTooltip>
      </>
    );
  }

  private getData = () => {
    const { registries } = this.props;
    const data: RowData[] = [];

    registries.forEach((registry, index) => {
      const rowData = registry as RowData;
      rowData.index = index;
      data.push(rowData);
    });

    return data;
  };

  public render() {
    return (
      <MaterialTable
        options={{
          pageSize: 20,
          padding: "dense",
          draggable: false,
          rowStyle: {
            verticalAlign: "baseline"
          },
          headerStyle: {
            color: "black",
            backgroundColor: grey[100],
            fontSize: 12,
            fontWeight: 400,
            height: 20,
            paddingTop: 0,
            paddingBottom: 0
          }
        }}
        columns={[
          {
            title: "Name",
            field: "name",
            sorting: false,
            render: this.renderName
          },
          {
            title: "Host",
            field: "host",
            sorting: false,
            render: this.renderHost
          },
          {
            title: "Username",
            field: "username",
            sorting: false,
            render: this.renderUsername
          },
          {
            title: "Password",
            field: "password",
            sorting: false,
            render: this.renderPassword
          },
          {
            title: "Verified",
            field: "verified",
            sorting: false,
            render: this.renderVerified
          },
          {
            title: "Repositories",
            field: "repositories",
            sorting: false,
            render: this.renderRepositories
          },
          {
            title: "Actions",
            field: "action",
            sorting: false,
            searchable: false,
            render: this.renderActions
          }
        ]}
        // detailPanel={this.renderDetails}
        // onRowClick={(_event, _rowData, togglePanel) => {
        //   togglePanel!();
        //   console.log(_event);
        // }}
        data={this.getData()}
        title=""
      />
    );
  }
}

export const RegistryListPage = withStyles(styles)(connect(mapStateToProps)(RegistryListPageRaw));
