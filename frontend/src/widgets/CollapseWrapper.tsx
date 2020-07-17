import { Collapse, Link } from "@material-ui/core";
import React, { ReactNode } from "react";

interface Props {
  title: string;
  defaultOpen?: boolean;
  children?: ReactNode;
}

export const CollapseWrapper = ({ title, defaultOpen, children }: Props) => {
  const [open, setOpen] = React.useState(!!defaultOpen);
  return (
    <>
      <Link component="button" variant="body2" onClick={() => setOpen(!open)}>
        {title}
      </Link>
      <Collapse in={open}>{children}</Collapse>
    </>
  );
};
