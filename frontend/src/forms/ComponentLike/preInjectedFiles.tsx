import React from "react";
import { connect, DispatchProp } from "react-redux";
import { Field, FieldArray } from "redux-form/immutable";
import { Button, Icon, MenuItem } from "@material-ui/core";
import { KRenderTextField } from "../Basic/textfield";
import { ValidatorRequired } from "../validator";
import { RenderSelectField } from "../Basic/select";
import { PreInjectedFile } from "../../types/componentTemplate";
import { arrayPush, WrappedFieldArrayProps } from "redux-form";
import Grid from "@material-ui/core/Grid";
import { DeleteIcon } from "../../widgets/Icon";
import { IconButtonWithTooltip } from "../../widgets/IconButtonWithTooltip";
import Immutable from "immutable";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface FieldArrayProps extends DispatchProp {}

interface Props extends WrappedFieldArrayProps<PreInjectedFile>, FieldArrayComponentHackType, FieldArrayProps {}

class RenderPreInjectedFile extends React.PureComponent<Props> {
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

  public render() {
    const {
      meta: { form },
      fields,
      dispatch
    } = this.props;

    return (
      <>
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
        {fields.map((member, index) => {
          // const injectedFile = fields.get(index);
          return (
            <Grid container spacing={1}>
              <Grid item md={2}>
                <Field
                  name={`${member}.readonly`}
                  component={RenderSelectField}
                  label="Mode"
                  validate={[ValidatorRequired]}>
                  <MenuItem value={"true"}>Read Only</MenuItem>
                  <MenuItem value={"false"}>Read & Write</MenuItem>
                </Field>
              </Grid>
              <Grid item md={3}>
                <Field
                  name={`${member}.mountPath`}
                  label="Mount Path"
                  component={KRenderTextField}
                  margin
                  validate={[ValidatorRequired]}
                />
              </Grid>
              <Grid item md={3}>
                <Field
                  name={`${member}.content`}
                  label="File Content"
                  component={KRenderTextField}
                  margin
                  validate={[ValidatorRequired]}
                />
              </Grid>
              <Grid item md={3}>
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
