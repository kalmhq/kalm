import React from "react";
import { KMLink } from "widgets/Link";

export const BlankTargetLink = (props: Pick<HTMLLinkElement, "href"> & { children: React.ReactNode }) => {
  return (
    <KMLink href={props.href} target="_blank" rel="noopener noreferrer">
      {props.children}
    </KMLink>
  );
};
