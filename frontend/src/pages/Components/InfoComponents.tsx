import React from "react";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { ItemWithHoverIcon } from "widgets/ItemWithHoverIcon";
import { RichEditor } from "widgets/RichEditor";
import copy from "copy-to-clipboard";
import { CopyIcon } from "widgets/Icon";
import { setSuccessNotificationAction } from "actions/notification";

export const renderCommandValue = (value: any, dispatch: any) => {
  if (value === undefined || value === "") {
    return null;
  } else {
    return (
      <ItemWithHoverIcon
        icon={
          <IconButtonWithTooltip
            tooltipTitle="Copy"
            aria-label="copy"
            onClick={() => {
              copy(value);
              dispatch(setSuccessNotificationAction("Copied successful!"));
            }}
          >
            <CopyIcon fontSize="small" />
          </IconButtonWithTooltip>
        }
      >
        <RichEditor height="100px" wrapEnabled readOnly value={`${value}`} />
      </ItemWithHoverIcon>
    );
  }
};

export const renderCopyableValue = (value: any, dispatch: any) => {
  if (value === undefined || value === "") {
    return null;
  } else {
    return (
      <ItemWithHoverIcon
        icon={
          <IconButtonWithTooltip
            tooltipTitle="Copy"
            aria-label="copy"
            onClick={(e) => {
              e.stopPropagation();
              copy(value);
              dispatch(setSuccessNotificationAction("Copied successful!"));
            }}
          >
            <CopyIcon fontSize="small" />
          </IconButtonWithTooltip>
        }
      >
        {value}
      </ItemWithHoverIcon>
    );
  }
};
