export default {};
// import { Box, createStyles, WithStyles, withStyles } from "@material-ui/core";
// import { Theme } from "@material-ui/core/styles";
// import { Alert } from "@material-ui/lab";
// import { shouldError } from "forms/common";
// import Immutable from "immutable";
// import React from "react";
// import { connect, DispatchProp } from "react-redux";
// import { RootState } from "reducers";
// import { InjectedFormProps } from "redux-form";
// import { Field, formValueSelector, reduxForm } from "redux-form/immutable";
// import { theme } from "theme/theme";
// import { formValidateOrNotBlockByTutorial } from "tutorials/utils";
// import { Application } from "types/application";
// import stringConstants from "utils/stringConstants";
// import { CustomizedButton } from "widgets/Button";
// import { KPanel } from "widgets/KPanel";
// import { Body } from "widgets/Label";
// import { KRenderDebounceTextField } from "../Basic/textfield";
// import { APPLICATION_FORM_ID } from "../formIDs";
// import { ValidatorName, ValidatorRequired } from "../validator";

// const styles = (theme: Theme) =>
//   createStyles({
//     root: {
//       padding: 20,
//     },
//     displayNone: {
//       display: "none",
//     },
//     displayFlex: {
//       display: "flex",
//     },
//     buttons: {
//       margin: "20px 0 0",
//     },
//     submitButton: {
//       marginRight: theme.spacing(4),
//     },
//   });

// const mapStateToProps = (state: RootState) => {
//   const selector = formValueSelector(APPLICATION_FORM_ID);
//   const name = selector(state, "name") as string;
//   return {
//     tutorialState: state.get("tutorial"),
//     isSubmittingApplication: state.get("applications").get("isSubmittingApplication"),
//     name,
//   };
// };

// interface OwnProps {
//   isEdit?: boolean;
//   currentTab: "basic" | "applicationPlugins";
// }

// interface ConnectedProps extends ReturnType<typeof mapStateToProps>, DispatchProp {}

// export interface Props
//   extends ConnectedProps,
//     InjectedFormProps<Application, ConnectedProps & OwnProps>,
//     WithStyles<typeof styles>,
//     OwnProps {}

// const nameValidators = [ValidatorRequired, ValidatorName];

// class ApplicationFormRaw extends React.PureComponent<Props> {
//   private renderBasic() {
//     const { isEdit, name } = this.props;
//     return (
//       <>
//         <Field
//           name="name"
//           label="App Name"
//           disabled={isEdit}
//           component={KRenderDebounceTextField}
//           autoFocus={true}
//           validate={nameValidators}
//           helperText={isEdit ? "Can't modify name" : stringConstants.NAME_RULE}
//         />

//         <Box mt={2} style={{ color: theme.palette.text.secondary }}>
//           <Body>The App Name becomes part of the DNS name for its resources:</Body>
//           <Box p={1}>
//             <code id="application-name-code">
//               {"<COMPONENT_NAME>"}.<strong style={{ color: theme.palette.text.primary }}>{name || "<APP_NAME>"}</strong>
//               .svc.cluster.local
//             </code>
//           </Box>
//         </Box>
//       </>
//     );
//   }

//   private renderButtons() {
//     const { handleSubmit, classes, currentTab, isSubmittingApplication } = this.props;

//     return (
//       <>
//         <CustomizedButton
//           pending={isSubmittingApplication}
//           disabled={isSubmittingApplication}
//           tutorial-anchor-id="application-form-submit-button"
//           variant="contained"
//           color="primary"
//           className={`${currentTab === "basic" ? classes.submitButton : classes.displayNone}`}
//           onClick={(event: any) => {
//             handleSubmit(event);
//           }}
//           id="add-application-submit-button"
//         >
//           Create App
//         </CustomizedButton>
//       </>
//     );
//   }

//   public render() {
//     const { handleSubmit, classes, submitFailed, error } = this.props;

//     return (
//       <form onSubmit={handleSubmit} className={classes.root} tutorial-anchor-id="application-form">
//         <KPanel
//           content={
//             <Box p={2} tutorial-anchor-id="application-form-name-field">
//               {this.renderBasic()}
//             </Box>
//           }
//         />

//         {error && submitFailed ? (
//           <Box pt={2}>
//             <Alert severity="error">{error}</Alert>
//           </Box>
//         ) : null}

//         <Box pt={3} className={classes.displayFlex}>
//           {this.renderButtons()}
//         </Box>
//       </form>
//     );
//   }
// }

// export const applicationInitialValues: Application = Immutable.fromJS({
//   name: "",
//   components: [],
// });

// export default connect(mapStateToProps)(
//   reduxForm<Application, ConnectedProps & OwnProps>({
//     form: APPLICATION_FORM_ID,
//     initialValues: applicationInitialValues,
//     validate: formValidateOrNotBlockByTutorial,
//     shouldError: shouldError,
//     onSubmitFail: (...args) => {
//       console.log("submit failed", args);
//     },
//   })(withStyles(styles)(ApplicationFormRaw)),
// );
