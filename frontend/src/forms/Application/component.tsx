import { Box, Button, createStyles, Grid, Theme, Typography, withStyles, WithStyles } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import WarningIcon from "@material-ui/icons/Warning";
import Immutable from "immutable";
import MaterialTable from "material-table";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { submit, WrappedFieldArrayProps, change, arrayPush } from "redux-form";
import { FieldArray, formValueSelector } from "redux-form/immutable";
import { RootState } from "../../reducers";
import { ComponentLikeForm } from "../ComponentLike";
import { CustomizedDialog } from "./ComponentModal";
import { KappTooltip } from "./KappTooltip";
import { ApplicationComponent, SharedEnv } from "../../types/application";
import { ComponentLike, newEmptyComponentLike } from "../../types/componentTemplate";
import { EnvTypeExternal } from "../../types/common";

const mapStateToProps = (state: RootState) => {
  const selector = formValueSelector("application");
  const sharedEnv: Immutable.List<SharedEnv> = selector(state, "sharedEnvs");

  return {
    componentTemplates: state.get("componentTemplates").get("componentTemplates"),
    sharedEnv
  };
};

interface stateProps extends ReturnType<typeof mapStateToProps>, DispatchProp {}

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
  dialogFormApplicationComponentIndex?: number;
  dialogFormComponentLikeInstance?: ComponentLike;
  dialogFormTitle?: string;
  dialogFormSaveButtonText?: string;
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
    rowData.applicationComponent.get("ports")
      ? rowData.applicationComponent
          .get("ports")!
          .map(x => x.get("containerPort"))
          .toArray()
          .join(", ")
      : "-";

  private renderDisksColumn = (rowData: RowData) =>
    rowData.applicationComponent.get("disks") && rowData.applicationComponent.get("disks")!.size > 0
      ? rowData.applicationComponent
          .get("disks")!
          .map(x => x.get("path"))
          .toArray()
          .join(", ")
      : "-";

  private renderPluginsColumn = (rowData: RowData) => {
    return rowData.applicationComponent.get("plugins")
      ? Array.from(
          new Set(
            rowData.applicationComponent
              .get("plugins")!
              .map(x => x.get("name"))
              .toArray()
          )
        ).join(",")
      : "-";
  };

  private renderEnvsColumn = (rowData: RowData) => {
    const { applicationComponent } = rowData;
    const externalEnvs = applicationComponent.get("env")
      ? applicationComponent.get("env")!.filter(x => {
          return x.get("type") === EnvTypeExternal;
        })
      : Immutable.List([]);

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

    const allEnvCount = applicationComponent.get("env") ? applicationComponent.get("env")!.size : 0;
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

  private openComponentFormDialog(dialogFormApplicationComponentIndex: number) {
    const { fields } = this.props;
    let dialogFormComponentLikeInstance: ComponentLike;
    let title;
    let saveButtonText = "";
    if (dialogFormApplicationComponentIndex === -1) {
      title = "New Component";
      saveButtonText = "Save";
      dialogFormComponentLikeInstance = newEmptyComponentLike();
    } else {
      title = "Edit Component";
      saveButtonText = "Save";
      dialogFormComponentLikeInstance = fields.get(dialogFormApplicationComponentIndex) as ComponentLike;
    }

    this.setState({
      isDialogOpen: true,
      dialogFormComponentLikeInstance,
      dialogFormApplicationComponentIndex,
      dialogFormSaveButtonText: saveButtonText,
      dialogFormTitle: title
    });
  }

  private closeComponentFormDialog = () => {
    this.setState({
      isDialogOpen: false,
      dialogFormComponentLikeInstance: undefined,
      dialogFormApplicationComponentIndex: undefined,
      dialogFormSaveButtonText: undefined,
      dialogFormTitle: undefined
    });
  };

  private saveComponentFormDialog = () => {
    this.props.dispatch(submit("componentLike"));
  };

  private handleComponentLikeFormSubmit = async (componentLike: ComponentLike) => {
    const { dialogFormApplicationComponentIndex } = this.state;
    const { meta, fields } = this.props;
    if (dialogFormApplicationComponentIndex === undefined) {
      return;
    }
    // console.log(meta.form, fields.name, componentLike);
    if (dialogFormApplicationComponentIndex === -1) {
      await this.props.dispatch(arrayPush(meta.form, fields.name, componentLike));
    } else {
      await this.props.dispatch(
        change(meta.form, `${fields.name}[${dialogFormApplicationComponentIndex}]`, componentLike)
      );
    }

    this.closeComponentFormDialog();
    this.forceUpdate();
  };

  private renderDialog() {
    const { isDialogOpen, dialogFormComponentLikeInstance, dialogFormSaveButtonText, dialogFormTitle } = this.state;
    // const { fields } = this.props;
    return (
      <CustomizedDialog
        title={dialogFormTitle}
        open={isDialogOpen}
        handleClose={this.closeComponentFormDialog}
        actions={
          <>
            {/* <Button onClick={this.closeComponentFormDialog} color="default" variant="contained">
              Cancel
            </Button> */}
            <Button onClick={this.saveComponentFormDialog} color="primary" variant="contained">
              {dialogFormSaveButtonText}
            </Button>
          </>
        }>
        <ComponentLikeForm
          isFolded={true}
          onSubmit={this.handleComponentLikeFormSubmit}
          initialValues={dialogFormComponentLikeInstance}
          showDataView
        />
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
                this.openComponentFormDialog(-1);
              },
              isFreeAction: true
            },
            {
              icon: "edit",
              onClick: (_event, data) => {
                this.openComponentFormDialog((data as RowData).index);
              }
            }
          ]}
          options={{
            search: false,
            paging: false,
            // toolbar: false,
            actionsColumnIndex: -1,
            addRowPosition: "first",
            draggable: false
          }}
          components={{ Container: props => props.children }}
          editable={{
            onRowDelete: async data => fields.remove(data.index)
          }}
          columns={[
            { title: "Name", field: "name", sorting: false, render: this.renderNameColumn },
            { title: "Workload", field: "type", sorting: false, render: this.renderTypeColumn },
            { title: "Cpu", field: "cpu", sorting: false, render: this.renderCpuColumn },
            { title: "Memory", field: "memory", sorting: false, render: this.renderMemoryColumn },
            { title: "Ports", field: "ports", sorting: false, render: this.renderPortsColumn },
            { title: "Disks", field: "disks", sorting: false, render: this.renderDisksColumn },
            { title: "Plugins", field: "plugins", sorting: false, render: this.renderPluginsColumn },
            { title: "Envs", field: "envs", sorting: false, render: this.renderEnvsColumn }
          ]}
          data={this.getTableData()}
          title=""
        />
        <Box mt={3}></Box>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button
              variant="outlined"
              size="small"
              color="primary"
              fullWidth
              startIcon={<AddIcon />}
              onClick={() => this.openComponentFormDialog(-1)}>
              Add Component
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              variant="outlined"
              size="small"
              color="primary"
              fullWidth
              startIcon={<AddIcon />}
              onClick={() => {}}>
              Import from Component Template
            </Button>
          </Grid>
        </Grid>
      </div>
    );
  }
}

const RenderComponentsWithStyles = withStyles(styles)(RenderComponentsRaw);

let components = (props: stateProps) => {
  return <FieldArray name="components" component={RenderComponentsWithStyles} {...props} />;
};

export const Components = connect(mapStateToProps)(components);
