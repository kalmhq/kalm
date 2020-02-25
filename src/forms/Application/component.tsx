import { Box, Button, createStyles, Theme, Typography, withStyles, WithStyles } from "@material-ui/core";
import WarningIcon from "@material-ui/icons/Warning";
import Immutable from "immutable";
import MaterialTable from "material-table";
import React from "react";
import { connect } from "react-redux";
import { WrappedFieldArrayProps } from "redux-form";
import { FieldArray, formValueSelector } from "redux-form/immutable";
import { ApplicationComponent, ComponentTemplate, SharedEnv } from "../../actions";
import { RootState } from "../../reducers";
import { EnvTypeExternal } from "../Basic/env";
import { KappTooltip } from "./KappTooltip";
import AddIcon from "@material-ui/icons/Add";
import { CustomizedDialog } from "./ComponentModal";
import { ComponentLikeForm } from "../ComponentLike";

const mapStateToProps = (state: RootState) => {
  const selector = formValueSelector("application");
  const sharedEnv: Immutable.List<SharedEnv> = selector(state, "sharedEnv");

  return {
    componentTemplates: state.get("componentTemplates").get("componentTemplates"),
    sharedEnv
  };
};

type stateProps = ReturnType<typeof mapStateToProps>;

const styles = (theme: Theme) =>
  createStyles({
    delete: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    inputForm: {
      border: `1px dashed`,
      padding: theme.spacing(3),
      borderRadius: 3
    }
  });

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}
interface Props
  extends WrappedFieldArrayProps<ApplicationComponent>,
    WithStyles<typeof styles>,
    stateProps,
    FieldArrayComponentHackType {}

interface State {
  isDialogOpen: boolean;
}

interface RowData {
  applicationComponent: ApplicationComponent;
  index: number;
}

class RenderComponentsRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isDialogOpen: false
    };
  }

  private isEnvInSharedEnv = (envName: string) => {
    const { sharedEnv } = this.props;
    return !!sharedEnv.find(x => x.get("name") === envName);
  };

  private renderNameColumn = (rowData: RowData) => rowData.applicationComponent.get("name");
  private renderTypeColumn = (rowData: RowData) => rowData.applicationComponent.get("workloadType");
  private renderCpuColumn = (rowData: RowData) => rowData.applicationComponent.get("cpu") || "-";
  private renderMemoryColumn = (rowData: RowData) => rowData.applicationComponent.get("memory") || "-";
  private renderPortsColumn = (rowData: RowData) =>
    rowData.applicationComponent
      .get("ports")
      .map(x => x.get("containerPort"))
      .toArray()
      .join(", ");

  private renderDisksColumn = (rowData: RowData) =>
    rowData.applicationComponent.get("disks").size > 0
      ? rowData.applicationComponent
          .get("disks")
          .map(x => x.get("path"))
          .toArray()
          .join(", ")
      : "-";
  private renderEnvsColumn = (rowData: RowData) => {
    const { applicationComponent } = rowData;
    const externalEnvs = applicationComponent.get("env").filter(x => {
      return x.get("type") === EnvTypeExternal;
    });

    // const staticEnvs = applicationComponent.get("env").filter(x => {
    //   return x.get("type") === EnvTypeStatic;
    // });

    // const linkedEnvs = applicationComponent.get("env").filter(x => {
    //   return x.get("type") === EnvTypeLinked;
    // });

    const missingExternalVariables = externalEnvs.filter(x => {
      return !this.isEnvInSharedEnv(x.get("name"));
    });

    const missingLinkedVariables = externalEnvs.filter(x => {
      return false; //TODO
    });

    const allEnvCount = applicationComponent.get("env").size;
    const missingEnvCount = missingLinkedVariables.size + missingExternalVariables.size;

    const envContent =
      missingEnvCount > 0 ? (
        <KappTooltip
          title={
            <>
              <Typography color="inherit">
                <strong>Missing External Variables</strong>
              </Typography>
              {missingExternalVariables
                .map(x => {
                  return (
                    <div key={x.get("name")}>
                      <em>{x.get("name")}</em>
                    </div>
                  );
                })
                .toArray()}
            </>
          }>
          <Box
            color="warning.main"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            whiteSpace="nowrap">
            <Box mr={1}>{`${allEnvCount - missingEnvCount} / ${allEnvCount}`}</Box>
            <WarningIcon />
          </Box>
        </KappTooltip>
      ) : allEnvCount > 0 ? (
        <Box color="text.primary" display="flex" alignItems="center">
          <Box mr={1}>{`${allEnvCount} / ${allEnvCount}`}</Box>
        </Box>
      ) : (
        "-"
      );

    return envContent;
  };

  private getTableData() {
    const { fields } = this.props;

    const data: RowData[] = [];

    fields.forEach((field, index, fields) => {
      const applicationComponent = fields.get(index);
      // const componentData: componentData = this.getComponentData(applicationComponent, index);

      data.push({
        applicationComponent,
        index
      });
    });

    return data;
  }

  private openComponentFormDialog() {
    this.setState({ isDialogOpen: true });
  }

  private closeComponentFormDialog = () => {
    this.setState({ isDialogOpen: false });
  };

  private saveComponentFormDialog = () => {
    this.setState({ isDialogOpen: false });
  };

  private renderDialog() {
    const { isDialogOpen } = this.state;
    const { fields } = this.props;
    console.log(fields.get(0));
    return (
      <CustomizedDialog
        title="Add Component for Application"
        open={isDialogOpen}
        handleSave={this.saveComponentFormDialog}
        handleClose={this.closeComponentFormDialog}>
        <ComponentLikeForm onSubmit={console.log} initialValues={fields.get(0) as ComponentTemplate} />
      </CustomizedDialog>
    );
  }

  public render() {
    const { fields } = this.props;
    return (
      <div>
        {this.renderDialog()}
        <MaterialTable
          actions={[
            {
              icon: "add_circle",
              iconProps: {
                color: "primary"
              },
              onClick: (...args) => {
                this.openComponentFormDialog();
              },
              isFreeAction: true
            },
            {
              icon: "edit",
              onClick: (...args) => {
                console.log(args);
              }
            }
          ]}
          options={{
            padding: "dense",
            search: false,
            paging: false,
            // toolbar: false,
            actionsColumnIndex: -1,
            addRowPosition: "first"
          }}
          components={{ Container: props => props.children }}
          editable={{
            // onRowAdd: async (...args) => console.log(args),
            // onRowUpdate: async (...args) => console.log(args),
            onRowDelete: async data => fields.remove(data.index)
          }}
          columns={[
            { title: "Name", field: "name", sorting: false, render: this.renderNameColumn },
            { title: "Workload", field: "type", sorting: false, render: this.renderTypeColumn },
            { title: "Cpu", field: "cpu", sorting: false, render: this.renderCpuColumn },
            { title: "Memory", field: "memory", sorting: false, render: this.renderMemoryColumn },
            { title: "Ports", field: "ports", sorting: false, render: this.renderPortsColumn },
            { title: "Disks", field: "disks", sorting: false, render: this.renderDisksColumn },
            { title: "Envs", field: "envs", sorting: false, render: this.renderEnvsColumn }
          ]}
          data={this.getTableData()}
          title=""
        />
        <Box mt={3}>
          <Button variant="outlined" size="small" color="primary" fullWidth startIcon={<AddIcon />} onClick={() => {}}>
            Add Component
          </Button>
        </Box>
      </div>
    );
  }
}

const RenderComponentsWithStyles = withStyles(styles)(RenderComponentsRaw);

let components = (props: stateProps) => {
  return <FieldArray name="components" component={RenderComponentsWithStyles} {...props} />;
};

export const Components = connect(mapStateToProps)(components);
