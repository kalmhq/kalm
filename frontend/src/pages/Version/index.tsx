import { Box, createStyles, Grid, Theme, WithStyles, withStyles } from "@material-ui/core";
import React from "react";
import { TDispatchProp } from "types";
import { KPanel } from "widgets/KPanel";
import { BasePage } from "pages/BasePage";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";
import { withClusterInfo, WithClusterInfoProps } from "../../hoc/withClusterInfo";
import { Loading } from "../../widgets/Loading";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles>, WithClusterInfoProps, TDispatchProp {}

interface State {}

class VersionPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public render() {
    const { clusterInfo, isClusterInfoLoaded, isClusterInfoLoading } = this.props;

    if (isClusterInfoLoading && !isClusterInfoLoaded) {
      return <Loading />;
    }

    return (
      <BasePage>
        <Box p={2}>
          <Grid container spacing={2}>
            {clusterInfo.kalmVersion && (
              <Grid item xs={6} sm={6} md={6}>
                <KPanel title="Kalm Version">
                  <Box p={2}>
                    <VerticalHeadTable
                      items={[
                        { name: "Git Version", content: clusterInfo.kalmVersion.gitVersion },
                        { name: "Git Commit", content: clusterInfo.kalmVersion.gitCommit },
                        { name: "Platform", content: clusterInfo.kalmVersion.platform },
                        { name: "Go Version", content: clusterInfo.kalmVersion.goVersion },
                        { name: "Build Date", content: clusterInfo.kalmVersion.buildDate },
                      ]}
                    />
                  </Box>
                </KPanel>
              </Grid>
            )}
            {clusterInfo.kubernetesVersion && (
              <Grid item xs={6} sm={6} md={6}>
                <KPanel title="Kubernetes Version">
                  <Box p={2}>
                    <VerticalHeadTable
                      items={[
                        { name: "Git Version", content: clusterInfo.kubernetesVersion.gitVersion },
                        { name: "Git Commit", content: clusterInfo.kubernetesVersion.gitCommit },
                        { name: "Platform", content: clusterInfo.kubernetesVersion.platform },
                        { name: "Go Version", content: clusterInfo.kubernetesVersion.goVersion },
                        { name: "Build Date", content: clusterInfo.kubernetesVersion.buildDate },
                      ]}
                    />
                  </Box>
                </KPanel>
              </Grid>
            )}
          </Grid>
        </Box>
      </BasePage>
    );
  }
}

export const VersionPage = withStyles(styles)(withClusterInfo(VersionPageRaw));
