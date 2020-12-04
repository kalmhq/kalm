import { Box, Grid, TableHead } from "@material-ui/core";
import LinearProgress, { LinearProgressProps } from "@material-ui/core/LinearProgress";
import Table from "@material-ui/core/Table/Table";
import TableBody from "@material-ui/core/TableBody/TableBody";
import TableCell from "@material-ui/core/TableCell/TableCell";
import TableContainer from "@material-ui/core/TableContainer/TableContainer";
import TableRow from "@material-ui/core/TableRow/TableRow";
import Typography from "@material-ui/core/Typography";
import { BasePage } from "pages/BasePage";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "reducers";
import { KPanel } from "widgets/KPanel";
import { Loading } from "../../widgets/Loading";

function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
  return (
    <Box display="flex" alignItems="center">
      <Box width="100%" mr={1}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box minWidth={35}>
        <Typography variant="body2" color="textSecondary">{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
}

const multiples = {
  m: 0.001,
  Ki: 1024,
  Mi: 1024 ** 2,
  Gi: 1024 ** 3,
  Ti: 1024 ** 4,
  Pi: 1024 ** 5,
  Ei: 1024 ** 6,
  K: 1000,
  M: 1000 ** 2,
  G: 1000 ** 3,
  T: 1000 ** 4,
  P: 1000 ** 5,
  E: 1000 ** 6,
};

const TenantUsagePageRaw: React.FC = () => {
  // const auth = useSelector((state: RootState) => state.auth);
  const currentTenant = useSelector((state: RootState) => state.tenant.info);
  const isLoading = useSelector((state: RootState) => state.tenant.isLoading);
  const isFirstLoaded = useSelector((state: RootState) => state.tenant.isFirstLoaded);

  if (isLoading && !isFirstLoaded) {
    return <Loading />;
  }

  if (!currentTenant.name) {
    return <div>Load Error</div>;
  }

  const items: { name: string; content: string; percentage: number }[] = [];

  const getPercentage = (numerator: string, denominator: string): number => {
    if (!numerator) {
      return 0;
    }

    let n = parseInt(numerator);

    if (n.toString() !== numerator) {
      for (let k in multiples) {
        if (numerator.endsWith(k)) {
          n = n * multiples[k as keyof typeof multiples];
          break;
        }
      }
    }

    let m = parseInt(denominator);
    if (m.toString() !== denominator) {
      for (let k in multiples) {
        if (denominator.endsWith(k)) {
          m = m * multiples[k as keyof typeof multiples];
          break;
        }
      }
    }

    return (n / m) * 100;
  };

  for (let key in currentTenant.resourceQuotas) {
    let name = key;

    switch (key) {
      case "cpu":
        name = "CPU";
        break;
      case "memory":
        name = "Memory";
        break;
      case "applicationsCount":
        name = "Applications Count";
        break;
      case "componentsCount":
        name = "Components Count";
        break;
      case "httpsCertsCount":
        name = "Https Certs Count";
        break;
      default:
        continue;
    }

    items.push({
      name: name,
      content: `${currentTenant.consumedResources[key]} / ${currentTenant.resourceQuotas[key]}`,
      percentage: getPercentage(currentTenant.consumedResources[key], currentTenant.resourceQuotas[key]),
    });
  }

  return (
    <BasePage>
      <Box p={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={12}>
            <KPanel>
              <TableContainer>
                <Table aria-label="table" size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Resources</TableCell>
                      <TableCell>Usage</TableCell>
                      <TableCell>Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, index) => {
                      return (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.content}</TableCell>
                          <TableCell>
                            <LinearProgressWithLabel value={item.percentage} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </KPanel>
          </Grid>
        </Grid>
      </Box>
    </BasePage>
  );
};

export const TenantUsagePage = TenantUsagePageRaw;
