import { setSuccessNotificationAction } from "actions/notification";
import copy from "copy-to-clipboard";
import React from "react";
import { useDispatch } from "react-redux";
import { CopyIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";

export const TextAndCopyButton = ({ text }: { text: string }) => {
  const dispatch = useDispatch();

  return (
    <span>
      {text}
      <IconButtonWithTooltip
        style={{ marginLeft: 16 }}
        tooltipTitle="Copy"
        aria-label="copy"
        onClick={() => {
          copy(text);
          dispatch(setSuccessNotificationAction("Copied successful!"));
        }}
      >
        <CopyIcon fontSize="small" />
      </IconButtonWithTooltip>
    </span>
  );
};
