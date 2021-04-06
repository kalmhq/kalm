// import { Box, createStyles, Grid, Theme, Tooltip, WithStyles } from "@material-ui/core";
// import { grey } from "@material-ui/core/colors";
// import withStyles from "@material-ui/core/styles/withStyles";
// import { deleteApplicationAction } from "actions/application";
// import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
// import { blinkTopProgressAction } from "actions/settings";
// import { push } from "connected-react-router";
// import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
// import React from "react";
// import { connect } from "react-redux";
// import { Link } from "react-router-dom";
// import { RootState } from "store";
// import CustomButton from "theme/Button";
// import { primaryColor } from "theme/theme";
// import { ApplicationDetails } from "types/application";
// import { getApplicationCreatedAtString } from "utils/application";
// import sc from "utils/stringConstants";
// import { ApplicationCard } from "widgets/ApplicationCard";
// import { ErrorBadge, PendingBadge, SuccessBadge } from "widgets/Badge";
// import { FlexRowItemCenterBox } from "widgets/Box";
// import { EmptyInfoBox } from "widgets/EmptyInfoBox";
// import { KalmApplicationIcon, KalmDetailsIcon } from "widgets/Icon";
// import { IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
// import { KRTable } from "widgets/KRTable";
// import { Caption } from "widgets/Label";
// import { KLink } from "widgets/Link";
// import { Loading } from "widgets/Loading";
// import { RoutesPopover } from "widgets/RoutesPopover";
// import { SmallCPULineChart, SmallMemoryLineChart } from "widgets/SmallLineChart";
// import { BasePage } from "../BasePage";

// const styles = (theme: Theme) =>
//   createStyles({
//     emptyWrapper: {
//       width: "100%",
//       display: "flex",
//       justifyContent: "center",
//       paddingTop: "110px",
//     },
//   });

// const mapStateToProps = (state: RootState) => {
//   const httpRoutes = state.routes.httpRoutes;
//   const componentsMap = state.components.components;
//   const clusterInfo = state.cluster.info;
//   const usingApplicationCard = state.settings.usingApplicationCard;
//   return {
//     clusterInfo,
//     httpRoutes,
//     componentsMap,
//     usingApplicationCard,
//   };
// };

// interface Props extends WithStyles<typeof styles>, WithNamespaceProps, ReturnType<typeof mapStateToProps> {}

// const ApplicationListRaw: React.FC<Props> = (props) => {
//   const confirmDelete = async (applicationDetails: ApplicationDetails) => {
//     const { dispatch } = props;
//     try {
//       await dispatch(deleteApplicationAction(applicationDetails.name));
//       await dispatch(setSuccessNotificationAction("Successfully delete an application"));
//     } catch {
//       dispatch(setErrorNotificationAction());
//     }
//   };

//   const renderCPU = (applicationListItem: ApplicationDetails) => {
//     const metrics = applicationListItem.metrics;
//     return (
//       <SmallCPULineChart data={metrics && metrics.cpu} hoverText={hasPods(applicationListItem) ? "" : "No data"} />
//     );
//   };

//   const renderMemory = (applicationListItem: ApplicationDetails) => {
//     const metrics = applicationListItem.metrics;
//     return (
//       <SmallMemoryLineChart
//         data={metrics && metrics.memory}
//         hoverText={hasPods(applicationListItem) ? "" : "No data"}
//       />
//     );
//   };

//   const renderName = (applicationDetails: ApplicationDetails) => {
//     return (
//       <>
//         <KLink to={`/namespaces/${applicationDetails.name}/components`} onClick={() => blinkTopProgressAction()}>
//           {applicationDetails.name}
//         </KLink>
//       </>
//     );
//   };

//   const renderCreatedAt = (applicationDetails: ApplicationDetails) => {
//     const { componentsMap } = props;
//     const components = componentsMap[applicationDetails.name];

//     return <Caption>{components ? getApplicationCreatedAtString(components) : "-"}</Caption>;
//   };

//   const hasPods = (applicationDetails: ApplicationDetails) => {
//     const { componentsMap } = props;
//     let count = 0;
//     componentsMap[applicationDetails.name]?.forEach((component) => {
//       component.pods?.forEach((podStatus) => {
//         count++;
//       });
//     });

//     return count !== 0;
//   };

//   const renderStatus = (applicationDetails: ApplicationDetails) => {
//     const { componentsMap } = props;

//     let podCount = 0;
//     let successCount = 0;
//     let pendingCount = 0;
//     let errorCount = 0;
//     componentsMap[applicationDetails.name]?.forEach((component) => {
//       component.pods?.forEach((podStatus) => {
//         podCount++;
//         switch (podStatus.status) {
//           case "Running": {
//             successCount++;
//             break;
//           }
//           case "Pending": {
//             pendingCount++;
//             break;
//           }
//           case "Succeeded": {
//             successCount++;
//             break;
//           }
//           case "Failed": {
//             errorCount++;
//             break;
//           }
//         }
//       });
//     });

//     if (podCount === 0) {
//       return "no pods";
//     }

//     const tooltipTitle = `Total ${podCount} pods are found. \n${successCount} ready, ${pendingCount} pending, ${errorCount} failed. Click to view details.`;

