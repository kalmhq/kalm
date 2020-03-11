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

import { V1beta1ExternalDocumentation } from './v1beta1ExternalDocumentation';

/**
* JSONSchemaProps is a JSON-Schema following Specification Draft 4 (http://json-schema.org/).
*/
export class V1beta1JSONSchemaProps {
    '$ref'?: string;
    '$schema'?: string;
    /**
    * JSONSchemaPropsOrBool represents JSONSchemaProps or a boolean value. Defaults to true for the boolean property.
    */
    'additionalItems'?: object;
    /**
    * JSONSchemaPropsOrBool represents JSONSchemaProps or a boolean value. Defaults to true for the boolean property.
    */
    'additionalProperties'?: object;
    'allOf'?: Array<V1beta1JSONSchemaProps>;
    'anyOf'?: Array<V1beta1JSONSchemaProps>;
    /**
    * default is a default value for undefined object fields. Defaulting is an alpha feature under the CustomResourceDefaulting feature gate. Defaulting requires spec.preserveUnknownFields to be false.
    */
    '_default'?: object;
    'definitions'?: { [key: string]: V1beta1JSONSchemaProps; };
    'dependencies'?: { [key: string]: object; };
    'description'?: string;
    '_enum'?: Array<object>;
    /**
    * JSON represents any valid JSON value. These types are supported: bool, int64, float64, string, []interface{}, map[string]interface{} and nil.
    */
    'example'?: object;
    'exclusiveMaximum'?: boolean;
    'exclusiveMinimum'?: boolean;
    'externalDocs'?: V1beta1ExternalDocumentation;
    'format'?: string;
    'id'?: string;
    /**
    * JSONSchemaPropsOrArray represents a value that can either be a JSONSchemaProps or an array of JSONSchemaProps. Mainly here for serialization purposes.
    */
    'items'?: object;
    'maxItems'?: number;
    'maxLength'?: number;
    'maxProperties'?: number;
    'maximum'?: number;
    'minItems'?: number;
    'minLength'?: number;
    'minProperties'?: number;
    'minimum'?: number;
    'multipleOf'?: number;
    'not'?: V1beta1JSONSchemaProps;
    'nullable'?: boolean;
    'oneOf'?: Array<V1beta1JSONSchemaProps>;
    'pattern'?: string;
    'patternProperties'?: { [key: string]: V1beta1JSONSchemaProps; };
    'properties'?: { [key: string]: V1beta1JSONSchemaProps; };
    'required'?: Array<string>;
    'title'?: string;
    'type'?: string;
    'uniqueItems'?: boolean;
    /**
    * x-kubernetes-embedded-resource defines that the value is an embedded Kubernetes runtime.Object, with TypeMeta and ObjectMeta. The type must be object. It is allowed to further restrict the embedded object. kind, apiVersion and metadata are validated automatically. x-kubernetes-preserve-unknown-fields is allowed to be true, but does not have to be if the object is fully specified (up to kind, apiVersion, metadata).
    */
    'x_kubernetes_embedded_resource'?: boolean;
    /**
    * x-kubernetes-int-or-string specifies that this value is either an integer or a string. If this is true, an empty type is allowed and type as child of anyOf is permitted if following one of the following patterns:  1) anyOf:    - type: integer    - type: string 2) allOf:    - anyOf:      - type: integer      - type: string    - ... zero or more
    */
    'x_kubernetes_int_or_string'?: boolean;
    /**
    * x-kubernetes-preserve-unknown-fields stops the API server decoding step from pruning fields which are not specified in the validation schema. This affects fields recursively, but switches back to normal pruning behaviour if nested properties or additionalProperties are specified in the schema. This can either be true or undefined. False is forbidden.
    */
    'x_kubernetes_preserve_unknown_fields'?: boolean;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "$ref",
            "baseName": "$ref",
            "type": "string"
        },
        {
            "name": "$schema",
            "baseName": "$schema",
            "type": "string"
        },
        {
            "name": "additionalItems",
            "baseName": "additionalItems",
            "type": "object"
        },
        {
            "name": "additionalProperties",
            "baseName": "additionalProperties",
            "type": "object"
        },
        {
            "name": "allOf",
            "baseName": "allOf",
            "type": "Array<V1beta1JSONSchemaProps>"
        },
        {
            "name": "anyOf",
            "baseName": "anyOf",
            "type": "Array<V1beta1JSONSchemaProps>"
        },
        {
            "name": "_default",
            "baseName": "default",
            "type": "object"
        },
        {
            "name": "definitions",
            "baseName": "definitions",
            "type": "{ [key: string]: V1beta1JSONSchemaProps; }"
        },
        {
            "name": "dependencies",
            "baseName": "dependencies",
            "type": "{ [key: string]: object; }"
        },
        {
            "name": "description",
            "baseName": "description",
            "type": "string"
        },
        {
            "name": "_enum",
            "baseName": "enum",
            "type": "Array<object>"
        },
        {
            "name": "example",
            "baseName": "example",
            "type": "object"
        },
        {
            "name": "exclusiveMaximum",
            "baseName": "exclusiveMaximum",
            "type": "boolean"
        },
        {
            "name": "exclusiveMinimum",
            "baseName": "exclusiveMinimum",
            "type": "boolean"
        },
        {
            "name": "externalDocs",
            "baseName": "externalDocs",
            "type": "V1beta1ExternalDocumentation"
        },
        {
            "name": "format",
            "baseName": "format",
            "type": "string"
        },
        {
            "name": "id",
            "baseName": "id",
            "type": "string"
        },
        {
            "name": "items",
            "baseName": "items",
            "type": "object"
        },
        {
            "name": "maxItems",
            "baseName": "maxItems",
            "type": "number"
        },
        {
            "name": "maxLength",
            "baseName": "maxLength",
            "type": "number"
        },
        {
            "name": "maxProperties",
            "baseName": "maxProperties",
            "type": "number"
        },
        {
            "name": "maximum",
            "baseName": "maximum",
            "type": "number"
        },
        {
            "name": "minItems",
            "baseName": "minItems",
            "type": "number"
        },
        {
            "name": "minLength",
            "baseName": "minLength",
            "type": "number"
        },
        {
            "name": "minProperties",
            "baseName": "minProperties",
            "type": "number"
        },
        {
            "name": "minimum",
            "baseName": "minimum",
            "type": "number"
        },
        {
            "name": "multipleOf",
            "baseName": "multipleOf",
            "type": "number"
        },
        {
            "name": "not",
            "baseName": "not",
            "type": "V1beta1JSONSchemaProps"
        },
        {
            "name": "nullable",
            "baseName": "nullable",
            "type": "boolean"
        },
        {
            "name": "oneOf",
            "baseName": "oneOf",
            "type": "Array<V1beta1JSONSchemaProps>"
        },
        {
            "name": "pattern",
            "baseName": "pattern",
            "type": "string"
        },
        {
            "name": "patternProperties",
            "baseName": "patternProperties",
            "type": "{ [key: string]: V1beta1JSONSchemaProps; }"
        },
        {
            "name": "properties",
            "baseName": "properties",
            "type": "{ [key: string]: V1beta1JSONSchemaProps; }"
        },
        {
            "name": "required",
            "baseName": "required",
            "type": "Array<string>"
        },
        {
            "name": "title",
            "baseName": "title",
            "type": "string"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "string"
        },
        {
            "name": "uniqueItems",
            "baseName": "uniqueItems",
            "type": "boolean"
        },
        {
            "name": "x_kubernetes_embedded_resource",
            "baseName": "x-kubernetes-embedded-resource",
            "type": "boolean"
        },
        {
            "name": "x_kubernetes_int_or_string",
            "baseName": "x-kubernetes-int-or-string",
            "type": "boolean"
        },
        {
            "name": "x_kubernetes_preserve_unknown_fields",
            "baseName": "x-kubernetes-preserve-unknown-fields",
            "type": "boolean"
        }    ];

    static getAttributeTypeMap() {
        return V1beta1JSONSchemaProps.attributeTypeMap;
    }
}

