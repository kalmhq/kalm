import { Button, Grid, MenuItem, TextField } from "@material-ui/core";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { WrappedFieldArrayProps } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { closeDialogAction, openDialogAction } from "actions/dialog";
import { RootState } from "reducers";
import { getComponentFormPluginName } from "selectors/component";
import { ComponentPlugin } from "types/application";
import { PluginType } from "types/plugin";
import { CustomizedButton } from "widgets/Button";
import { ControlledDialog } from "widgets/ControlledDialog";
import { DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { Body } from "widgets/Label";
import { CheckboxField } from "../Basic/checkbox";
import { RenderJsonSchemaForm } from "../Basic/jsonSchemaForm";
import { NormalizeBoolean } from "../normalizer";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

const mapStateToProps = (state: RootState) => {
  const componentPlugins = state.get("components").get("componentPlugins");

  const componentPluginsMap: { [key: string]: ComponentPlugin } = {};
  componentPlugins.forEach((plugin) => {
    componentPluginsMap[plugin.name] = plugin;
  });

  return {
    componentPlugins,
    componentPluginsMap,
  };
};

interface FieldArrayProps extends DispatchProp, ReturnType<typeof mapStateToProps> {}

interface Props
  extends WrappedFieldArrayProps<PluginType>,
    FieldArrayComponentHackType,
    FieldArrayProps,
    ReturnType<typeof mapStateToProps> {}

interface State {
  selectComponentPluginName: string;
}

const selectComponentPluginDialogId = "select-component-plugin-dialog-id";

class RenderPlugins extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      selectComponentPluginName: "",
    };
  }

  private renderSelectComponentPluginDialog() {
    const { componentPlugins, fields } = this.props;

    const existPluginNames: { [key: string]: boolean } = {};
    fields.forEach((member, index) => {
      const pluginName = getComponentFormPluginName(member);
      existPluginNames[pluginName] = true;
    });

    return (
      <ControlledDialog
        dialogID={selectComponentPluginDialogId}
        title={"Add Component Plugin"}
        dialogProps={{
          fullWidth: true,
          maxWidth: "sm",
        }}
        actions={
          <>
            <CustomizedButton
              onClick={() => {
                fields.push(
                  Immutable.fromJS({
                    name: this.state.selectComponentPluginName,
                    isActive: false,
                    config: {},
                  }),
                );

                this.props.dispatch(closeDialogAction(selectComponentPluginDialogId));
              }}
              color="default"
              variant="contained"
            >
              Add Plugin
            </CustomizedButton>
            {/* <CustomizedButton
              onClick={() => this.props.dispatch(closeDialogAction(selectComponentPluginDialogId))}
              color="default"
              variant="contained">
              Cancel
            </CustomizedButton> */}
          </>
        }
      >
        <TextField
          style={{ width: "100%" }}
          id="outlined-select-plugin"
          select
          label="Select a plugin to add"
          value={this.state.selectComponentPluginName}
          onChange={(event) => {
            this.setState({ selectComponentPluginName: event.target.value });
          }}
          // helperText="Please select your plugin"
          variant="outlined"
        >
          {componentPlugins.map((option) => (
            <MenuItem key={option.name} value={option.name} disabled={!!existPluginNames[option.name]}>
              {option.name}
            </MenuItem>
          ))}
        </TextField>
      </ControlledDialog>
    );
  }

  private renderBasic(member: string, index: number) {
    const { componentPluginsMap, fields } = this.props;
    const pluginName = getComponentFormPluginName(member);
    const schema =
      componentPluginsMap[pluginName] && componentPluginsMap[pluginName].configSchema
        ? componentPluginsMap[pluginName].configSchema
        : {};

    return (
      <React.Fragment key={member}>
        {/* <Grid container spacing={2}>
          <Grid item md={12}>
            <Field component={RenderTextField}
              name={`${member}.name`}
              label="Name"
              disabled={true}
              margin
              validate={[ValidatorRequired]}
            />
          </Grid>
        </Grid> */}
        <Grid container spacing={2}>
          <Grid item md={12}>
            <div style={{ display: "flex", alignItems: "center", padding: "8px 0" }}>
              <Body>{pluginName}</Body>

              <IconButtonWithTooltip
                tooltipPlacement="top"
                tooltipTitle="Delete"
                aria-label="delete"
                size="small"
                onClick={() => fields.remove(index)}
              >
                <DeleteIcon />
              </IconButtonWithTooltip>
            </div>

            <Field
              name={`${member}.isActive`}
              formControlLabelProps={{
                label: "isActive",
              }}
              component={CheckboxField}
              normalizer={NormalizeBoolean}
            />
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item md={12}>
            <Field name={`${member}.config`} component={RenderJsonSchemaForm} schema={schema} />
          </Grid>
        </Grid>
      </React.Fragment>
    );
  }

  public render() {
    const {
      dispatch,
      fields,
      meta: { error, submitFailed },
    } = this.props;

    return (
      <div style={{ width: "100%", position: "relative" }}>
        <Button
          color="primary"
          size="large"
          style={{ position: "absolute", right: 0, top: fields.length === 0 ? -22 : -10 }}
          onClick={() => {
            dispatch(openDialogAction(selectComponentPluginDialogId));
            this.setState({ selectComponentPluginName: "" });
          }}
        >
          Add
        </Button>
        {fields.map((member, index) => {
          return this.renderBasic(member, index);
        })}
        <Grid container spacing={3} style={{ marginTop: 0 }}>
          <Grid item xs>
            {this.renderSelectComponentPluginDialog()}
            {/* <ButtonWhite
              onClick={() => {
                dispatch(openDialogAction(selectComponentPluginDialogId));
                this.setState({ selectComponentPluginName: "" });
              }}>
              Add
            </ButtonWhite> */}
            {submitFailed && error && <span>{error}</span>}
          </Grid>
        </Grid>
      </div>
    );
  }
}

export const Plugins = connect(mapStateToProps)((props: FieldArrayProps) => {
  return <FieldArray name="plugins" component={RenderPlugins} {...props} />;
});
