import React, { ComponentType } from "react";
import TextField, { FilledTextFieldProps } from "@material-ui/core/TextField";
import {
  Field,
  WrappedFieldProps,
  BaseFieldProps,
  FieldArray,
  BaseFieldArrayProps,
  WrappedFieldArrayProps
} from "redux-form";
import DeleteIcon from "@material-ui/icons/Delete";
import { renderTextField, RenderSelectField, RenderAutoComplete } from ".";
import { Grid, Button, IconButton, MenuItem, Divider } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { ValidatorRequired } from "../validator";

export const DiskTypeNew = "new";
export const DiskTypeExisting = "existing";

type DiskType = typeof DiskTypeNew | typeof DiskTypeExisting;

export interface DiskValue {
  name: string;
  type: DiskType;
  path: string;
  existDisk?: string;
  size?: string;
  storageClass?: string;
}

const generateDisk = (type: DiskType): DiskValue => ({
  name: "",
  type,
  path: "",
  existDisk: "",
  size: "",
  storageClass: ""
});

const renderDisks = ({
  fields,
  meta: { error, submitFailed }
}: WrappedFieldArrayProps<DiskValue>) => {
  const classes = makeStyles(theme => ({
    delete: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    firstButton: {
      margin: "0 16px 0 0"
    },
    divider: {
      marginBottom: theme.spacing(3)
    }
  }))();

  return (
    <div>
      <div>{submitFailed && error && <span>{error}</span>}</div>
      {fields.map((field, index, fields) => {
        // const fields.get
        const disk = fields.get(index);
        const isNewDisk = disk.type === DiskTypeNew;

        return (
          <div key={index}>
            <Field type="hidden" name={`${field}.type`} component="input" />

            <Grid container spacing={2} className={classes.divider}>
              <Grid item xs={10}>
                <Grid container spacing={2}>
                  {isNewDisk ? (
                    <>
                      <Grid item xs={6}>
                        <Field
                          name={`${field}.name`}
                          validate={isNewDisk ? ValidatorRequired : []}
                          component={renderTextField}
                          label="Name"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Field
                          name={`${field}.storageClass`}
                          validate={isNewDisk ? ValidatorRequired : []}
                          component={RenderSelectField}
                          label="StorageClass"
                        >
                          <MenuItem value="static">Static</MenuItem>
                          <MenuItem value="external">External</MenuItem>
                        </Field>
                      </Grid>
                    </>
                  ) : (
                    <Grid item xs={12}>
                      <Field
                        name={`${field}.existDisk`}
                        component={RenderAutoComplete}
                        validate={!isNewDisk ? ValidatorRequired : []}
                        label="ExistDisk"
                      >
                        <option value={"1"}>PVC/random-name-disk-1 (1G)</option>
                        <option value={"2"}>
                          PVC/fake-disk-placeholder (1G)
                        </option>
                        <option value={"3"}>
                          PVC/test-disk-placeholder (3G)
                        </option>
                        <option value={"4"}>
                          PVC/foo-disk-placeholder (1G)
                        </option>
                        <option value={"5"}>PVC/hello-world (8G)</option>
                      </Field>
                    </Grid>
                  )}

                  <Grid item xs={isNewDisk ? 6 : 12}>
                    <Field
                      name={`${field}.path`}
                      component={renderTextField}
                      validate={ValidatorRequired}
                      label="Path"
                    />
                  </Grid>
                  {isNewDisk ? (
                    <Grid item xs={6}>
                      <Field
                        name={`${field}.size`}
                        component={renderTextField}
                        validate={isNewDisk ? ValidatorRequired : []}
                        type="number"
                        label="Size (Megabeta, M)"
                      ></Field>
                    </Grid>
                  ) : null}
                </Grid>
              </Grid>
              <Grid item xs={2} className={classes.delete}>
                <IconButton
                  aria-label="delete"
                  onClick={() => fields.remove(index)}
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
            {index !== fields.length - 1 ? (
              <Divider classes={{ root: classes.divider }} />
            ) : null}
          </div>
        );
      })}
      <Button
        size="small"
        variant="outlined"
        color="primary"
        onClick={() => fields.push(generateDisk(DiskTypeNew))}
        classes={{ root: classes.firstButton }}
      >
        Mount New Disk
      </Button>
      <Button
        size="small"
        variant="outlined"
        color="primary"
        onClick={() => fields.push(generateDisk(DiskTypeExisting))}
      >
        Attach existing disk
      </Button>
    </div>
  );
};

export const renderDisk = ({
  label,
  input,
  placeholder,
  helperText,
  meta: { touched, invalid, error },
  ...custom
}: FilledTextFieldProps & WrappedFieldProps & Props) => (
  <TextField
    label={label}
    error={touched && invalid}
    helperText={(touched && error) || helperText}
    placeholder={placeholder}
    fullWidth
    margin="normal"
    variant="filled"
    {...input}
    {...custom}
  />
);

interface Props {
  label?: string;
  helperText?: string;
  placeholder?: string;
}

export const CustomDisks = (props: WrappedFieldArrayProps<DiskValue> | {}) => {
  return (
    <div>
      <FieldArray {...props} name="disk" valid={true} component={renderDisks} />
    </div>
  );
};
