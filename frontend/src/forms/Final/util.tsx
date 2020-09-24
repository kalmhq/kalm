import { FormSpy } from "react-final-form";
import { ComponentLike } from "types/componentTemplate";
import React from "react";
import { Box } from "@material-ui/core";

export const FormDataPreview = () => {
  return process.env.REACT_APP_DEBUG === "true" ? (
    <Box mt={2} mb={2}>
      <FormSpy subscription={{ values: true }}>
        {({ values }: { values: ComponentLike }) => {
          return <pre style={{ maxWidth: 1500, background: "#eee" }}>{JSON.stringify(values, undefined, 2)}</pre>;
        }}
      </FormSpy>
    </Box>
  ) : null;
};
