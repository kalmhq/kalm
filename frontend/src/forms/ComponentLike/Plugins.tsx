import { Grid, MenuItem, TextField } from "@material-ui/core";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { WrappedFieldArrayProps } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { closeDialogAction, openDialogAction } from "../../actions/dialog";
import { RootState } from "../../reducers";
import { getComponentPluginName } from "../../selectors/component";
import { ComponentPlugin } from "../../types/application";
import { PluginType } from "../../types/plugin";
import { ButtonWhite, CustomizedButton } from "../../widgets/Button";
import { ControlledDialog } from "../../widgets/ControlledDialog";
import { CustomTextField } from "../Basic";
import { CheckboxField } from "../Basic/checkbox";
import { NormalizeBoolean } from "../normalizer";
import { ValidatorRequired } from "../validator";
import { RenderPluginConfig } from "./PluginConfig";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

const mapStateToProps = (state: RootState) => {
  const componentPlugins = state.get("applications").get("componentPlugins");

  const componentPluginsMap: { [key: string]: ComponentPlugin } = {};
  componentPlugins.forEach(plugin => {
    componentPluginsMap[plugin.name] = plugin;
  });

  return {
    componentPlugins,
    componentPluginsMap
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
      selectComponentPluginName: ""
    };
  }

  private renderSelectComponentPluginDialog() {
    const { componentPlugins, fields } = this.props;

    const existPluginNames: { [key: string]: boolean } = {};
    fields.forEach((member, index) => {
      const pluginName = getComponentPluginName(member);
      existPluginNames[pluginName] = true;
    });

    return (
      <ControlledDialog
        dialogID={selectComponentPluginDialogId}
        title={"Add Component Plugin"}
        dialogProps={{
          fullWidth: true,
          maxWidth: "sm"
        }}
        actions={
          <>
            <CustomizedButton
              onClick={() => {
                fields.push(
                  Immutable.fromJS({
                    name: this.state.selectComponentPluginName,
                    isActive: false,
                    config: {}
                  })
                );

                this.props.dispatch(closeDialogAction(selectComponentPluginDialogId));
              }}
              color="default"
              variant="contained">
              Add Plugin
            </CustomizedButton>
            <CustomizedButton
              onClick={() => this.props.dispatch(closeDialogAction(selectComponentPluginDialogId))}
              color="default"
              variant="contained">
              Cancel
            </CustomizedButton>
          </>
        }>
        <TextField
          style={{ width: "100%" }}
          id="outlined-select-plugin"
          select
          label="Select a plugin to add"
          value={this.state.selectComponentPluginName}
          onChange={event => {
            this.setState({ selectComponentPluginName: event.target.value });
          }}
          // helperText="Please select your plugin"
          variant="outlined">
          {componentPlugins.map(option => (
            <MenuItem key={option.name} value={option.name} disabled={!!existPluginNames[option.name]}>
              {option.name}
            </MenuItem>
          ))}
        </TextField>
      </ControlledDialog>
    );
  }

  private renderBasic(member: string) {
    const { componentPluginsMap } = this.props;
    const pluginName = getComponentPluginName(member);
    const schema =
      componentPluginsMap[pluginName] && componentPluginsMap[pluginName].configSchema
        ? componentPluginsMap[pluginName].configSchema
        : {};

    return (
      <>
        <Grid container spacing={2}>
          <Grid item md={12}>
            <CustomTextField
              name={`${member}.name`}
              label="Name"
              disabled={true}
              margin
              validate={[ValidatorRequired]}
            />
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item md={12}>
            {/* <BoldBody>{pluginName}</BoldBody> */}

            <Field
              name={`${member}.isActive`}
              formControlLabelProps={{
                label: "isActive"
              }}
              component={CheckboxField}
              normalizer={NormalizeBoolean}
            />
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item md={12}>
            <Field name={`${member}.config`} component={RenderPluginConfig} schema={schema} />
          </Grid>
        </Grid>
      </>
    );
  }

  public render() {
    const {
      dispatch,
      fields,
      meta: { error, submitFailed }
    } = this.props;

    return (
      <div>
        {fields.map((member, index) => {
          return this.renderBasic(member);
        })}
        <Grid container spacing={3} style={{ marginTop: 0 }}>
          <Grid item xs>
            {this.renderSelectComponentPluginDialog()}
            <ButtonWhite
              onClick={() => {
                dispatch(openDialogAction(selectComponentPluginDialogId));
                this.setState({ selectComponentPluginName: "" });
              }}>
              Add Plugin
            </ButtonWhite>
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
