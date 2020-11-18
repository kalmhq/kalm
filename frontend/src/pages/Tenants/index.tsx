import { Box, createStyles, Grid, Theme, WithStyles, withStyles } from "@material-ui/core";
import React from "react";
import { TDispatchProp } from "types";
import { KPanel } from "widgets/KPanel";
import { BasePage } from "pages/BasePage";
import { Loading } from "../../widgets/Loading";
import { RootState } from "reducers";
import { connect } from "react-redux";
import { KMLink } from "widgets/Link";
import { Body } from "widgets/Label";
import { composeTenantLink, getHasSelectedTenant, getKalmSaaSLink, isSameTenant } from "selectors/tenant";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  const auth = state.auth;
  const currentTenant = auth.tenant;
  const tenants = auth.tenants;
  const isLoading = auth.isLoading;
  const hasSelectedTenant = getHasSelectedTenant(state);
  return {
    isLoading,
    currentTenant,
    tenants,
    hasSelectedTenant,
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

class TenantsPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public render() {
    const { currentTenant, tenants, isLoading, hasSelectedTenant } = this.props;

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

        {tenants.length > 0 && !hasSelectedTenant && (
          <Box p={2}>
            <Grid container spacing={2}>
              <Grid item xs={8} sm={8} md={8}>
                <KPanel title="Select Target">
                  <Box display={"flex"} flexDirection={"column"} p={2}>
                    {tenants.length > 0 ? (
                      tenants.map((t, index) => {
                        const url = composeTenantLink(t);
                        return (
                          <Box m={1} key={index}>
                            {isSameTenant(t, currentTenant) ? (
                              t
                            ) : (
                              <KMLink rel="noopener noreferrer" href={url} target={"_self"}>
                                {t}
                              </KMLink>
                            )}
                          </Box>
                        );
                      })
                    ) : (
                      <>
                        You don't have any kalm, please go to Kalm SaaS to subscript new plan.{" "}
                        <KMLink href={getKalmSaaSLink()} target={"_blank"}>
                          Open Kalm SaaS
                        </KMLink>{" "}
                      </>
                    )}
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

export const TenantsPage = withStyles(styles)(connect(mapStateToProps)(TenantsPageRaw));
