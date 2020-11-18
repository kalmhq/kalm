import { Box, createStyles, Grid, Theme, WithStyles, withStyles } from "@material-ui/core";
import React from "react";
import { TDispatchProp } from "types";
import { KPanel } from "widgets/KPanel";
import { BasePage } from "pages/BasePage";
import { Loading } from "../../widgets/Loading";
import { RootState } from "reducers";
import { connect } from "react-redux";
import { Body } from "widgets/Label";
import { getHasTenant } from "selectors/tenant";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  const auth = state.auth;
  const currentTenant = auth.tenant;
  const isLoading = auth.isLoading;
  const hasTenant = getHasTenant(state);
  return {
    isLoading,
    currentTenant,
    hasTenant,
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

class TenantUsagePageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public render() {
    const { currentTenant, isLoading } = this.props;

    if (isLoading) {
      return <Loading />;
    }

    return (
      <BasePage>
        {currentTenant && (
          <Box p={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12} md={12}>
                <KPanel title="Current Kalm Usage">
                  <Box display={"flex"} flexDirection={"column"} alignItems={"center"} p={2}>
                    <Body>{currentTenant}</Body>
                    <Body>CPU xxx</Body>
                    <Body>Memory xxx</Body>
                    <Body>Seats xxx</Body>
                  </Box>
                </KPanel>
              </Grid>
            </Grid>
          </Box>
        )}
      </BasePage>
    );
  }
}

export const TenantUsagePage = withStyles(styles)(connect(mapStateToProps)(TenantUsagePageRaw));
