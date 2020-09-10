import { Collapse, Box } from "@material-ui/core";
import React, { ReactNode } from "react";
import { KMLink } from "./Link";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { FlexRowItemCenterBox } from "./Box";

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
      <KMLink component="button" variant="body2" onClick={() => setOpen(!open)}>
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
