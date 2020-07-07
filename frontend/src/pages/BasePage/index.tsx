import { createStyles, withStyles, WithStyles } from "@material-ui/styles";
import { Theme } from "pretty-format/build/types";
import React from "react";
import { SecondHeader } from "../../layout/SecondHeader";
import { Box, Container } from "@material-ui/core";

const styles = (_theme: Theme) =>
  createStyles({
    root: {},
  });

export interface BasePageProps extends React.Props<any>, WithStyles<typeof styles> {
  noScrollContainer?: boolean;
  leftDrawer?: React.ReactNode;
  secondHeaderLeft?: React.ReactNode;
  secondHeaderRight?: React.ReactNode;
  fullContainer?: boolean;
}

export class BasePageRaw extends React.PureComponent<BasePageProps> {
  public render() {
    const { children, leftDrawer, secondHeaderLeft, secondHeaderRight, fullContainer } = this.props;
    return (
      <Box display="flex" flexDirection="column">
        <SecondHeader left={secondHeaderLeft} right={secondHeaderRight} />
        <Box flex="1" display="flex">
          {leftDrawer}
          <Box flex="1">
            {/* <div className={classes.rightSection}> */}
            {/*{noScrollContainer ? children : <ScrollContainer>{children}</ScrollContainer>}*/}
            <Container maxWidth={fullContainer ? false : "lg"} disableGutters style={{ margin: 0 }}>
              {children}
            </Container>
          </Box>
        </Box>
      </Box>
    );
  }
}

export const BasePage = withStyles(styles)(BasePageRaw);