//     return (
//       <KLink
//         to={`/namespaces/${applicationDetails.name}/components`}
//         style={{ color: primaryColor }}
//         onClick={() => blinkTopProgressAction()}
//       >
//         <Tooltip title={tooltipTitle} enterDelay={500}>
//           <FlexRowItemCenterBox>
//             {successCount > 0 ? (
//               <FlexRowItemCenterBox mr={1}>
//                 <SuccessBadge />
//                 {successCount}
//               </FlexRowItemCenterBox>
//             ) : null}

//             {pendingCount > 0 ? (
//               <FlexRowItemCenterBox mr={1}>
//                 <PendingBadge />
//                 {pendingCount}
//               </FlexRowItemCenterBox>
//             ) : null}

//             {errorCount > 0 ? (
//               <FlexRowItemCenterBox>
//                 <ErrorBadge />
//                 {errorCount}
//               </FlexRowItemCenterBox>
//             ) : null}
//           </FlexRowItemCenterBox>
//         </Tooltip>
//       </KLink>
//     );
//   };

//   const getRoutes = (applicationName: string) => {
//     const { httpRoutes } = props;
//     const applicationRoutes = httpRoutes.filter((x) => {
//       let isCurrent = false;
//       x.destinations.map((target) => {
//         const hostInfos = target.host.split(".");
//         if (hostInfos[1] && hostInfos[1].startsWith(applicationName)) {
//           isCurrent = true;
//         }
//         return target;
//       });
//       return isCurrent;
//     });
//     return applicationRoutes;
//   };

//   const renderExternalAccesses = (applicationDetails: ApplicationDetails) => {
//     const applicationName = applicationDetails.name;
//     const applicationRoutes = getRoutes(applicationName);

//     if (applicationRoutes && applicationRoutes.length > 0) {
//       return <RoutesPopover applicationRoutes={applicationRoutes} applicationName={applicationName} canEdit={true} />;
//     } else {
//       return "-";
//     }
//   };

//   const renderActions = (applicationDetails: ApplicationDetails) => {
//     return (
//       <>
//         <IconLinkWithToolTip
//           onClick={() => {
//             blinkTopProgressAction();
//           }}
//           // size="small"
//           tooltipTitle="Details"
//           to={`/namespaces/${applicationDetails.name}/components`}
//         >
//           <KalmDetailsIcon />
//         </IconLinkWithToolTip>
//       </>
//     );
//   };

//   const renderSecondHeaderRight = () => {
//     return (
//       <>
//         {/* <H6>Applications</H6> */}
//         <CustomButton
//           tutorial-anchor-id="add-application"
//           component={Link}
//           color="primary"
//           size="small"
//           variant="contained"
//           to={`/namespaces/new`}
//         >
//           + {sc.NEW_APP_BUTTON}
//         </CustomButton>
//         {/* <IconButtonWithTooltip
//           tooltipTitle={usingApplicationCard ? "Using List View" : "Using Card View"}
//           aria-label={usingApplicationCard ? "Using List View" : "Using Card View"}
//           onClick={() =>
//             dispatch(
//               setSettingsAction({
//                 usingApplicationCard: !usingApplicationCard,
//               }),
//             )
//           }
//           style={{ marginLeft: 12 }}
//         >
//           {usingApplicationCard ? <KalmGridViewIcon /> : <KalmListViewIcon />}
//         </IconButtonWithTooltip> */}
//       </>
//     );
//   };

//   const renderEmpty = () => {
//     const { dispatch } = props;

//     return (
//       <EmptyInfoBox
//         image={<KalmApplicationIcon style={{ height: 120, width: 120, color: grey[200] }} />}
//         title={sc.EMPTY_APP_TITLE}
//         content={sc.EMPTY_APP_SUBTITLE}
//         button={
//           <CustomButton
//             variant="contained"
//             color="primary"
//             onClick={() => {
//               blinkTopProgressAction();
//               dispatch(push(`/namespaces/new`));
//             }}
//           >
//             {sc.NEW_APP_BUTTON}
//           </CustomButton>
//         }
//       />
//     );
//   };

//   const getKRTableColumns = () => {
//     return [
//       {
//         Header: "Name",
//         accessor: "name",
//       },
//       { Header: "Pod Status", accessor: "status" },
//       {
//         Header: "CPU",
//         accessor: "cpu",
//       },
//       {
//         Header: "Memory",
//         accessor: "memory",
//       },
//       {
//         Header: "Created At",
//         accessor: "createdAt",
//       },
//       {
//         Header: "Routes",
//         accessor: "routes",
//       },
//       {
//         Header: "Actions",
//         accessor: "actions",
//       },
//     ];
//   };

//   const getKRTableData = () => {
//     const { applications } = props;
//     const data: any[] = [];

//     if (applications) {
//       for (let i = 0; i < applications.length; i++) {
//         const application = applications[i];

//         if (application.name === "kalm-system") {
//           continue;
//         }

