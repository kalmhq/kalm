import { Box, Button, Grid } from "@material-ui/core";
import { deleteAcmeServerAction, setAcmeServerAction } from "actions/certificate";
import { AcmeForm } from "forms/Certificate/acmeForm";
import { BasePage } from "pages/BasePage";
import { default as React, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store";
import { AcmeServerFormType } from "types/certificate";
import { ACMEServer } from "widgets/ACMEServer";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { H6 } from "widgets/Label";

export const ACMEPage: React.FC = () => {
  const dispatch = useDispatch();
  const { acmeServer, initialValues } = useSelector((state: RootState) => {
    const acmeServer = state.certificates.acmeServer;
    const initialValues = acmeServer
      ? {
          acmeDomain: acmeServer.acmeDomain,
          nsDomain: acmeServer.nsDomain,
        }
      : {
          acmeDomain: "",
          nsDomain: "",
        };
    return {
      acmeServer,
      initialValues,
    };
  });

  const [editMode, setEditMode] = useState(false);

  const submit = async (acmeServer: AcmeServerFormType) => {
    try {
      await dispatch(setAcmeServerAction(acmeServer));
      await setEditMode(false);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <BasePage secondHeaderRight={<H6>ACME DNS Server</H6>}>
      <Box p={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={12}>
            {acmeServer && !editMode ? (
              <>
                <ACMEServer />
                <Box mt={2}>
                  <Button color="primary" variant="outlined" size="small" onClick={() => setEditMode(true)}>
                    Edit
                  </Button>
                  <Box ml={2} display="inline">
                    <DeleteButtonWithConfirmPopover
                      useText
                      popupId="delete-ci-popup"
                      popupTitle="DELETE ACME Server?"
                      confirmedAction={() => dispatch(deleteAcmeServerAction())}
                    />
                  </Box>
                </Box>
              </>
            ) : (
              <AcmeForm onSubmit={submit} initial={initialValues} />
            )}
          </Grid>
        </Grid>
      </Box>
    </BasePage>
  );
};
