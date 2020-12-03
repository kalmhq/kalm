import { Box } from "@material-ui/core";
import React from "react";
import { FormSpy } from "react-final-form";
import { CodeBlock } from "widgets/CodeBlock";

export const FormDataPreview = () => {
  return process.env.REACT_APP_DEBUG === "true" ? (
    <Box mt={2} mb={2}>
      <FormSpy>
        {({ values, errors }) => {
          return (
            <>
              <CodeBlock>{JSON.stringify(values, undefined, 2)}</CodeBlock>
              <CodeBlock>{JSON.stringify(errors, undefined, 2)}</CodeBlock>
            </>
          );
        }}
      </FormSpy>
    </Box>
  ) : null;
};
