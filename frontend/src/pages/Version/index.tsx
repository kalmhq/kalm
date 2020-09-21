import { Box, createStyles, Grid, Theme, withStyles, WithStyles, Button } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { KPanel } from "widgets/KPanel";
import { BasePage } from "pages/BasePage";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";
import { KMLink } from "widgets/Link";

// TODO fake data for temporary
const kalmVersionInfo = {
  version: "v0.1.0",
  buildDate: "2020-09-18",
};

const kalmLatestVersionInfo = {
  version: "v0.1.1",
  buildDate: "2020-09-19",
};

const k8sVersionInfo = {
  gitVersion: "v2.21.0",
  gitCommit: "xxxxxxxxxxxxxxxxxxxx",
  platform: "linux/amd64",
  compiler: "gc",
  goVerison: "go1.13.10",
  buildDate: "2020-9-18",
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

class VersionPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private handleUpgrade = () => {
    alert("WIP");
  };

  public render() {
    return (
      <BasePage>
        <Box p={2}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={6} md={6}>
              <KPanel title="Kalm Version">
                <Box p={2}>
                  <Box textAlign="center" mb={1}>
                    Current Version
                  </Box>
                  <VerticalHeadTable
                    items={[
                      { name: "Version", content: kalmVersionInfo.version },
                      { name: "Build Date", content: kalmVersionInfo.buildDate },
                    ]}
                  />

                  {kalmLatestVersionInfo.version === kalmVersionInfo.version ? (
                    <Box textAlign="center" mt={2}>
                      Kalm is Up to date.
                    </Box>
                  ) : (
                    <>
                      <Box textAlign="center" mt={2} mb={1}>
                        Latest Version
                      </Box>
                      <VerticalHeadTable
                        items={[
                          {
                            name: "Version",
                            content: (
                              <Box display="flex" alignItems="center">
                                {kalmLatestVersionInfo.version}
                                <Box ml={2}>
                                  <KMLink target="_blank" href="https://github.com/kalmhq/kalm/releases">
                                    Relaese Note
                                  </KMLink>
                                </Box>
                                <Box ml={2}>
                                  <Button variant="outlined" color="primary" size="small" onClick={this.handleUpgrade}>
                                    Upgrade
                                  </Button>
                                </Box>
                              </Box>
                            ),
                          },
                          { name: "Build Date", content: kalmLatestVersionInfo.buildDate },
                        ]}
                      />
                    </>
                  )}
                </Box>
              </KPanel>
            </Grid>
            <Grid item xs={6} sm={6} md={6}>
              <KPanel title="Kubernetes Version">
                <Box p={2}>
                  <VerticalHeadTable
                    items={[
                      { name: "Git Version", content: k8sVersionInfo.gitVersion },
                      { name: "Git Commit", content: k8sVersionInfo.gitCommit },
                      { name: "Platform", content: k8sVersionInfo.platform },
                      { name: "Compiler", content: k8sVersionInfo.compiler },
                      { name: "Go Version", content: k8sVersionInfo.goVerison },
                      { name: "Build Date", content: k8sVersionInfo.buildDate },
                    ]}
                  />
                </Box>
              </KPanel>
            </Grid>
          </Grid>
        </Box>
      </BasePage>
    );
  }
}

export const VersionPage = withStyles(styles)(connect(mapStateToProps)(VersionPageRaw));
