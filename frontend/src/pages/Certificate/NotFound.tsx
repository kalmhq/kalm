import { Box } from "@material-ui/core";
import { ResourceNotFound } from "widgets/ResourceNotFound";
import { BasePage } from "pages/BasePage";
import React from "react";

export const CertificateNotFound = () => {
  return (
    <BasePage>
      <Box p={2}>
        <ResourceNotFound
          text="Certificate not found"
          redirect={`/certificates`}
          redirectText="Go back to Certificates List"
        />
      </Box>
    </BasePage>
  );
};
