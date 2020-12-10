import { Box, Collapse } from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import React, { MouseEvent, ReactNode } from "react";
import { FlexRowItemCenterBox } from "./Box";
import { KMLink } from "./Link";

interface Props {
  title: ReactNode;
  defaultOpen?: boolean;
  showIcon?: boolean;
  children?: ReactNode;
}

export const CollapseWrapper = ({ title, defaultOpen, showIcon, children }: Props) => {
  const [open, setOpen] = React.useState(!!defaultOpen);
  return (
    <>
      <KMLink
        component="button"
        variant="body2"
        onClick={(e: MouseEvent) => {
          e.preventDefault();
          setOpen(!open);
        }}
      >
        <FlexRowItemCenterBox>
          {showIcon ? (
            <Box style={{ display: "flex", alignItems: "center" }}>
              {open ? (
                <ExpandMoreIcon />
              ) : (
                <ExpandMoreIcon style={{ transform: "rotate(-90deg)", transition: "500" }} />
              )}
            </Box>
          ) : null}
          {title}
        </FlexRowItemCenterBox>
      </KMLink>

      <Collapse in={open}>{children}</Collapse>
    </>
  );
};
