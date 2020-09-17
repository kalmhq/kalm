import { Box, createStyles, Grid, WithStyles, withStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles";
import { FormikProps, withFormik, Field, Form } from "formik";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { RootState } from "reducers";
import sc from "utils/stringConstants";
import { CustomizedButton } from "widgets/Button";
import { KPanel } from "widgets/KPanel";
import { Prompt } from "widgets/Prompt";
import { KRenderThrottleFormikTextField } from "forms/Basic/textfield";
import { ValidatorRequired } from "../validator";
import { AcmeServerFormType } from "types/certificate";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2),
    },
  });

const mapStateToProps = (state: RootState) => {
  return {
    isSubmittingCreateAcmeServer: state.certificates.isSubmittingCreateAcmeServer,
  };
};

export interface Props {
  onSubmit: any;
  initial: AcmeServerFormType;
}

class AcmeFormRaw extends React.PureComponent<
  Props &
    FormikProps<AcmeServerFormType> &
    ReturnType<typeof mapStateToProps> &
    WithStyles<typeof styles> &
    DispatchProp
> {
  public render() {
    const { classes, dirty, values, isSubmittingCreateAcmeServer, isSubmitting } = this.props;
    // TODO: Fixme
    return (
      <Form className={classes.root} id="acme-form">
        <Prompt when={dirty && !isSubmitting} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
        <KPanel
          content={
            <Box p={2}>
              <Grid container spacing={2}>
                <Grid item md={12}>
                  <Field
                    name="acmeDomain"
                    label="ACME Domain"
                    component={KRenderThrottleFormikTextField}
                    validate={ValidatorRequired}
                    helperText={sc.NAME_RULE}
                    placeholder="Please type the a domain for ACME DNS server"
                  />
                </Grid>
                <Grid item md={12}>
                  <Field
                    name="nsDomain"
                    label="NS Domain"
                    autoComplete="off"
                    component={KRenderThrottleFormikTextField}
                    validate={ValidatorRequired}
                    placeholder="Please type the a domain as ACME Domain's CNAME record"
                  />
                </Grid>
              </Grid>

              {process.env.REACT_APP_DEBUG === "true" ? (
                <pre style={{ maxWidth: 1500, background: "#eee" }}>{JSON.stringify(values, undefined, 2)}</pre>
              ) : null}
            </Box>
          }
        />
        <Box pt={2}>
          <CustomizedButton disabled={isSubmittingCreateAcmeServer} type="submit" color="primary" variant="contained">
            Save
          </CustomizedButton>
        </Box>
      </Form>
    );
  }
}

const connectedForm = connect(mapStateToProps)(withStyles(styles)(AcmeFormRaw));

export const AcmeForm = withFormik<Props, AcmeServerFormType>({
  mapPropsToValues: (props) => {
    return props.initial;
  },
  validate: (values: AcmeServerFormType) => {
    let errors = {};
    return errors;
  },
  handleSubmit: async (formValues, { props: { onSubmit } }) => {
    await onSubmit(formValues);
  },
})(connectedForm);
