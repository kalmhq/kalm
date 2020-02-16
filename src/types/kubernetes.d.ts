declare module kubernetes {
  export interface Labels {
    [key: string]: string;
  }

  export interface Annotations {
    [key: string]: string;
  }

  export interface ListMetadata {
    selfLink: string;
    resourceVersion: string;
  }

  export interface Metadata {
    name: string;
    selfLink: string;
    uid: string;
    resourceVersion: string;
    creationTimestamp: string;
    labels: Labels;
    annotations: Annotations;
    finalizers?: string[];
  }
}
