import { Collapse } from "@material-ui/core";
import React, { ReactNode } from "react";
import { KMLink } from "./Link";

interface Props {
  title: ReactNode;
  defaultOpen?: boolean;
  children?: ReactNode;
}

export const CollapseWrapper = ({ title, defaultOpen, children }: Props) => {
  const [open, setOpen] = React.useState(!!defaultOpen);
  return (
    <>
      <KMLink component="button" variant="body2" onClick={() => setOpen(!open)}>
        {title}
      </KMLink>
      <Collapse in={open}>{children}</Collapse>
    </>
  );
};
