import { setSuccessNotificationAction } from "actions/notification";
import copy from "copy-to-clipboard";
import React from "react";
import { CopyIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { ItemWithHoverIcon } from "widgets/ItemWithHoverIcon";
import { RichEditor } from "widgets/RichEditor";

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
            size="small"
            onClick={() => {
              copy(value);
              dispatch(setSuccessNotificationAction("Copied successful!"));
            }}
          >
            <CopyIcon fontSize="small" />
          </IconButtonWithTooltip>
        }
      >
        <RichEditor showLineNumbers={false} wrapEnabled readOnly value={`${value}`} />
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
            size="small"
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
