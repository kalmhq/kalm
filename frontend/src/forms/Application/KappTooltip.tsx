import { Theme, Tooltip, withStyles, TooltipProps } from "@material-ui/core";
import React from "react";

interface Props extends TooltipProps {}

const HtmlTooltip = withStyles((theme: Theme) => ({
  tooltip: {
    backgroundColor: "#f5f5f9",
    color: "rgba(0, 0, 0, 0.87)",
    maxWidth: 220,
    fontSize: theme.typography.pxToRem(12),
    border: "1px solid #dadde9",
  },
}))(Tooltip);

export class KappTooltip extends React.PureComponent<Props> {
  public render() {
    return (
      <div>
        <HtmlTooltip {...this.props}>
          <div>{this.props.children}</div>
        </HtmlTooltip>
      </div>
    );
  }
}
