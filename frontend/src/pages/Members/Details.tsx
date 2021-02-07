import { Avatar, Box, Button, Grid, MenuItem, TextField } from "@material-ui/core";
import {
  createRoleBindingsAction,
  deleteAllRoleBindingsAction,
  deleteRoleBindingsAction,
  updateRoleBindingsAction,
} from "actions/user";
import { impersonate } from "api/api";
import { push } from "connected-react-router";
import { WithRoleBindingProps, withRoleBindings } from "hoc/withRoleBinding";
import { WithUserAuthProps } from "hoc/withUserAuth";
import { BasePage } from "pages/BasePage";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouteMatch } from "react-router-dom";
import { RootState } from "reducers";
import { RoleBinding, SubjectTypeUser } from "types/member";
import { gravatar } from "utils/gavatar";
import { FlexRowItemCenterBox } from "widgets/Box";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { KPanel } from "widgets/KPanel";
import { KRTable } from "widgets/KRTable";
import { Loading } from "widgets/Loading";

interface Props extends WithUserAuthProps, WithRoleBindingProps {}

const columns = [
  {
    Header: "Application",
    accessor: "application",
  },
  {
    Header: "Role",
    accessor: "role",
  },
];

const applicationRoleOptions = [
  <MenuItem value="">
    <em>None</em>
  </MenuItem>,
  <MenuItem key="viewer" value="viewer">
    Viewer
  </MenuItem>,
  <MenuItem key="editor" value="editor">
    Editor
  </MenuItem>,
];

const clusterRoleOptions = [
  <MenuItem value="placeholder">
    <em>None</em>
  </MenuItem>,
  <MenuItem key="viewer" value="clusterViewer">
    Cluster Viewer
  </MenuItem>,
  <MenuItem key="editor" value="clusterEditor">
    Cluster Editor
  </MenuItem>,
  <MenuItem key="owner" value="clusterOwner">
    Cluster Owner
  </MenuItem>,
];

export const MemberPageRaw: React.FC<Props> = (props) => {
  const match = useRouteMatch<{ email: string }>();
  const email = match.params.email;
  const dispatch = useDispatch();

  const { isFirstLoaded, isLoading, roleBindings } = useSelector((state: RootState) => {
    return state.roles;
  });

  const { isListFirstLoaded, isListLoading, applications } = useSelector((state: RootState) => {
    return state.applications;
  });

  const bindings = roleBindings.filter(
    (x) => x.subjectType === SubjectTypeUser && x.subject === email.toLocaleLowerCase(),
  );

  const clusterBinding = bindings.find((x) => x.namespace === "kalm-system");

  const bindingsMap = bindings.reduce((acc, item) => {
    acc[item.namespace] = item;
    return acc;
  }, {} as { [key: string]: RoleBinding });

  const changeApplicationRole = (role: string, applicationName: string) => {
    const binding = bindingsMap[applicationName];
    if (role === "") {
      if (binding) {
        dispatch(deleteRoleBindingsAction(applicationName, binding.name));
      }
    } else {
      if (!binding) {
        dispatch(
          createRoleBindingsAction({
            subject: email,
            namespace: applicationName,
            subjectType: SubjectTypeUser,
            role,
            name: "",
            expiredAtTimestamp: 0,
          }),
        );
      } else {
        dispatch(
          updateRoleBindingsAction({
            ...binding,
            subject: email,
            subjectType: SubjectTypeUser,
            role,
          }),
        );
      }
    }
  };

  const changeClusterRole = (role: string) => {
    const applicationName = "kalm-system";
    const binding = bindingsMap[applicationName];

    if (role === "") {
      if (binding) {
        dispatch(deleteRoleBindingsAction(applicationName, binding.name));
      }
    } else {
      if (!binding) {
        dispatch(
          createRoleBindingsAction({
            subject: email,
            namespace: applicationName,
            subjectType: SubjectTypeUser,
            role,
            name: "",
            expiredAtTimestamp: 0,
          }),
        );
      } else {
        dispatch(
          updateRoleBindingsAction({
            ...binding,
            subject: email,
            subjectType: SubjectTypeUser,
            role,
          }),
        );
      }
    }
  };

  const renderRolebindings = () => {
    if (!isFirstLoaded && isLoading) {
      return <Loading />;
    }

    if (!isListFirstLoaded && isListLoading) {
      return <Loading />;
    }

    const data: any = [];

    for (let application of applications) {
      if (application.name === "kalm-system") {
        continue;
      }

      const binding = bindingsMap[application.name];
      data.push({
        application: application.name,
        role: (
          <TextField
            select
            variant="outlined"
            size="small"
            SelectProps={{ displayEmpty: true }}
            value={binding ? binding.role : ""}
            onChange={(event) => changeApplicationRole(event.target.value, application.name)}
          >
            {applicationRoleOptions}
          </TextField>
        ),
      });
    }

    return (
      <KPanel>
        <KRTable noOutline showTitle title="Roles in applications" columns={columns} data={data} />
      </KPanel>
    );
  };

  const renderButtons = () => {
    return (
      <Box p={2}>
        <Button
          color="primary"
          size="small"
          variant="outlined"
          onClick={async () => {
            impersonate(email, SubjectTypeUser);
          }}
        >
          Impersonate
        </Button>
        <Box display="inline" ml={2}>
          <DeleteButtonWithConfirmPopover
            useText
            popupId={`delete-member-popup`}
            popupTitle={`DELETE ${email}`}
            confirmedAction={async () => {
              await dispatch(deleteAllRoleBindingsAction(email));
              dispatch(push("/members"));
            }}
          />
        </Box>
      </Box>
    );
  };

  return (
    <BasePage>
      <Box p={2}>
        <Grid container spacing={2}>
          <Grid item md={8} xs={12}>
            <KPanel>
              <Box p={2}>
                <FlexRowItemCenterBox>
                  <Avatar src={gravatar(email)} />
                  <Box display="inline-block" ml={2}>
                    {email}
                  </Box>
                </FlexRowItemCenterBox>
              </Box>
              {renderButtons()}
            </KPanel>
          </Grid>
          <Grid item md={4} xs={12}>
            <KPanel style={{ height: "100%" }} title="Cluster Role">
              <Box p={2}>
                <TextField
                  fullWidth
                  select
                  variant="outlined"
                  size="small"
                  SelectProps={{ displayEmpty: true }}
                  value={clusterBinding ? clusterBinding.role : ""}
                  onChange={(event) => changeClusterRole(event.target.value)}
                >
                  {clusterRoleOptions}
                </TextField>
              </Box>
            </KPanel>
          </Grid>
        </Grid>
        <Box mt={1}>{renderRolebindings()}</Box>
      </Box>
    </BasePage>
  );
};

export const MemberPage = withRoleBindings(MemberPageRaw);
