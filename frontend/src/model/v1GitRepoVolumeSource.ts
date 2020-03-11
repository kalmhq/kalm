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


/**
* Represents a volume that is populated with the contents of a git repository. Git repo volumes do not support ownership management. Git repo volumes support SELinux relabeling.  DEPRECATED: GitRepo is deprecated. To provision a container with a git repo, mount an EmptyDir into an InitContainer that clones the repo using git, then mount the EmptyDir into the Pod\'s container.
*/
export class V1GitRepoVolumeSource {
    /**
    * Target directory name. Must not contain or start with \'..\'.  If \'.\' is supplied, the volume directory will be the git repository.  Otherwise, if specified, the volume will contain the git repository in the subdirectory with the given name.
    */
    'directory'?: string;
    /**
    * Repository URL
    */
    'repository': string;
    /**
    * Commit hash for the specified revision.
    */
    'revision'?: string;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "directory",
            "baseName": "directory",
            "type": "string"
        },
        {
            "name": "repository",
            "baseName": "repository",
            "type": "string"
        },
        {
            "name": "revision",
            "baseName": "revision",
            "type": "string"
        }    ];

    static getAttributeTypeMap() {
        return V1GitRepoVolumeSource.attributeTypeMap;
    }
}

