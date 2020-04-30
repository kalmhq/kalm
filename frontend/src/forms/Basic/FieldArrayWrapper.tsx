import { Grid } from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import Immutable from "immutable";
import React from "react";
import { DispatchProp } from "react-redux";
import { WrappedFieldArrayProps } from "redux-form";
import { ButtonWhite } from "../../widgets/Button";
import { IconButtonWithTooltip } from "../../widgets/IconButtonWithTooltip";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
  getFieldComponents: (member: string) => JSX.Element[];
  onAdd?: () => any;
}

interface FieldArrayProps extends DispatchProp {}

interface Props
  extends WrappedFieldArrayProps<Immutable.Map<string, any>>,
    FieldArrayComponentHackType,
    FieldArrayProps {}

export class FieldArrayWrapper extends React.PureComponent<Props> {
  public render() {
    const {
      fields,
      getFieldComponents,
      onAdd,
      meta: { error, submitFailed }
    } = this.props;

    return (
      <div>
        {fields.map((member, index) => {
          const fieldComponents = getFieldComponents(member);

          return (
            <Grid container spacing={3}>
              {fieldComponents.map(fieldComponent => {
                return (
                  <Grid item xs>
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
        <Grid container spacing={3}>
          <Grid item xs>
            <ButtonWhite onClick={() => (onAdd ? onAdd() : fields.push(Immutable.Map({})))}>Add</ButtonWhite>
            {submitFailed && error && <span>{error}</span>}
          </Grid>
        </Grid>
      </div>
    );
  }
}
