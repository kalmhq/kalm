import React from "react";
import { Box, CircularProgress, Divider, TextField, Button } from "@material-ui/core";
import { AcmeServerInfo } from "types/certificate";
import { KPanel } from "./KPanel";
import { Form, withFormik, FormikProps } from "formik";
import DomainStatus from "./DomainStatus";
import { FlexRowItemCenterBox } from "./Box";
import { Body2, Caption } from "./Label";
import copy from "copy-to-clipboard";
import { KLink } from "./Link";
import { connect } from "react-redux";
import { setSuccessNotificationAction } from "actions/notification";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { createAcmeServerAction, deleteAcmeServerAction, loadCertificateAcmeServerAction } from "actions/certificate";
import Immutable from "immutable";
import { DangerButton } from "./Button";

interface KAcmeServerCardProps extends TDispatchProp {
  acmeServer: AcmeServerInfo;
}
const mapStateToProps = (state: RootState) => {
  return {};
};
const KAcmeServerForm = (props: FormikProps<{ acmeDomain: string; nsDomain: string }>) => {
  const { errors, handleChange, handleSubmit, handleBlur, values, touched } = props;
  return (
    <Form onSubmit={handleSubmit}>
      <KPanel title={"Kalm DNS Server"}>
        <Box p={2}>
          <pre>Before add wildcard domain, DNS server needs setup and running first.</pre>
          <Box pt={3} pb={2}>
            <TextField
              key={"acmeDomain"}
              fullWidth
              error={!!errors.acmeDomain && touched.acmeDomain}
              label="Kalm DNS Server Domain"
              variant="outlined"
              size="small"
              name="acmeDomain"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.acmeDomain}
              InputLabelProps={{ shrink: true }}
              placeholder="Please type domain for Kalm DNS Server"
              helperText={errors.acmeDomain && touched.acmeDomain && errors.acmeDomain}
            />
          </Box>
          <Box pt={2} pb={2}>
            <TextField
              key={"nsDomain"}
              fullWidth
              error={!!errors.nsDomain && touched.nsDomain}
              label="Shadow DNS Domain"
              variant="outlined"
              size="small"
              name="nsDomain"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.nsDomain}
              InputLabelProps={{ shrink: true }}
              placeholder="Please type shadow domain for Kalm DNS Server"
              helperText={errors.nsDomain && touched.nsDomain && errors.nsDomain}
            />
          </Box>
        </Box>
      </KPanel>

      <Box pt={2}>
        <Button id="save-acmeServer-button" type="submit" color="primary" variant="contained">
          {"Create DNS Server"}
        </Button>
      </Box>
    </Form>
  );
};

export const KAcmeServerCard = connect(mapStateToProps)((props: KAcmeServerCardProps) => {
  const { acmeServer, dispatch } = props;
  const acmeDomain = acmeServer.get("acmeDomain");
  const userHasSetup = acmeDomain && acmeDomain.length > 0;
  const isReady = acmeServer.get("ready");

  const nsDomain = acmeServer.get("nsDomain");
  const ipForNameServer = acmeServer.get("ipForNameServer");

  const renderServer = () => {
    return (
      <>
        <pre>
          DNS server is{" "}
          {!isReady ? (
            <>
              starting <CircularProgress size={18} />
            </>
          ) : (
            "working."
          )}
        </pre>
        <Box mt={1} mb={1}>
          <Divider />
        </Box>
        <Box mt={1} mb={1}>
          <Body2>Kalm DNS Server Domain</Body2>
        </Box>
        <FlexRowItemCenterBox>
          <DomainStatus domain={acmeDomain} mr={1} nsDomain={nsDomain} />
          {acmeDomain}
        </FlexRowItemCenterBox>
        <Caption>
          Please make sure this domain's a CNAME record to{" "}
          <KLink
            to="#"
            onClick={async () => {
              copy(nsDomain);
              dispatch(setSuccessNotificationAction("Copied successful!"));
            }}
          >
            {nsDomain}
          </KLink>{" "}
          with your dns provider.
        </Caption>
        <Box mt={1} mb={1}></Box>
        <Box mt={1} mb={1}>
          <Body2>Domain NS</Body2>
        </Box>
        <FlexRowItemCenterBox>
          <DomainStatus domain={nsDomain} mr={1} ipAddress={ipForNameServer} />
          {nsDomain}
        </FlexRowItemCenterBox>
        <Caption>
          Please make sure this domain's A record to{" "}
          <KLink
            to="#"
            onClick={async () => {
              copy(ipForNameServer);
              dispatch(setSuccessNotificationAction("Copied successful!"));
            }}
          >
            {ipForNameServer}
          </KLink>{" "}
          with your dns provider.
        </Caption>
        <Box pt={2} pb={2}>
          <DangerButton
            id="delete-acmeServer-button"
            onClick={async () => {
              await dispatch(deleteAcmeServerAction(acmeServer));
              await dispatch(loadCertificateAcmeServerAction());
            }}
          >
            Delete DNS Server
          </DangerButton>
        </Box>
      </>
    );
  };

  return userHasSetup ? (
    <KPanel title={"Kalm DNS Server"}>
      <Box p={2}>{renderServer()}</Box>
    </KPanel>
  ) : null;
});

export const KAcmeServerFormCard = connect(mapStateToProps)((props: KAcmeServerCardProps) => {
  const { acmeServer, dispatch } = props;
  const acmeDomain = acmeServer.get("acmeDomain");
  const userHasSetup = acmeDomain && acmeDomain.length > 0;

  const DNS01Form = withFormik({
    mapPropsToValues: () => {
      return {
        acmeDomain: "",
        nsDomain: "",
      };
    },
    handleSubmit: async (values, bag) => {
      try {
        await dispatch(createAcmeServerAction(Immutable.Map(values)));
        await dispatch(loadCertificateAcmeServerAction());
      } catch (error) {
        console.log(error);
      }
    },
  })(KAcmeServerForm);

  return <Box p={2}>{!userHasSetup && <DNS01Form />}</Box>;
});
