import React from "react";
import { PageHeader, PageHeaderProps } from "../../widgets/PageHeader";
import ScrollContainer from "../../widgets/ScrollContainer";
import { withStyles, createStyles, WithStyles } from "@material-ui/styles";
import { Theme } from "pretty-format/build/types";

const styles = (_theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flexDirection: "column",
      // height: "100%",
      overflow: "hidden"
    },
    content: {
      flex: 1,
      overflow: "hidden"
    }
  });

export interface BasePageProps
  extends React.Props<any>,
    WithStyles<typeof styles>,
    Pick<PageHeaderProps, "title" | "noBreadcrumb" | "rightAction"> {
  noScrollContainer?: boolean;
}

export class BasePageRaw extends React.PureComponent<BasePageProps> {
  public render() {
    const { classes, children, title, rightAction, noBreadcrumb, noScrollContainer } = this.props;
    return (
      <div className={classes.root}>
        <PageHeader title={title} noBreadcrumb={noBreadcrumb} rightAction={rightAction}></PageHeader>
        <div className={classes.content}>
          {noScrollContainer ? children : <ScrollContainer>{children}</ScrollContainer>}
        </div>
      </div>
    );
  }
}

export const BasePage = withStyles(styles)(BasePageRaw);
