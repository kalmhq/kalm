import { Theme, Tooltip, TooltipProps, withStyles } from "@material-ui/core";
import React from "react";
import { Caption } from "widgets/Label";

interface Props extends TooltipProps {}

const HtmlTooltip = withStyles((theme: Theme) => ({
  tooltip: {},
}))(Tooltip);

export class KTooltip extends React.PureComponent<Props> {
  public render() {
    const { title, ...otherProps } = this.props;

    return (
      <HtmlTooltip title={typeof title === "string" ? <Caption>{title}</Caption> : title} {...otherProps}>
        {this.props.children}
      </HtmlTooltip>
    );
  }
}
