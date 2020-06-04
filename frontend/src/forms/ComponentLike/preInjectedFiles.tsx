import { Button, Icon, Box } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { arrayPush, WrappedFieldArrayProps } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { PreInjectedFile } from "../../types/componentTemplate";
import { DeleteIcon } from "../../widgets/Icon";
import { IconButtonWithTooltip } from "../../widgets/IconButtonWithTooltip";
import { RenderSelectField } from "../Basic/select";
import { KRenderTextField } from "../Basic/textfield";
import { ValidatorRequired } from "../validator";

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
          // const injectedFile = fields.get(index);
          return (
            <Grid container spacing={1}>
              <Grid item md={2}>
                <Field
                  name={`${member}.readonly`}
                  component={RenderSelectField}
                  label="Mode"
                  validate={[ValidatorRequired]}
                  options={[
                    { value: "true", text: "Read Only" },
                    { value: "false", text: "Read & Write" }
                  ]}></Field>
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
