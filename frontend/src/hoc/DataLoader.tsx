import { watchResourceList } from "api";
import { loadApiResources } from "api/resources";
import React, { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";

export const DataLoader: React.FC = () => {
  const dispatch = useDispatch();

  const watchList = useCallback(
    (kind: string) => {
      watchResourceList(kind, (type, obj) => dispatch({ type, payload: obj }));
    },
    [dispatch],
  );

  // did mount
  useEffect(() => {
    loadApiResources();
    watchList("Namespace");
    watchList("Deployment");
  }, [watchList]);

  return null;
};
