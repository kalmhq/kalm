import { getDependencies } from "./kubernetesApi";
import { ThunkResult, StatusFailure } from "../types";
import { LOAD_DEPENDENCIES_PENDING, LOAD_DEPENDENCIES_FULFILLED, LOAD_DEPENDENCIES_FAILED } from "../types/dependency";
import { setErrorNotificationAction } from "./notification";

// export const createDependencyAction = (dependencyRaw: Dependency): ThunkResult<Promise<void>> => {
//   return async dispatch => {
//     const dependency = await createKappComonentTemplate(convertToCRDDependency(dependencyRaw));

//     dispatch({
//       type: CREATE_COMPONENT,
//       payload: { dependency }
//     });
//   };
// };

// export const deleteComponentAction = (dependencyId: string): ThunkResult<Promise<void>> => {
//   return async (dispatch, getState) => {
//     const dependency = getState()
//       .get("dependencies")
//       .get("dependencies")
//       .get(dependencyId)!;

//     await deleteKappComonentTemplate(convertToCRDDependency(dependency));

//     dispatch({
//       type: DELETE_COMPONENT,
//       payload: { dependencyId }
//     });
//   };
// };

export const loadDependenciesAction = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({ type: LOAD_DEPENDENCIES_PENDING });

    let dependencies;
    try {
      dependencies = await getDependencies();
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      dispatch({ type: LOAD_DEPENDENCIES_FAILED });
      return;
    }

    dispatch({
      type: LOAD_DEPENDENCIES_FULFILLED,
      payload: {
        dependencies
      }
    });
  };
};
