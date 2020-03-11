/**
 * Kapp Models
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { V1ObjectMeta } from '../model/models';
import { V1alpha1DependencySpec } from './v1alpha1DependencySpec';
import { V1alpha1DependencyStatus } from './v1alpha1DependencyStatus';

/**
* Dependency is the Schema for the dependencies API
*/
export class V1alpha1Dependency {
    /**
    * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
    */
    'apiVersion'?: string;
    /**
    * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
    */
    'kind'?: string;
    'metadata'?: V1ObjectMeta;
    'spec'?: V1alpha1DependencySpec;
    'status'?: V1alpha1DependencyStatus;

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
            "type": "object"
        },
        {
            "name": "spec",
            "baseName": "spec",
            "type": "V1alpha1DependencySpec"
        },
        {
            "name": "status",
            "baseName": "status",
            "type": "V1alpha1DependencyStatus"
        }    ];

    static getAttributeTypeMap() {
        return V1alpha1Dependency.attributeTypeMap;
    }
}

