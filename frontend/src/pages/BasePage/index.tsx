import { createStyles, withStyles, WithStyles } from "@material-ui/styles";
import { Theme } from "pretty-format/build/types";
import React from "react";
import { DashboardDrawer } from "../../layout/DashboardDrawer";
import { SecondHeader } from "../../layout/SecondHeader";
import ScrollContainer from "../../widgets/ScrollContainer";

export const LEFT_SECTION_WIDTH = 320;

const styles = (_theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      height: "100%",
      overflow: "hidden",
      background: "white"
    },
    rightSection: {
      display: "flex",
      flexDirection: "column",
      height: "100%",
      flexGrow: 1,
      overflow: "hidden"
    },
    content: {
      flex: 1,
      overflow: "hidden"
    }
  });

export interface BasePageProps extends React.Props<any>, WithStyles<typeof styles> {
  noScrollContainer?: boolean;
  leftDrawer?: React.ReactNode;
  secondHeaderLeft?: React.ReactNode;
  secondHeaderRight?: React.ReactNode;
}

export class BasePageRaw extends React.PureComponent<BasePageProps> {
  public render() {
    const { classes, children, noScrollContainer, leftDrawer, secondHeaderLeft, secondHeaderRight } = this.props;
    return (
      <div className={classes.root}>
        <SecondHeader left={secondHeaderLeft} right={secondHeaderRight} />
        {leftDrawer || <DashboardDrawer />}
        <div className={classes.rightSection}>
          {/* <PageHeader title={title} noBreadcrumb={noBreadcrumb} rightAction={rightAction}></PageHeader> */}
          <div className={classes.content}>
            {noScrollContainer ? children : <ScrollContainer>{children}</ScrollContainer>}
          </div>
        </div>
      </div>
    );
  }
}

export const BasePage = withStyles(styles)(BasePageRaw);
