declare module kubernetes {
  declare module PersistentVolumn {
    export interface Capacity {
      storage: string;
    }

    export interface GcePersistentDisk {
      pdName: string;
      fsType: string;
    }

    export interface ClaimRef {
      kind: string;
      namespace: string;
      name: string;
      uid: string;
      apiVersion: string;
      resourceVersion: string;
    }

    export interface MatchExpression {
      key: string;
      operator: string;
      values: string[];
    }

    export interface NodeSelectorTerm {
      matchExpressions: MatchExpression[];
    }

    export interface Required {
      nodeSelectorTerms: NodeSelectorTerm[];
    }

    export interface NodeAffinity {
      required: Required;
    }

    export interface Spec {
      capacity: Capacity;
      gcePersistentDisk: GcePersistentDisk;
      accessModes: string[];
      claimRef: ClaimRef;
      persistentVolumeReclaimPolicy: string;
      storageClassName: string;
      volumeMode: string;
      nodeAffinity: NodeAffinity;
    }

    export interface Status {
      phase: string;
    }

    export interface Item {
      metadata: Metadata;
      spec: Spec;
      status: Status;
    }

    export interface List {
      kind: string;
      apiVersion: string;
      metadata: ListMetadata;
      items: Item[];
    }
  }
}