//         const applicationDetails = application as ApplicationDetails;
//         data.push({
//           name: renderName(applicationDetails),
//           status: renderStatus(applicationDetails),
//           cpu: renderCPU(applicationDetails),
//           memory: renderMemory(applicationDetails),
//           createdAt: renderCreatedAt(applicationDetails),
//           routes: renderExternalAccesses(applicationDetails),
//           actions: renderActions(applicationDetails),
//         });
//       }
//     }

//     return data;
//   };

//   const renderKRTable = () => {
//     return <KRTable noOutline showTitle={true} title="Apps" columns={getKRTableColumns()} data={getKRTableData()} />;
//   };

//   const renderGrid = () => {
//     const { applications, componentsMap } = props;

//     const filteredApps = applications;

//     const GridRow = (app: ApplicationDetails, index: number) => {
//       const applicationRoutes = getRoutes(app.name);
//       return (
//         <Grid key={index} item sm={6} md={4} lg={3}>
//           <ApplicationCard
//             application={app}
//             componentsMap={componentsMap}
//             httpRoutes={applicationRoutes}
//             confirmDelete={confirmDelete}
//             canEdit={true}
//           />
//         </Grid>
//       );
//     };

//     return (
//       <Grid container spacing={2}>
//         {filteredApps.map((app, index) => {
//           return GridRow(app, index);
//         })}
//       </Grid>
//     );
//   };

//   const { isNamespaceLoading, isNamespaceFirstLoaded, applications, usingApplicationCard } = props;
//   return (
//     <BasePage secondHeaderRight={renderSecondHeaderRight()}>
//       <Box p={2}>
//         {isNamespaceLoading && !isNamespaceFirstLoaded ? (
//           <Loading />
//         ) : applications.length === 0 ? (
//           renderEmpty()
//         ) : usingApplicationCard ? (
//           renderGrid()
//         ) : (
//           renderKRTable()
//         )}
//       </Box>
//     </BasePage>
//   );
// };

// export const ApplicationListPage = withStyles(styles)(withNamespace(connect(mapStateToProps)(ApplicationListRaw)));

import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Link from "@material-ui/core/Link";
import { makeStyles } from "@material-ui/core/styles";
import { DataGrid, GridColDef, GridValueGetterParams } from "@material-ui/data-grid";
import AddIcon from "@material-ui/icons/Add";
import { deleteResource } from "api";
import { formatAgoFromNow } from "formatters/time";
import React from "react";
import { useSelector } from "react-redux";
import { Link as RouterLink } from "react-router-dom";
import { RootState } from "store";
import { K8sObject } from "types";
const useStyles = makeStyles({
  root: {
    ".MuiDataGrid-cell": {
      outline: 0,
    },
  },
});

const columns: GridColDef[] = [
  {
    field: "id",
    headerName: "Name",
    flex: 1,
    renderCell: (params) => {
      return (
        <Link component={RouterLink} to={"/namespaces/" + params.row.id}>
          {params.value}
        </Link>
      );
    },
  },
  {
    field: "age",
    headerName: "Age",
    width: 200,
    headerAlign: "right",
    align: "right",
    valueGetter: (params: GridValueGetterParams) => {
      return formatAgoFromNow(params.row.metadata.creationTimestamp);
    },
  },
  {
    field: "status",
    headerName: "Status",
    width: 200,
    headerAlign: "right",
    align: "right",
    valueGetter: (params: GridValueGetterParams) => {
      return params.row.metadata.deletionTimestamp ? "Terminating" : "Active";
    },
  },
  {
    field: "action",
    headerName: "Action",
    width: 200,
    renderCell: (params) => {
      if (
        params.row.id === "kube-system" ||
        params.row.id === "kube-public" ||
        params.row.id === "kube-node-lease" ||
        params.row.id === "default"
      ) {
        return <></>;
      }

      return (
        <Link
          style={{ display: "inline-block" }}
          component="button"
          variant="body2"
          disabled={!!params.row.metadata.deletionTimestamp}
          onClick={() => {
            deleteResource((params.row as any) as K8sObject);
          }}
        >
          Delete
        </Link>
      );
    },
  },
];

export const NamespaceList = () => {
  const namespaces = useSelector((state: RootState) => state.namespacesV2);
  const rows = Object.entries(namespaces).map(([name, ns]) => ({ ...ns, id: name }));
  const classes = useStyles();

  // const handlerRowClick = (event: any) => {
  //   console.log(event);
  // };

  const perPage = 20;

  // const history = useHistory();

  return (
    <Box p={2}>
      {/* <CommandK
        items={[
          {
            icon: <AddIcon />,
            title: `New Namespace`,
            action: () => {
              history.push("/namespaces/new");
            },
          },
        ]}
      /> */}
      <Box mb={2}>
        <Button variant="contained" color="primary" href="/namespaces/new" startIcon={<AddIcon />} size="small">
          New Namespace
        </Button>
      </Box>
      <DataGrid
        className={classes.root}
        rows={rows}
        columns={columns}
        pageSize={perPage}
        autoHeight
        hideFooter={rows.length <= perPage}
        density="compact"
        // onRowClick={handlerRowClick}
        disableSelectionOnClick
        disableColumnSelector
      />
    </Box>
  );
};
