import Box from "@material-ui/core/Box";
import Paper from "@material-ui/core/Paper";
import { FieldArray } from "formik";
import { RenderGithubConnector } from "forms/SSOConfig/GithubConnector";
import { RenderGitlabConnector } from "forms/SSOConfig/GitlabConnector";
import React from "react";
import {
  SSOGithubConnectorFormType,
  SSOGitlabConnectorFormType,
  SSO_CONNECTOR_TYPE_GITHUB,
  SSO_CONNECTOR_TYPE_GITLAB,
} from "types/sso";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { Alert } from "@material-ui/lab";

export interface Props {
  connectors?: Array<SSOGithubConnectorFormType | SSOGitlabConnectorFormType>;
}

export class Connectors extends React.PureComponent<Props> {
  public render() {
    const { connectors } = this.props;
    console.log("connectors", connectors);
    return (
      <FieldArray
        name="connectors"
        render={(arrayHelpers) => (
          <Box mt={2}>
            {connectors &&
              connectors.map((connector, index) => {
                let field = `connectors.${index}`;
                let connectorComponent;

                if (connector.type === SSO_CONNECTOR_TYPE_GITHUB) {
                  connectorComponent = (
                    <RenderGithubConnector
                      // @ts-ignore
                      connector={connector}
                      field={field}
                      form={arrayHelpers.form}
                      key={connector.type + "-" + index}
                    />
                  );
                } else if (connector.type === SSO_CONNECTOR_TYPE_GITLAB) {
                  connectorComponent = (
                    <RenderGitlabConnector
                      // @ts-ignore
                      connector={connector}
                      field={field}
                      form={arrayHelpers.form}
                      key={connector.type + "-" + index}
                    />
                  );
                }

                return (
                  <Box mb={2} key={field}>
                    <Paper variant="outlined" square>
                      {connectorComponent}
                      <Box p={2} display="flex" flexDirection="row-reverse">
                        <DeleteButtonWithConfirmPopover
                          useText
                          popupId="delete-sso-popup"
                          popupTitle="DELETE SSO?"
                          confirmedAction={() => arrayHelpers.remove(index)}
                        />
                      </Box>
                    </Paper>
                  </Box>
                );
              })}
            {connectors && connectors.length === 0 ? (
              <Box mt={2}>
                <Alert severity="error">{"You should at least configure one connector."}</Alert>
              </Box>
            ) : null}
          </Box>
        )}
      />
    );
  }
}
