import { Box, Fade, Grid } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { change, InjectedFormProps } from "redux-form";
import { Field, formValueSelector, reduxForm } from "redux-form/immutable";
import { RootState } from "../../reducers";
import { ReduxFormMultiTagsFreeSoloAutoComplete } from "../Basic/autoComplete";
import { SwitchField } from "../Basic/switch";
import { NormalizeBoolean } from "../normalizer";
import { ValidatorHosts, ValidatorRequired } from "../validator";
import { PluginCard } from "./card";
import { PluginType, EXTERNAL_ACCESS_PLUGIN_TYPE } from "../../types/plugin";
import { RenderTextField } from "forms/Basic";

interface OwnProps {}

const mapStateToProps = (state: RootState, ownProps: InjectedFormProps<PluginType, OwnProps>) => {
  const selector = formValueSelector(ownProps.form);

  return {
    pluginType: selector(state, "type")
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      width: "100%"
      // backgroundColor: theme.palette.background.paper
    },
    paper: {
      padding: theme.spacing(3),
      marginBottom: theme.spacing(5)
    },
    sectionHeader: {
      fontSize: 24,
      fontWeight: 400,
      marginBottom: 16
    }
  });

export interface Props
  extends InjectedFormProps<PluginType, OwnProps>,
    ReturnType<typeof mapStateToProps>,
    WithStyles<typeof styles>,
    DispatchProp,
    OwnProps {}

class PluginRaw extends React.PureComponent<Props> {
  private renderIngressContent() {
    return (
      <>
        <Box mt={3}>
          <Field name="name" component={RenderTextField} validate={ValidatorRequired} placeholder="Name" />
        </Box>
        <Box mt={3}>
          <Field
            name="hosts"
            component={ReduxFormMultiTagsFreeSoloAutoComplete}
            validate={[ValidatorHosts]}
            placeholder="Hosts"
          />
        </Box>
        <Box mt={3}>
          <Field name="paths" component={ReduxFormMultiTagsFreeSoloAutoComplete} placeholder="Paths" />
        </Box>
        <Box mt={3}>
          <Field
            name="enableHttp"
            component={SwitchField}
            formControlLabelProps={{ label: "Enable Http" }}
            normalize={NormalizeBoolean}
          />
        </Box>
        <Box mt={3}>
          <Field
            name="enableHttps"
            component={SwitchField}
            formControlLabelProps={{ label: "Enable Https" }}
            normalize={NormalizeBoolean}
          />
        </Box>
        <Box mt={3}>
          <Field
            name="autoHttps"
            component={SwitchField}
            formControlLabelProps={{ label: "Auto Https" }}
            normalize={NormalizeBoolean}
          />
        </Box>
        <Box mt={3}>
          <Field
            name="stripPath"
            component={SwitchField}
            formControlLabelProps={{ label: "Strip Path" }}
            normalize={NormalizeBoolean}
          />
        </Box>
        <Box mt={3}>
          <Field
            name="preserveHost"
            component={SwitchField}
            formControlLabelProps={{ label: "Preserve Host" }}
            normalize={NormalizeBoolean}
          />
        </Box>
      </>
    );
  }

  private renderPluginContent() {
    const { pluginType } = this.props;

    if (!pluginType) {
      return null;
    }

    // TODO define plugin name as consts

    switch (pluginType) {
      case EXTERNAL_ACCESS_PLUGIN_TYPE: {
        return this.renderIngressContent();
      }
      default: {
        return <div>Not Implemented</div>;
      }
    }
  }

  private renderSelectPlugins = () => {
    const { dispatch, form, pluginType } = this.props;

    const selectPlugin = (name: string) => {
      dispatch(change(form, "type", name));
    };

    return (
      <>
        <Field name="name" type="hidden" component="input" />

        {!pluginType ? (
          <Fade in={true}>
            <Grid container spacing={2}>
              <Grid item sm={4}>
                <PluginCard
                  title="HTTP Ingress"
                  description="Configure host, url paths for external http/https access."
                  onSelect={() => selectPlugin(EXTERNAL_ACCESS_PLUGIN_TYPE)}
                />
              </Grid>
              <Grid item sm={4}>
                <PluginCard
                  title="Auto scale"
                  description="Auto scale this component based on cpu and memory usages."
                  onSelect={() => selectPlugin("auto-scale")}
                />
              </Grid>
              <Grid item sm={4}>
                <PluginCard
                  title="File Watch"
                  description="React specific actions when the some files are changed."
                  onSelect={() => selectPlugin("file-watch")}
                />
              </Grid>
            </Grid>
          </Fade>
        ) : null}
      </>
    );
  };

  public render() {
    return (
      <div>
        {this.renderSelectPlugins()}
        {this.renderPluginContent()}
      </div>
    );
  }
}

export const PluginForm = reduxForm<PluginType, OwnProps>({
  onSubmitFail: console.log
})(connect(mapStateToProps)(withStyles(styles)(PluginRaw)));
