import { Box, Button, Icon, TextField } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import EditIcon from "@material-ui/icons/Edit";
import { closeDialogAction, openDialogAction } from "actions/dialog";
import { KBoolCheckboxRender } from "forms/Basic/checkbox";
import Immutable from "immutable";
import { formatBytes } from "permission/utils";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { arrayPush, change, WrappedFieldArrayProps, WrappedFieldProps } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { ControlledDialog } from "widgets/ControlledDialog";
import { PreInjectedFile } from "../../types/componentTemplate";
import { DeleteIcon } from "../../widgets/Icon";
import { IconButtonWithTooltip } from "../../widgets/IconButtonWithTooltip";
import { KRenderTextField } from "../Basic/textfield";
import { KValidatorPath, ValidatorRequired } from "../validator";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface State {
  editingFileIndex: number;
  fileContentValue: string;
}

interface FieldArrayProps extends DispatchProp {}

interface Props extends WrappedFieldArrayProps<PreInjectedFile>, FieldArrayComponentHackType, FieldArrayProps {}

const updateContentDialogID = "update-content-dialog";

class RenderPreInjectedFile extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      editingFileIndex: -1,
      fileContentValue: ""
    };
  }

  public getFieldComponents(member: string) {
    return [
      <Field
        name={`${member}.mountPath`}
        label="Mount Path"
        component={KRenderTextField}
        margin
        validate={[ValidatorRequired]}
      />,
      <Field
        name={`${member}.content`}
        label="Content"
        margin
        validate={[ValidatorRequired]}
        component={KRenderTextField}
      />
    ];
  }

  private privateOpenEditDialog = (file: PreInjectedFile, index: number) => {
    const {
      dispatch
      // meta: { form }
    } = this.props;
    this.setState({ editingFileIndex: index, fileContentValue: file.get("content") });
    dispatch(openDialogAction(updateContentDialogID));
  };

  private renderEditContentDialog = () => {
    const {
      dispatch,
      fields,
      meta: { form }
    } = this.props;
    const file = fields.get(this.state.editingFileIndex);
    return (
      <ControlledDialog
        dialogID={updateContentDialogID}
        title="Edit file content"
        dialogProps={{
          fullWidth: true,
          maxWidth: "sm"
        }}
        actions={
          <>
            <Button
              onClick={() => {
                dispatch(
                  change(
                    form,
                    "preInjectedFiles[" + this.state.editingFileIndex + "]",
                    file.set("content", this.state.fileContentValue)
                  )
                );
                dispatch(closeDialogAction(updateContentDialogID));
              }}
              color="default"
              variant="contained">
              OK
            </Button>
            <Button
              onClick={() => dispatch(closeDialogAction(updateContentDialogID))}
              color="default"
              variant="contained">
              Close
            </Button>
          </>
        }>
        {file ? (
          <TextField
            multiline
            onChange={event => this.setState({ fileContentValue: event.target.value })}
            variant="outlined"
            fullWidth
            rows={20}
            value={this.state.fileContentValue}></TextField>
        ) : null}
      </ControlledDialog>
    );
  };

  private renderContent = ({
    meta: { touched, invalid, error },
    file,
    index
  }: WrappedFieldProps & { file: PreInjectedFile; index: number }) => {
    if (file.get("content") === "") {
      return (
        <Box color={touched && invalid ? "error.main" : undefined}>
          <Button
            variant={touched && invalid ? "outlined" : "text"}
            size="small"
            onClick={() => this.privateOpenEditDialog(file, index)}
            color="inherit">
            {touched && invalid ? "Content required" : "Add Content"}
          </Button>
        </Box>
      );
    } else {
      return formatBytes(Buffer.byteLength(file.get("content"), "utf8"));
    }
  };

  public render() {
    const {
      meta: { form },
      fields,
      dispatch
    } = this.props;
    return (
      <>
        {this.renderEditContentDialog()}
        <Box mb={2}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Icon>add</Icon>}
            size="small"
            onClick={() =>
              dispatch(
                arrayPush(
                  form,
                  "preInjectedFiles",
                  Immutable.Map({
                    readonly: true,
                    content: "",
                    mountPath: ""
                  })
                )
              )
            }>
            Add
          </Button>
        </Box>
        {fields.map((member, index) => {
          const injectedFile = fields.get(index);

          return (
            <Grid container spacing={1} alignItems="center">
              <Grid item md={3}>
                <Field
                  name={`${member}.mountPath`}
                  label="Mount Path"
                  component={KRenderTextField}
                  margin
                  validate={[ValidatorRequired, KValidatorPath]}
                />
              </Grid>
              <Grid item md={2}>
                <Field
                  name={`${member}.readonly`}
                  component={KBoolCheckboxRender}
                  label="Read Only"
                  validate={[ValidatorRequired]}></Field>
              </Grid>
              <Grid item md={2}>
                <Field
                  name={`${member}.content`}
                  component={this.renderContent}
                  validate={[ValidatorRequired]}
                  file={injectedFile}
                  index={index}
                />
              </Grid>
              <Grid item md={3}>
                <IconButtonWithTooltip
                  tooltipPlacement="top"
                  tooltipTitle="Edit"
                  aria-label="edit"
                  onClick={() => this.privateOpenEditDialog(injectedFile, index)}>
                  <EditIcon />
                </IconButtonWithTooltip>
                <IconButtonWithTooltip
                  tooltipPlacement="top"
                  tooltipTitle="Delete"
                  aria-label="delete"
                  onClick={() => fields.remove(index)}>
                  <DeleteIcon />
                </IconButtonWithTooltip>
              </Grid>
            </Grid>
          );
        })}
      </>
    );
  }
}

export const PreInjectedFiles = connect()((props: FieldArrayProps) => {
  return <FieldArray name="preInjectedFiles" component={RenderPreInjectedFile} {...props} />;
});
