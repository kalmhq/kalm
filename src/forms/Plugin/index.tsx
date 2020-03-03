import { Box, MenuItem } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { InjectedFormProps } from "redux-form";
import { Field, formValueSelector, reduxForm } from "redux-form/immutable";
import { Plugin } from "../../actions";
import { RootState } from "../../reducers";
import { RenderSelectField } from "../Basic";
import { ReduxFormMultiTagsFreeSoloAutoComplete } from "../Basic/autoComplete";
import { SwitchField } from "../Basic/switch";
import { NormalizeBoolean } from "../normalizer";
import { ValidatorHosts, ValidatorRequired } from "../validator";

interface OwnProps {}

const mapStateToProps = (state: RootState, ownProps: InjectedFormProps<Plugin, OwnProps>) => {
  const selector = formValueSelector(ownProps.form);

  return {
    pluginName: selector(state, "name")
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
  extends InjectedFormProps<Plugin, OwnProps>,
    ReturnType<typeof mapStateToProps>,
    WithStyles<typeof styles>,
    DispatchProp,
    OwnProps {}

class PluginRaw extends React.PureComponent<Props> {
  private renderIngressContent() {
    return (
      <>
        <Box mt={3}>
          <Field name="hosts" component={ReduxFormMultiTagsFreeSoloAutoComplete} validate={[ValidatorHosts]} />
        </Box>
        <Box mt={3}>
          <Field name="paths" component={ReduxFormMultiTagsFreeSoloAutoComplete} validate={ValidatorRequired} />
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
    const { pluginName } = this.props;

    if (!pluginName) {
      return null;
    }

    // TODO define plugin name as consts

    switch (pluginName) {
      case "ingress": {
        return this.renderIngressContent();
      }
      default: {
        return <div>Not Implemented</div>;
      }
    }
  }

  public render() {
    return (
      <div>
        <Field component={RenderSelectField} name="name" label="Plugin">
          <MenuItem value="ingress">Ingress</MenuItem>
          <MenuItem value="auto-scale">Auto scale</MenuItem>
          <MenuItem value="file-watch">File Watch</MenuItem>
        </Field>
        {this.renderPluginContent()}
      </div>
    );
  }
}

export const PluginForm = reduxForm<Plugin, OwnProps>({
  onSubmitFail: console.log
})(connect(mapStateToProps)(withStyles(styles)(PluginRaw)));
