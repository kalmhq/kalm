import { Box, Button, Icon, TextField } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import EditIcon from "@material-ui/icons/Edit";
import { closeDialogAction, openDialogAction } from "actions/dialog";
import { KBoolCheckboxRender } from "forms/Basic/checkbox";
import Immutable from "immutable";
import { formatBytes } from "permission/utils";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { arrayPush, arrayRemove, change, WrappedFieldArrayProps, WrappedFieldProps } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { ControlledDialog } from "widgets/ControlledDialog";
import { PreInjectedFile } from "types/componentTemplate";
import { DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { KRenderDebounceTextField } from "../Basic/textfield";
import { KValidatorInjectedFilePath, ValidatorRequired } from "../validator";
import { Alert } from "@material-ui/lab";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
  validate: any;
}

interface State {
  editingFileIndex: number;
  fileContentValue: string;
}

interface FieldArrayProps extends DispatchProp {}

interface Props extends WrappedFieldArrayProps<PreInjectedFile>, FieldArrayComponentHackType, FieldArrayProps {}

const updateContentDialogID = "update-content-dialog";
const validateMountPath = [ValidatorRequired, KValidatorInjectedFilePath];

class RenderPreInjectedFile extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      editingFileIndex: -1,
      fileContentValue: "",
    };
  }

  private privateOpenEditDialog = (file: PreInjectedFile, index: number) => {
    const {
      dispatch,
      // meta: { form }
    } = this.props;
    this.setState({ editingFileIndex: index, fileContentValue: file.get("content") });
    dispatch(openDialogAction(updateContentDialogID));
  };

  private renderEditContentDialog = () => {
    const {
      dispatch,
      fields,
      meta: { form },
    } = this.props;
    const file = fields.get(this.state.editingFileIndex);
    return (
      <ControlledDialog
        dialogID={updateContentDialogID}
        title="Edit file content"
        dialogProps={{
          fullWidth: true,
          maxWidth: "sm",
        }}
        actions={
          <>
            <Button
              onClick={() => {
                dispatch(
                  change(
                    form,
                    "preInjectedFiles[" + this.state.editingFileIndex + "]",
                    file.set("content", this.state.fileContentValue),
                  ),
                );
                dispatch(closeDialogAction(updateContentDialogID));
              }}
              color="default"
              variant="contained"
            >
              OK
            </Button>
            <Button
              onClick={() => dispatch(closeDialogAction(updateContentDialogID))}
              color="default"
              variant="contained"
            >
              Close
            </Button>
          </>
        }
      >
        {file ? (
          <TextField
            multiline
            onChange={(event) => this.setState({ fileContentValue: event.target.value })}
            variant="outlined"
            fullWidth
            rows={20}
            value={this.state.fileContentValue}
          ></TextField>
        ) : null}
      </ControlledDialog>
    );
  };

  private renderContent = ({
    meta: { touched, invalid, error },
    file,
    index,
  }: WrappedFieldProps & { file: PreInjectedFile; index: number }) => {
    if (file.get("content") === "") {
      return (
        <Box color={touched && invalid ? "error.main" : undefined}>
          <Button
            variant={touched && invalid ? "outlined" : "text"}
            style={{ padding: 12, width: "100%" }}
            onClick={() => this.privateOpenEditDialog(file, index)}
            color="inherit"
          >
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
      meta: { form, error },
      fields,
      dispatch,
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
                    mountPath: "",
                  }),
                ),
              )
            }
          >
            Add
          </Button>
          {error ? (
            <Box mb={2}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : null}
        </Box>
        {fields.map((member, index) => {
          const injectedFile = fields.get(index);

          return (
            <Grid container spacing={1} key={member}>
              <Grid item lg={5}>
                <Field
                  name={`${member}.mountPath`}
                  label="Mount Path"
                  component={KRenderDebounceTextField}
                  margin
                  validate={validateMountPath}
                />
              </Grid>
              <Grid item lg={2}>
                <Field name={`${member}.readonly`} component={KBoolCheckboxRender} label="Read Only"></Field>
              </Grid>
              <Grid item lg={3}>
                <Field
                  name={`${member}.content`}
                  component={this.renderContent}
                  file={injectedFile}
                  validate={ValidatorRequired}
                  index={index}
                />
              </Grid>
              <Grid item lg={2}>
                <IconButtonWithTooltip
                  tooltipPlacement="top"
                  tooltipTitle="Edit"
                  aria-label="edit"
                  onClick={() => this.privateOpenEditDialog(injectedFile, index)}
                >
                  <EditIcon />
                </IconButtonWithTooltip>
                <IconButtonWithTooltip
                  tooltipPlacement="top"
                  tooltipTitle="Delete"
                  aria-label="delete"
                  onClick={() => dispatch(arrayRemove(form, "preInjectedFiles", index))}
                >
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

const ValidatorInjectedFiles = (
  values: Immutable.List<PreInjectedFile>,
  _allValues?: any,
  _props?: any,
  _name?: any,
) => {
  if (!values) return undefined;
  const mountPaths = new Set<string>();

  for (let i = 0; i < values.size; i++) {
    const path = values.get(i)!;
    const mountPath = path.get("mountPath");

    if (!mountPaths.has(mountPath)) {
      mountPaths.add(mountPath);
    } else if (mountPath !== "") {
      return "Files paths should be unique.  " + mountPath + "";
    }
  }
};

export const PreInjectedFiles = connect()((props: FieldArrayProps) => {
  return (
    <FieldArray
      name="preInjectedFiles"
      component={RenderPreInjectedFile}
      validate={ValidatorInjectedFiles}
      {...props}
    />
  );
});
