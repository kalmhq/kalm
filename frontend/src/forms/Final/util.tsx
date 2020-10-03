import { FormSpy } from "react-final-form";
import React from "react";
import { Box } from "@material-ui/core";
import { CodeBlock } from "widgets/CodeBlock";

export const FormDataPreview = () => {
  return process.env.REACT_APP_DEBUG === "true" ? (
    <Box mt={2} mb={2}>
      <FormSpy subscription={{ values: true }}>
        {({ values }: { values: any }) => {
          return <CodeBlock>{JSON.stringify(values, undefined, 2)}</CodeBlock>;
        }}
      </FormSpy>
    </Box>
  ) : null;
};
