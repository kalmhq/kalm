import Box from "@material-ui/core/Box";
import Paper from "@material-ui/core/Paper";
import { Alert } from "@material-ui/lab";
import { RenderGithubConnector } from "forms/SSOConfig/GithubConnector";
import { RenderGitlabConnector } from "forms/SSOConfig/GitlabConnector";
import { ValidatorArrayNotEmpty } from "forms/validator";
import React from "react";
import { FieldArray } from "react-final-form-arrays";
import {
  SSOGithubConnector,
  SSOGitlabConnector,
  SSO_CONNECTOR_TYPE_GITHUB,
  SSO_CONNECTOR_TYPE_GITLAB,
} from "types/sso";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";

export interface Props {}

export const Connectors: React.FC<Props> = () => {
  return (
    <FieldArray<SSOGithubConnector | SSOGitlabConnector>
      validate={ValidatorArrayNotEmpty}
      name="connectors"
      render={({ fields, meta: { error, touched } }) => (
        <>
          <Box mt={2}>
            {fields.value &&
              fields.value.map((connector, index) => {
                let field = `connectors.${index}`;
                let connectorComponent;

                if (connector.type === SSO_CONNECTOR_TYPE_GITHUB) {
                  connectorComponent = (
                    <RenderGithubConnector
                      // @ts-ignore
                      connector={connector}
                      fieldName={field}
                      key={connector.type + "-" + index}
                    />
                  );
                } else if (connector.type === SSO_CONNECTOR_TYPE_GITLAB) {
                  connectorComponent = (
                    <RenderGitlabConnector
                      // @ts-ignore
                      connector={connector}
                      fieldName={field}
                      key={connector.type + "-" + index}
                    />
                  );
                }

                return (
                  <Box mb={2} key={field}>
                    <Paper variant="outlined">
                      {connectorComponent}
                      <Box p={2} display="flex" flexDirection="row-reverse">
                        <DeleteButtonWithConfirmPopover
                          useText
                          popupId="delete-sso-popup"
                          popupTitle="DELETE SSO?"
                          confirmedAction={() => fields.remove(index)}
                        />
                      </Box>
                    </Paper>
                  </Box>
                );
              })}
          </Box>
          {touched && error && typeof error === "string" ? (
            <Box mt={2}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : null}
        </>
      )}
    />
  );
};
