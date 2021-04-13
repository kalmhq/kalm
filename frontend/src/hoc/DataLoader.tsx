import { watchResourceList } from "api";
import { loadApiResources } from "api/resources";
import React, { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";

export const DataLoader: React.FC = () => {
  const dispatch = useDispatch();

  const watchList = useCallback(
    (kind: string) => {
      return watchResourceList(kind, (type, obj) => dispatch({ type, payload: obj }));
    },
    [dispatch],
  );

  // did mount
  useEffect(() => {
    loadApiResources();

    const cancels = [
      watchList("Namespace"),
      watchList("Secret"),
      watchList("Deployment"),
      watchList("Node"),
      watchList("DockerRegistry"),
    ];

    return () => {
      cancels.map((cancelFuncPromise) => cancelFuncPromise.then((cancelFunc) => cancelFunc()));
    };
  }, [watchList]);

  return null;
};
