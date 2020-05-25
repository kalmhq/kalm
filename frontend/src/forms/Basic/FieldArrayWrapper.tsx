import { Button, Grid } from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import Immutable from "immutable";
import React from "react";
import { WrappedFieldArrayProps } from "redux-form";
import { IconButtonWithTooltip } from "../../widgets/IconButtonWithTooltip";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
  getFieldComponents: (member: string) => JSX.Element[];
  onAdd?: () => any;
}

interface FieldArrayProps {}

interface Props
  extends WrappedFieldArrayProps<Immutable.Map<string, any>>,
    FieldArrayComponentHackType,
    FieldArrayProps {}

export class FieldArrayWrapper extends React.PureComponent<Props> {
  public render() {
    const {
      fields,
      getFieldComponents,
      onAdd
      // meta: { error, submitFailed }
    } = this.props;

    return (
      <div style={{ width: "100%", position: "relative" }}>
        <Button
          color="primary"
          size="large"
          style={{ position: "absolute", right: 0, top: fields.length === 0 ? -22 : -10 }}
          onClick={() => (onAdd ? onAdd() : fields.push(Immutable.Map({})))}>
          Add
        </Button>
        {fields.map((member, index) => {
          const fieldComponents = getFieldComponents(member);

          return (
            <Grid container spacing={3} key={member}>
              {fieldComponents.map((fieldComponent, fieldIndex) => {
                return (
                  <Grid item xs key={fieldIndex}>
                    {fieldComponent}
                  </Grid>
                );
              })}

              <Grid item xs style={{ paddingTop: 22 }}>
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
        <Grid container spacing={3} style={{ marginTop: 0, marginBottom: 10 }}>
          {/* <Grid item xs>
            <ButtonWhite onClick={() => (onAdd ? onAdd() : fields.push(Immutable.Map({})))}>Add</ButtonWhite>
            {submitFailed && error && <span>{error}</span>}
          </Grid> */}
        </Grid>
      </div>
    );
  }
}
