import React from "react";

export const BlankTargetLink = (props: Pick<HTMLLinkElement, "href"> & { children: React.ReactNode }) => {
  return (
    <a href={props.href} target="_blank" rel="noopener noreferrer">
      {props.children}
    </a>
  );
};
