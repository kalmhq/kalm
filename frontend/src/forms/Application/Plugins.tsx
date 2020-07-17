import { Grid, MenuItem, TextField } from "@material-ui/core";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { WrappedFieldArrayProps } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { closeDialogAction, openDialogAction } from "actions/dialog";
import { RootState } from "reducers";
import { getApplicationFormPluginName } from "../../selectors/component";
import { ApplicationPlugin } from "types/application";
import { PluginType } from "types/plugin";
import { ButtonWhite, CustomizedButton } from "widgets/Button";
import { ControlledDialog } from "widgets/ControlledDialog";
import { DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { H5 } from "widgets/Label";
import { CheckboxField } from "../Basic/checkbox";
import { NormalizeBoolean } from "../normalizer";
import { RenderJsonSchemaForm } from "../Basic/jsonSchemaForm";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

const mapStateToProps = (state: RootState) => {
  // const applicationPlugins = state.get("applications").get("applicationPlugins");
  const applicationPlugins = [] as ApplicationPlugin[];

  const applicationPluginsMap: { [key: string]: ApplicationPlugin } = {};
  applicationPlugins.forEach((plugin) => {
    applicationPluginsMap[plugin.name] = plugin;
  });

  return {
    applicationPlugins,
    applicationPluginsMap,
  };
};

interface FieldArrayProps extends DispatchProp, ReturnType<typeof mapStateToProps> {}

interface Props
  extends WrappedFieldArrayProps<PluginType>,
    FieldArrayComponentHackType,
    FieldArrayProps,
    ReturnType<typeof mapStateToProps> {}

interface State {
  selectApplicationPluginName: string;
}

const selectApplicationPluginDialogId = "select-component-plugin-dialog-id";

class RenderPlugins extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      selectApplicationPluginName: "",
    };
  }

  private renderSelectApplicationPluginDialog() {
    const { applicationPlugins, fields } = this.props;

    const existPluginNames: { [key: string]: boolean } = {};
    fields.forEach((member, index) => {
      const pluginName = getApplicationFormPluginName(member);
      existPluginNames[pluginName] = true;
    });

    return (
      <ControlledDialog
        dialogID={selectApplicationPluginDialogId}
        title={"Add Application Plugin"}
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
                    name: this.state.selectApplicationPluginName,
                    isActive: false,
                    config: {},
                  }),
                );

                this.props.dispatch(closeDialogAction(selectApplicationPluginDialogId));
              }}
              color="default"
              variant="contained"
            >
              Add Plugin
            </CustomizedButton>
            {/* <CustomizedButton
              onClick={() => this.props.dispatch(closeDialogAction(selectApplicationPluginDialogId))}
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
          value={this.state.selectApplicationPluginName}
          onChange={(event) => {
            this.setState({ selectApplicationPluginName: event.target.value });
          }}
          // helperText="Please select your plugin"
          variant="outlined"
        >
          {applicationPlugins.map((option) => (
            <MenuItem key={option.name} value={option.name} disabled={!!existPluginNames[option.name]}>
              {option.name}
            </MenuItem>
          ))}
        </TextField>
      </ControlledDialog>
    );
  }

  private renderBasic(member: string, index: number) {
    const { applicationPluginsMap, fields } = this.props;
    const pluginName = getApplicationFormPluginName(member);
    const schema =
      applicationPluginsMap[pluginName] && applicationPluginsMap[pluginName].configSchema
        ? applicationPluginsMap[pluginName].configSchema
        : {};

    return (
      <React.Fragment key={member}>
        <Grid container spacing={2}>
          <Grid item md={12}>
            <div style={{ display: "flex", alignItems: "center", padding: "8px 0" }}>
              <H5>{pluginName}</H5>

              <IconButtonWithTooltip
                tooltipPlacement="top"
                tooltipTitle="Delete"
                size="small"
                aria-label="delete"
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
      <div>
        {fields.map((member, index) => {
          return this.renderBasic(member, index);
        })}
        <Grid container spacing={3} style={{ marginTop: 0 }}>
          <Grid item xs>
            {this.renderSelectApplicationPluginDialog()}
            <ButtonWhite
              onClick={() => {
                dispatch(openDialogAction(selectApplicationPluginDialogId));
                this.setState({ selectApplicationPluginName: "" });
              }}
            >
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
