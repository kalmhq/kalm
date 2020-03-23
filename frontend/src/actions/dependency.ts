import { getDependencies } from "./kubernetesApi";
import { ThunkResult } from "../types";
import { LOAD_DEPENDENCIES_PENDING, LOAD_DEPENDENCIES_FULFILLED } from "../types/dependency";

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

    const dependencies = await getDependencies();

    dispatch({
      type: LOAD_DEPENDENCIES_FULFILLED,
      payload: {
        dependencies
      }
    });
  };
};
