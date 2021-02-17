import { Avatar, Box } from "@material-ui/core";
import { blue } from "@material-ui/core/colors";
import { blinkTopProgressAction } from "actions/settings";
import { deleteAllRoleBindingsAction } from "actions/user";
import { impersonate } from "api/api";
import { push } from "connected-react-router";
import { useRoleBindings } from "hoc/withRoleBinding";
import { BasePage } from "pages/BasePage";
import React from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import CustomButton from "theme/Button";
import { RoleBinding } from "types/member";
import { gravatar } from "utils/gavatar";
import { BlankTargetLink } from "widgets/BlankTargetLink";
import { CustomizedButton } from "widgets/Button";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { ImpersonateIcon, PeopleIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { InfoBox } from "widgets/InfoBox";
import { KRTable } from "widgets/KRTable";

export const MemberListPage: React.FC = () => {
  const dispatch = useDispatch();
  const { roleBindings } = useRoleBindings();

  const renderSecondHeaderRight = () => {
    return (
      <>
        <CustomButton component={Link} color="primary" size="small" variant="outlined" to={`/members/new`}>
          Add Member
        </CustomButton>
      </>
    );
  };

  const renderEmpty = () => {
    let link: string = "";

    link = "/members/new";

    return (
      <EmptyInfoBox
        image={<PeopleIcon style={{ height: 120, width: 120, color: blue[200] }} />}
        title={"Your cluster has not been authorized to other members"}
        content={"Authorize other members to manage this cluster together."}
        button={
          <CustomizedButton
            variant="contained"
            color="primary"
            onClick={() => {
              blinkTopProgressAction();

              if (link.startsWith("http")) {
                return window.open(link, "_blank");
              }

              dispatch(push(link));
            }}
          >
            Add members
          </CustomizedButton>
        }
      />
    );
  };

  const getKRTableColumns = () => {
    return [
      {
        Header: "Avatar",
        accessor: "avatar",
      },
      {
        Header: "User",
        accessor: "subject",
      },

      {
        Header: "Action",
        accessor: "actions",
      },
    ];
  };

  const getKRTableData = () => {
    const data: any[] = [];

    const exist: { [key: string]: boolean } = {};

    roleBindings.forEach((roleBinding) => {
      if (!exist[roleBinding.subject]) {
        exist[roleBinding.subject] = true;

        data.push({
          name: roleBinding.name,
          avatar: (
            <Link to={`/members/${roleBinding.subject}`}>
              <Avatar src={gravatar(roleBinding.subject, { size: 36 })} />
            </Link>
          ),
          subject: <Link to={`/members/${roleBinding.subject}`}>{roleBinding.subject}</Link>,
          actions: renderActions(roleBinding),
        });
      }
    });

    return data;
  };

  const renderActions = (roleBinding: RoleBinding) => {
    return (
      <>
        <IconButtonWithTooltip
          onClick={async () => {
            impersonate(roleBinding.subject, roleBinding.subjectType);
          }}
          tooltipTitle="Impersonate"
        >
          <ImpersonateIcon />
        </IconButtonWithTooltip>
        <DeleteButtonWithConfirmPopover
          popupId={`delete-member-${roleBinding.namespace}-${roleBinding.name}-popup`}
          popupTitle={`DELETE ${roleBinding.subject}`}
          confirmedAction={() => dispatch(deleteAllRoleBindingsAction(roleBinding.subject))}
        />
      </>
    );
  };

  const renderInfoBox = () => {
    const title = "References";

    const options = [
      {
        title: (
          <BlankTargetLink href="https://kalm.dev/docs/next/auth/overview">How kalm permission works?</BlankTargetLink>
        ),
        content: "",
      },
      {
        title: (
          <BlankTargetLink href="https://kalm.dev/docs/next/auth/roles">
            What's the permissions of a role?
          </BlankTargetLink>
        ),
        content: "",
      },
    ];

    return <InfoBox title={title} options={options} />;
  };

  const renderContent = () => {
    return roleBindings.length > 0 ? (
      <KRTable showTitle={true} title="Members" columns={getKRTableColumns()} data={getKRTableData()} />
    ) : (
      renderEmpty()
    );
  };

  return (
    <BasePage secondHeaderRight={renderSecondHeaderRight()}>
      <Box p={2}>
        {renderContent()}
        <Box mt={2}>{renderInfoBox()}</Box>
      </Box>
    </BasePage>
  );
};
