/**
 * Kubernetes
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: v1.15.5
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { V1ObjectMeta } from './v1ObjectMeta';
import { V1beta1SubjectAccessReviewSpec } from './v1beta1SubjectAccessReviewSpec';
import { V1beta1SubjectAccessReviewStatus } from './v1beta1SubjectAccessReviewStatus';

/**
* SubjectAccessReview checks whether or not a user or group can perform an action.
*/
export class V1beta1SubjectAccessReview {
    /**
    * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/api-conventions.md#resources
    */
    'apiVersion'?: string;
    /**
    * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/api-conventions.md#types-kinds
    */
    'kind'?: string;
    'metadata'?: V1ObjectMeta;
    'spec': V1beta1SubjectAccessReviewSpec;
    'status'?: V1beta1SubjectAccessReviewStatus;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "kind",
            "baseName": "kind",
            "type": "string"
        },
        {
            "name": "metadata",
            "baseName": "metadata",
            "type": "V1ObjectMeta"
        },
        {
            "name": "spec",
            "baseName": "spec",
            "type": "V1beta1SubjectAccessReviewSpec"
        },
        {
            "name": "status",
            "baseName": "status",
            "type": "V1beta1SubjectAccessReviewStatus"
        }    ];

    static getAttributeTypeMap() {
        return V1beta1SubjectAccessReview.attributeTypeMap;
    }
}

