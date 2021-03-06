export const SET_CURRENT_NAMESPACE = "SET_CURRENT_NAMESPACE";

export interface SetCurrentNamespace {
  type: typeof SET_CURRENT_NAMESPACE;
  payload: {
    namespace: string;
  };
}

export type NamespaceActions = SetCurrentNamespace;
