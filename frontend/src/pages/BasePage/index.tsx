import React from "react";
import { PageHeader, PageHeaderProps } from "../../widgets/PageHeader";
import ScrollContainer from "../../widgets/ScrollContainer";
import { withStyles, createStyles, WithStyles } from "@material-ui/styles";
import { Theme } from "pretty-format/build/types";
import { DrawerComponent } from "../../layout/Drawer";

export const LEFT_SECTION_WIDTH = 320;

const styles = (_theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      height: "100%",
      overflow: "hidden"
    },
    rightSection: {
      display: "flex",
      flexDirection: "column",
      height: "100%",
      width: "100%",
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
    Pick<PageHeaderProps, "title" | "noBreadcrumb" | "rightAction" | "leftSection"> {
  noScrollContainer?: boolean;
}

export class BasePageRaw extends React.PureComponent<BasePageProps> {
  public render() {
    const { classes, children, title, rightAction, noBreadcrumb, noScrollContainer, leftSection } = this.props;
    return (
      <div className={classes.root}>
        {leftSection || <DrawerComponent />}
        <div className={classes.rightSection}>
          <PageHeader title={title} noBreadcrumb={noBreadcrumb} rightAction={rightAction}></PageHeader>
          <div className={classes.content}>
            {noScrollContainer ? children : <ScrollContainer>{children}</ScrollContainer>}
          </div>
        </div>
      </div>
    );
  }
}

export const BasePage = withStyles(styles)(BasePageRaw);
