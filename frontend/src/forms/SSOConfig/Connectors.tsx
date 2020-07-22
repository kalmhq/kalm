import React from "react";
import { connect, DispatchProp } from "react-redux";
import { WrappedFieldArrayProps } from "redux-form";
import { FieldArray } from "redux-form/immutable";
import { SSO_CONNECTOR_TYPE_GITHUB, SSO_CONNECTOR_TYPE_GITLAB } from "types/sso";
import Box from "@material-ui/core/Box";
import { RenderGithubConnector } from "forms/SSOConfig/GithubConnector";
import { DangerButton } from "widgets/Button";
import Paper from "@material-ui/core/Paper";
import { RenderGitlabConnector } from "forms/SSOConfig/GitlabConnector";
import Immutable from "immutable";
import { ComponentLikePort } from "types/componentTemplate";
import { Alert } from "@material-ui/lab";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
  validate: any;
}

const ValidatorConnectors = (
  values: Immutable.List<ComponentLikePort>,
  _allValues?: any,
  _props?: any,
  _name?: any,
) => {
  if (!values) return undefined;

  if (values.size === 0) {
    return "You should at least configure one connector.";
  }
};

interface FieldArrayProps extends DispatchProp {}

interface Props extends WrappedFieldArrayProps<any>, FieldArrayComponentHackType, FieldArrayProps {}

class RenderConnectors extends React.PureComponent<Props> {
  public render() {
    const { fields, meta } = this.props;
    const { error } = meta;
    return (
      <Box mt={2}>
        {fields.map((field, index) => {
          const connector = fields.get(index);
          let connectorComponent;

          if (connector.get("type") === SSO_CONNECTOR_TYPE_GITHUB) {
            connectorComponent = (
              <RenderGithubConnector
                connector={connector}
                field={field}
                meta={meta}
                key={connector.get("type") + "-" + index}
              />
            );
          } else if (connector.get("type") === SSO_CONNECTOR_TYPE_GITLAB) {
            connectorComponent = (
              <RenderGitlabConnector
                connector={connector}
                field={field}
                meta={meta}
                key={connector.get("type") + "-" + index}
              />
            );
          }

          return (
            <Box mb={2} key={field}>
              <Paper variant="outlined" square>
                {connectorComponent}
                <Box p={2} display="flex" flexDirection="row-reverse">
                  <DangerButton
                    variant="outlined"
                    style={{ marginRight: 20 }}
                    size="small"
                    onClick={() => fields.remove(index)}
                  >
                    Delete
                  </DangerButton>
                </Box>
              </Paper>
            </Box>
          );
        })}
        {error ? (
          <Box mt={2}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : null}
      </Box>
    );
  }
}

export const Connectors = connect()((props: FieldArrayProps) => {
  return <FieldArray name="connectors" component={RenderConnectors} validate={ValidatorConnectors} {...props} />;
});
