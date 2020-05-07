import { Grid } from "@material-ui/core";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { WrappedFieldArrayProps } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { RootState } from "../../reducers";
import { getComponentPluginName } from "../../selectors/component";
import { ComponentPlugin } from "../../types/application";
import { ComponentLikePort } from "../../types/componentTemplate";
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
    componentPluginsMap
  };
};

interface FieldArrayProps extends DispatchProp, ReturnType<typeof mapStateToProps> {}

interface Props
  extends WrappedFieldArrayProps<ComponentLikePort>,
    FieldArrayComponentHackType,
    FieldArrayProps,
    ReturnType<typeof mapStateToProps> {}

class RenderPlugins extends React.PureComponent<Props> {
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
      fields
      // meta: { error, submitFailed }
    } = this.props;

    return (
      <div>
        {fields.map((member, index) => {
          return this.renderBasic(member);
        })}
      </div>
    );
  }
}

export const Plugins = connect(mapStateToProps)((props: FieldArrayProps) => {
  return <FieldArray name="plugins" component={RenderPlugins} {...props} />;
});
