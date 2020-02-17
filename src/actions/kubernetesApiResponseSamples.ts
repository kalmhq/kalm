import {
  ObjectSerializer,
  V1NodeList,
  V1PersistentVolumeList
} from "../model/models";
import { V1Alpha1ComponentList } from "../kappModel/v1alpha1ComponentList";

const apiV1NodesBody = {
  kind: "NodeList",
  apiVersion: "v1",
  metadata: {
    selfLink: "/api/v1/nodes",
    resourceVersion: "33227949"
  },
  items: [
    {
      metadata: {
        name: "dns-2xvr",
        selfLink: "/api/v1/nodes/dns-2xvr",
        uid: "e8adf4f8-0164-11ea-bb4c-42010a920018",
        resourceVersion: "33227853",
        creationTimestamp: "2019-11-07T13:45:50Z",
        labels: {
          "beta.kubernetes.io/arch": "amd64",
          "beta.kubernetes.io/instance-type": "n1-standard-1",
          "beta.kubernetes.io/os": "linux",
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a",
          "kops.k8s.io/instancegroup": "dns",
          "kubernetes.io/arch": "amd64",
          "kubernetes.io/hostname": "dns-2xvr",
          "kubernetes.io/os": "linux",
          "kubernetes.io/role": "node",
          "node-role.kubernetes.io/node": ""
        },
        annotations: {
          "node.alpha.kubernetes.io/ttl": "0",
          "volumes.kubernetes.io/controller-managed-attach-detach": "true"
        }
      },
      spec: {
        podCIDR: "100.96.26.0/24",
        providerID: "gce://fiery-webbing-255306/asia-northeast1-a/dns-2xvr"
      },
      status: {
        capacity: {
          "attachable-volumes-gce-pd": "127",
          cpu: "1",
          "ephemeral-storage": "127769584Ki",
          "hugepages-2Mi": "0",
          memory: "3794356Ki",
          pods: "110"
        },
        allocatable: {
          "attachable-volumes-gce-pd": "127",
          cpu: "1",
          "ephemeral-storage": "117752448420",
          "hugepages-2Mi": "0",
          memory: "3691956Ki",
          pods: "110"
        },
        conditions: [
          {
            type: "NetworkUnavailable",
            status: "False",
            lastHeartbeatTime: "2019-11-07T13:46:09Z",
            lastTransitionTime: "2019-11-07T13:46:09Z",
            reason: "RouteCreated",
            message: "RouteController created a route"
          },
          {
            type: "MemoryPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:29Z",
            lastTransitionTime: "2019-11-07T13:45:50Z",
            reason: "KubeletHasSufficientMemory",
            message: "kubelet has sufficient memory available"
          },
          {
            type: "DiskPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:29Z",
            lastTransitionTime: "2019-11-07T13:45:50Z",
            reason: "KubeletHasNoDiskPressure",
            message: "kubelet has no disk pressure"
          },
          {
            type: "PIDPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:29Z",
            lastTransitionTime: "2019-11-07T13:45:50Z",
            reason: "KubeletHasSufficientPID",
            message: "kubelet has sufficient PID available"
          },
          {
            type: "Ready",
            status: "True",
            lastHeartbeatTime: "2020-02-16T17:52:29Z",
            lastTransitionTime: "2019-11-07T13:45:50Z",
            reason: "KubeletReady",
            message: "kubelet is posting ready status. AppArmor enabled"
          }
        ],
        addresses: [
          {
            type: "InternalIP",
            address: "10.146.0.50"
          },
          {
            type: "ExternalIP",
            address: "34.84.243.46"
          },
          {
            type: "InternalDNS",
            address:
              "dns-2xvr.asia-northeast1-a.c.fiery-webbing-255306.internal"
          },
          {
            type: "Hostname",
            address:
              "dns-2xvr.asia-northeast1-a.c.fiery-webbing-255306.internal"
          }
        ],
        daemonEndpoints: {
          kubeletEndpoint: {
            Port: 10250
          }
        },
        nodeInfo: {
          machineID: "4ffbf2c020f5ca79fdcc10f237b00022",
          systemUUID: "4FFBF2C0-20F5-CA79-FDCC-10F237B00022",
          bootID: "13aaf819-1d88-4604-be56-69d76f2098d9",
          kernelVersion: "4.4.111+",
          osImage: "Container-Optimized OS from Google",
          containerRuntimeVersion: "docker://17.3.2",
          kubeletVersion: "v1.14.6",
          kubeProxyVersion: "v1.14.6",
          operatingSystem: "linux",
          architecture: "amd64"
        },
        images: [
          {
            names: [
              "docker.elastic.co/beats/filebeat@sha256:6e28d74f50cc42b9472c6fb4daf84c0547582b222821a0b5f7a4efc2d58c8e4e",
              "docker.elastic.co/beats/filebeat:6.4.2"
            ],
            sizeBytes: 328119430
          },
          {
            names: ["protokube:1.14.0"],
            sizeBytes: 288144351
          },
          {
            names: [
              "k8s.gcr.io/kube-proxy@sha256:e5c364dc75d816132bebf2d84b35518f0661fdeae39c686d92f9e5f9a07e96b9",
              "k8s.gcr.io/kube-proxy:v1.14.6"
            ],
            sizeBytes: 82106236
          },
          {
            names: [
              "k8s.gcr.io/k8s-dns-kube-dns-amd64@sha256:618a82fa66cf0c75e4753369a6999032372be7308866fc9afb381789b1e5ad52",
              "k8s.gcr.io/k8s-dns-kube-dns-amd64:1.14.13"
            ],
            sizeBytes: 51157394
          },
          {
            names: [
              "k8s.gcr.io/k8s-dns-sidecar-amd64@sha256:cedc8fe2098dffc26d17f64061296b7aa54258a31513b6c52df271a98bb522b3",
              "k8s.gcr.io/k8s-dns-sidecar-amd64:1.14.13"
            ],
            sizeBytes: 42852039
          },
          {
            names: [
              "k8s.gcr.io/k8s-dns-dnsmasq-nanny-amd64@sha256:45df3e8e0c551bd0c79cdba48ae6677f817971dcbd1eeed7fd1f9a35118410e4",
              "k8s.gcr.io/k8s-dns-dnsmasq-nanny-amd64:1.14.13"
            ],
            sizeBytes: 41372492
          },
          {
            names: [
              "quay.io/prometheus/node-exporter@sha256:0c7dd2350bed76fce17dff8bd2a2ac599bc989c7328eb77b0751b8024cf0457d",
              "quay.io/prometheus/node-exporter:v0.15.2"
            ],
            sizeBytes: 22821162
          },
          {
            names: [
              "dannydirect/tinyproxy@sha256:0c1e9c56952955f799dabddabbd697661ab44172d334f4d27242fde4d33e8bfd",
              "dannydirect/tinyproxy:latest"
            ],
            sizeBytes: 8377361
          },
          {
            names: [
              "k8s.gcr.io/pause-amd64@sha256:163ac025575b775d1c0f9bf0bdd0f086883171eb475b5068e7defa4ca9e76516",
              "k8s.gcr.io/pause-amd64:3.0"
            ],
            sizeBytes: 746888
          }
        ]
      }
    },
    {
      metadata: {
        name: "dns-s7mj",
        selfLink: "/api/v1/nodes/dns-s7mj",
        uid: "eb5ce524-0164-11ea-bb4c-42010a920018",
        resourceVersion: "33227945",
        creationTimestamp: "2019-11-07T13:45:54Z",
        labels: {
          "beta.kubernetes.io/arch": "amd64",
          "beta.kubernetes.io/instance-type": "n1-standard-1",
          "beta.kubernetes.io/os": "linux",
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a",
          "kops.k8s.io/instancegroup": "dns",
          "kubernetes.io/arch": "amd64",
          "kubernetes.io/hostname": "dns-s7mj",
          "kubernetes.io/os": "linux",
          "kubernetes.io/role": "node",
          "node-role.kubernetes.io/node": ""
        },
        annotations: {
          "node.alpha.kubernetes.io/ttl": "0",
          "volumes.kubernetes.io/controller-managed-attach-detach": "true"
        }
      },
      spec: {
        podCIDR: "100.96.27.0/24",
        providerID: "gce://fiery-webbing-255306/asia-northeast1-a/dns-s7mj"
      },
      status: {
        capacity: {
          "attachable-volumes-gce-pd": "127",
          cpu: "1",
          "ephemeral-storage": "127769584Ki",
          "hugepages-2Mi": "0",
          memory: "3794356Ki",
          pods: "110"
        },
        allocatable: {
          "attachable-volumes-gce-pd": "127",
          cpu: "1",
          "ephemeral-storage": "117752448420",
          "hugepages-2Mi": "0",
          memory: "3691956Ki",
          pods: "110"
        },
        conditions: [
          {
            type: "NetworkUnavailable",
            status: "False",
            lastHeartbeatTime: "2019-11-07T13:46:03Z",
            lastTransitionTime: "2019-11-07T13:46:03Z",
            reason: "RouteCreated",
            message: "RouteController created a route"
          },
          {
            type: "MemoryPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:56Z",
            lastTransitionTime: "2019-11-07T13:45:54Z",
            reason: "KubeletHasSufficientMemory",
            message: "kubelet has sufficient memory available"
          },
          {
            type: "DiskPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:56Z",
            lastTransitionTime: "2019-11-07T13:45:54Z",
            reason: "KubeletHasNoDiskPressure",
            message: "kubelet has no disk pressure"
          },
          {
            type: "PIDPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:56Z",
            lastTransitionTime: "2019-11-07T13:45:54Z",
            reason: "KubeletHasSufficientPID",
            message: "kubelet has sufficient PID available"
          },
          {
            type: "Ready",
            status: "True",
            lastHeartbeatTime: "2020-02-16T17:52:56Z",
            lastTransitionTime: "2019-11-07T13:45:55Z",
            reason: "KubeletReady",
            message: "kubelet is posting ready status. AppArmor enabled"
          }
        ],
        addresses: [
          {
            type: "InternalIP",
            address: "10.146.0.49"
          },
          {
            type: "ExternalIP",
            address: "35.200.46.93"
          },
          {
            type: "InternalDNS",
            address:
              "dns-s7mj.asia-northeast1-a.c.fiery-webbing-255306.internal"
          },
          {
            type: "Hostname",
            address:
              "dns-s7mj.asia-northeast1-a.c.fiery-webbing-255306.internal"
          }
        ],
        daemonEndpoints: {
          kubeletEndpoint: {
            Port: 10250
          }
        },
        nodeInfo: {
          machineID: "74d031caa11e380d3183f59b9c2c0441",
          systemUUID: "74D031CA-A11E-380D-3183-F59B9C2C0441",
          bootID: "cb4acd47-33e1-4398-9d00-f7cdfd26b08c",
          kernelVersion: "4.4.111+",
          osImage: "Container-Optimized OS from Google",
          containerRuntimeVersion: "docker://17.3.2",
          kubeletVersion: "v1.14.6",
          kubeProxyVersion: "v1.14.6",
          operatingSystem: "linux",
          architecture: "amd64"
        },
        images: [
          {
            names: [
              "docker.elastic.co/beats/filebeat@sha256:6e28d74f50cc42b9472c6fb4daf84c0547582b222821a0b5f7a4efc2d58c8e4e",
              "docker.elastic.co/beats/filebeat:6.4.2"
            ],
            sizeBytes: 328119430
          },
          {
            names: ["protokube:1.14.0"],
            sizeBytes: 288144351
          },
          {
            names: [
              "k8s.gcr.io/kube-proxy@sha256:e5c364dc75d816132bebf2d84b35518f0661fdeae39c686d92f9e5f9a07e96b9",
              "k8s.gcr.io/kube-proxy:v1.14.6"
            ],
            sizeBytes: 82106236
          },
          {
            names: [
              "k8s.gcr.io/k8s-dns-kube-dns-amd64@sha256:618a82fa66cf0c75e4753369a6999032372be7308866fc9afb381789b1e5ad52",
              "k8s.gcr.io/k8s-dns-kube-dns-amd64:1.14.13"
            ],
            sizeBytes: 51157394
          },
          {
            names: [
              "k8s.gcr.io/k8s-dns-sidecar-amd64@sha256:cedc8fe2098dffc26d17f64061296b7aa54258a31513b6c52df271a98bb522b3",
              "k8s.gcr.io/k8s-dns-sidecar-amd64:1.14.13"
            ],
            sizeBytes: 42852039
          },
          {
            names: [
              "k8s.gcr.io/k8s-dns-dnsmasq-nanny-amd64@sha256:45df3e8e0c551bd0c79cdba48ae6677f817971dcbd1eeed7fd1f9a35118410e4",
              "k8s.gcr.io/k8s-dns-dnsmasq-nanny-amd64:1.14.13"
            ],
            sizeBytes: 41372492
          },
          {
            names: [
              "quay.io/prometheus/node-exporter@sha256:0c7dd2350bed76fce17dff8bd2a2ac599bc989c7328eb77b0751b8024cf0457d",
              "quay.io/prometheus/node-exporter:v0.15.2"
            ],
            sizeBytes: 22821162
          },
          {
            names: [
              "dannydirect/tinyproxy@sha256:0c1e9c56952955f799dabddabbd697661ab44172d334f4d27242fde4d33e8bfd",
              "dannydirect/tinyproxy:latest"
            ],
            sizeBytes: 8377361
          },
          {
            names: [
              "k8s.gcr.io/pause-amd64@sha256:163ac025575b775d1c0f9bf0bdd0f086883171eb475b5068e7defa4ca9e76516",
              "k8s.gcr.io/pause-amd64:3.0"
            ],
            sizeBytes: 746888
          }
        ]
      }
    },
    {
      metadata: {
        name: "geth-mainnet-1-2bnw",
        selfLink: "/api/v1/nodes/geth-mainnet-1-2bnw",
        uid: "21d0bbc3-0156-11ea-bb4c-42010a920018",
        resourceVersion: "33227910",
        creationTimestamp: "2019-11-07T12:00:03Z",
        labels: {
          "beta.kubernetes.io/arch": "amd64",
          "beta.kubernetes.io/instance-type": "n1-standard-4",
          "beta.kubernetes.io/os": "linux",
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a",
          "kops.k8s.io/instancegroup": "geth-mainnet-1",
          "kubernetes.io/arch": "amd64",
          "kubernetes.io/hostname": "geth-mainnet-1-2bnw",
          "kubernetes.io/os": "linux",
          "kubernetes.io/role": "node",
          "node-role.kubernetes.io/node": ""
        },
        annotations: {
          "node.alpha.kubernetes.io/ttl": "0",
          "volumes.kubernetes.io/controller-managed-attach-detach": "true"
        }
      },
      spec: {
        podCIDR: "100.96.24.0/24",
        providerID:
          "gce://fiery-webbing-255306/asia-northeast1-a/geth-mainnet-1-2bnw"
      },
      status: {
        capacity: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "129900528Ki",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          memory: "15393532Ki",
          pods: "110"
        },
        allocatable: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "119716326407",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          memory: "15291132Ki",
          pods: "110"
        },
        conditions: [
          {
            type: "NetworkUnavailable",
            status: "False",
            lastHeartbeatTime: "2019-11-07T12:00:20Z",
            lastTransitionTime: "2019-11-07T12:00:20Z",
            reason: "RouteCreated",
            message: "RouteController created a route"
          },
          {
            type: "MemoryPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:46Z",
            lastTransitionTime: "2019-11-07T12:00:03Z",
            reason: "KubeletHasSufficientMemory",
            message: "kubelet has sufficient memory available"
          },
          {
            type: "DiskPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:46Z",
            lastTransitionTime: "2019-11-07T12:00:03Z",
            reason: "KubeletHasNoDiskPressure",
            message: "kubelet has no disk pressure"
          },
          {
            type: "PIDPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:46Z",
            lastTransitionTime: "2019-11-07T12:00:03Z",
            reason: "KubeletHasSufficientPID",
            message: "kubelet has sufficient PID available"
          },
          {
            type: "Ready",
            status: "True",
            lastHeartbeatTime: "2020-02-16T17:52:46Z",
            lastTransitionTime: "2019-11-07T12:00:03Z",
            reason: "KubeletReady",
            message: "kubelet is posting ready status. AppArmor enabled"
          }
        ],
        addresses: [
          {
            type: "InternalIP",
            address: "10.146.0.47"
          },
          {
            type: "ExternalIP",
            address: "35.230.246.126"
          },
          {
            type: "InternalDNS",
            address:
              "geth-mainnet-1-2bnw.asia-northeast1-a.c.fiery-webbing-255306.internal"
          },
          {
            type: "Hostname",
            address:
              "geth-mainnet-1-2bnw.asia-northeast1-a.c.fiery-webbing-255306.internal"
          }
        ],
        daemonEndpoints: {
          kubeletEndpoint: {
            Port: 10250
          }
        },
        nodeInfo: {
          machineID: "35c1b94665c0e0006257d45bcd0bc96b",
          systemUUID: "35C1B946-65C0-E000-6257-D45BCD0BC96B",
          bootID: "b8c12176-e88a-4ffc-b5a1-3b5723a6e047",
          kernelVersion: "4.15.0-1044-gcp",
          osImage: "Ubuntu 18.04.3 LTS",
          containerRuntimeVersion: "docker://18.6.3",
          kubeletVersion: "v1.14.6",
          kubeProxyVersion: "v1.14.6",
          operatingSystem: "linux",
          architecture: "amd64"
        },
        images: [
          {
            names: [
              "example.com/groupName/web@sha256:ca6a21dd25de9bf2e20f9006a0b382e6764c2aa475189777d5ea614c01f62f99",
              "example.com/groupName/web:master"
            ],
            sizeBytes: 1653061760
          },
          {
            names: [
              "registry.example.io/example/aweber-service@sha256:c0c58fe5639a4e2cca344b19e2ca5f4dff5b66d8a93b2dce3fa842aae4ba9110",
              "registry.example.io/example/aweber-service:1dceb31d30706dd6a0b88be59a263a589e42501b"
            ],
            sizeBytes: 883200625
          },
          {
            names: [
              "gcr.io/google-containers/toolbox@sha256:4de42fa6aa0b8b85fa9839ca2eba4457335fa3840007cd2b72e5869c2af87d35",
              "gcr.io/google-containers/toolbox:latest"
            ],
            sizeBytes: 779635310
          },
          {
            names: [
              "docker.elastic.co/beats/filebeat@sha256:6e28d74f50cc42b9472c6fb4daf84c0547582b222821a0b5f7a4efc2d58c8e4e",
              "docker.elastic.co/beats/filebeat:6.4.2"
            ],
            sizeBytes: 328119430
          },
          {
            names: ["protokube:1.14.0"],
            sizeBytes: 288144351
          },
          {
            names: [
              "solsson/kafka@sha256:7fdb326994bcde133c777d888d06863b7c1a0e80f043582816715d76643ab789"
            ],
            sizeBytes: 274221668
          },
          {
            names: [
              "solsson/kafka-initutils@sha256:18bf01c2c756b550103a99b3c14f741acccea106072cd37155c6d24be4edd6e2"
            ],
            sizeBytes: 142889574
          },
          {
            names: [
              "kong@sha256:5ca1f841ec88cc18ac955c0d834f6523847e04f3756ba207ec037be0a1e18161",
              "kong:0.14"
            ],
            sizeBytes: 92327668
          },
          {
            names: [
              "k8s.gcr.io/kube-proxy@sha256:e5c364dc75d816132bebf2d84b35518f0661fdeae39c686d92f9e5f9a07e96b9",
              "k8s.gcr.io/kube-proxy:v1.14.6"
            ],
            sizeBytes: 82106236
          },
          {
            names: [
              "example.com/groupName/engine@sha256:133e3b188c2c0045244772c12d7ab557277dfb8e10ba03bd7ecc8ac9dd7bbf7e",
              "example.com/groupName/engine:master"
            ],
            sizeBytes: 77512808
          },
          {
            names: [
              "k8s.gcr.io/k8s-dns-kube-dns-amd64@sha256:618a82fa66cf0c75e4753369a6999032372be7308866fc9afb381789b1e5ad52",
              "k8s.gcr.io/k8s-dns-kube-dns-amd64:1.14.13"
            ],
            sizeBytes: 51157394
          },
          {
            names: [
              "ethereum/client-go@sha256:105ad63172fdf5dbf4209e9b8b419819346257415dfbfdb3c68a777331e09712",
              "ethereum/client-go:v1.9.7"
            ],
            sizeBytes: 47548767
          },
          {
            names: [
              "ethereum/client-go@sha256:860a4c7de3a565dfc21b7076791f9c857e43fadb43add3a8c222f80bd38f2dc0",
              "ethereum/client-go:v1.9.6"
            ],
            sizeBytes: 47533031
          },
          {
            names: [
              "diveinto/kapp@sha256:899912869174d287339002f2653fe47aa1e21d6ce2b007ee953db6dbfd10481a",
              "diveinto/kapp:latest"
            ],
            sizeBytes: 43108883
          },
          {
            names: [
              "k8s.gcr.io/k8s-dns-sidecar-amd64@sha256:cedc8fe2098dffc26d17f64061296b7aa54258a31513b6c52df271a98bb522b3",
              "k8s.gcr.io/k8s-dns-sidecar-amd64:1.14.13"
            ],
            sizeBytes: 42852039
          },
          {
            names: [
              "ethereum/client-go@sha256:70006bbda458df5145f2b441cd790c36e90c467ec6a50005415a78d68ed5ca3e",
              "ethereum/client-go:v1.9.10"
            ],
            sizeBytes: 41519374
          },
          {
            names: [
              "k8s.gcr.io/k8s-dns-dnsmasq-nanny-amd64@sha256:45df3e8e0c551bd0c79cdba48ae6677f817971dcbd1eeed7fd1f9a35118410e4",
              "k8s.gcr.io/k8s-dns-dnsmasq-nanny-amd64:1.14.13"
            ],
            sizeBytes: 41372492
          },
          {
            names: [
              "gcr.io/kubebuilder/kube-rbac-proxy@sha256:6c915d948d4781d366300d6e75d67a7830a941f078319f0fecc21c7744053eff",
              "gcr.io/kubebuilder/kube-rbac-proxy:v0.4.1"
            ],
            sizeBytes: 41317870
          },
          {
            names: [
              "ethereum/client-go@sha256:d8766a02fe8de831f1815ed4230c8cb85a42275979724763b453a69bd17922fb",
              "ethereum/client-go:v1.9.9"
            ],
            sizeBytes: 41277663
          },
          {
            names: [
              "kubernetesui/metrics-scraper@sha256:35fcae4fd9232a541a8cb08f2853117ba7231750b75c2cb3b6a58a2aaa57f878",
              "kubernetesui/metrics-scraper:v1.0.1"
            ],
            sizeBytes: 40101504
          },
          {
            names: [
              "quay.io/coreos/etcd@sha256:4c7a42533605b66c9f9a28b5476d31de1b80a98a694dca62de2a75b945a6dbc3",
              "quay.io/coreos/etcd:v3.3.3"
            ],
            sizeBytes: 39449756
          },
          {
            names: [
              "quay.io/prometheus/node-exporter@sha256:0c7dd2350bed76fce17dff8bd2a2ac599bc989c7328eb77b0751b8024cf0457d",
              "quay.io/prometheus/node-exporter:v0.15.2"
            ],
            sizeBytes: 22821162
          },
          {
            names: [
              "dannydirect/tinyproxy@sha256:0c1e9c56952955f799dabddabbd697661ab44172d334f4d27242fde4d33e8bfd",
              "dannydirect/tinyproxy:latest"
            ],
            sizeBytes: 8377361
          },
          {
            names: [
              "alpine@sha256:ab00606a42621fb68f2ed6ad3c88be54397f981a7b70a79db3d1172b11c4367d",
              "alpine:3"
            ],
            sizeBytes: 5591300
          },
          {
            names: [
              "k8s.gcr.io/pause-amd64@sha256:163ac025575b775d1c0f9bf0bdd0f086883171eb475b5068e7defa4ca9e76516",
              "k8s.gcr.io/pause-amd64:3.0"
            ],
            sizeBytes: 746888
          }
        ],
        volumesInUse: [
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-4dbedcc9-ebf3-11e9-9910-42010a92000c"
        ],
        volumesAttached: [
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-4dbedcc9-ebf3-11e9-9910-42010a92000c",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-4dbedcc9-ebf3-11e9-9910-42010a92000c"
          }
        ]
      }
    },
    {
      metadata: {
        name: "geth-mainnet-2-kpqn",
        selfLink: "/api/v1/nodes/geth-mainnet-2-kpqn",
        uid: "e4dbb4d4-ee86-11e9-bb4c-42010a920018",
        resourceVersion: "33227894",
        creationTimestamp: "2019-10-14T13:31:14Z",
        labels: {
          "beta.kubernetes.io/arch": "amd64",
          "beta.kubernetes.io/instance-type": "n1-standard-4",
          "beta.kubernetes.io/os": "linux",
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a",
          "kops.k8s.io/instancegroup": "geth-mainnet-2",
          "kubernetes.io/arch": "amd64",
          "kubernetes.io/hostname": "geth-mainnet-2-kpqn",
          "kubernetes.io/os": "linux",
          "kubernetes.io/role": "node",
          "node-role.kubernetes.io/node": ""
        },
        annotations: {
          "node.alpha.kubernetes.io/ttl": "0",
          "volumes.kubernetes.io/controller-managed-attach-detach": "true"
        }
      },
      spec: {
        podCIDR: "100.96.1.0/24",
        providerID:
          "gce://fiery-webbing-255306/asia-northeast1-a/geth-mainnet-2-kpqn"
      },
      status: {
        capacity: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "127769584Ki",
          "hugepages-2Mi": "0",
          memory: "15406012Ki",
          pods: "110"
        },
        allocatable: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "117752448420",
          "hugepages-2Mi": "0",
          memory: "15303612Ki",
          pods: "110"
        },
        conditions: [
          {
            type: "NetworkUnavailable",
            status: "False",
            lastHeartbeatTime: "2019-10-14T13:31:33Z",
            lastTransitionTime: "2019-10-14T13:31:33Z",
            reason: "RouteCreated",
            message: "RouteController created a route"
          },
          {
            type: "MemoryPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:42Z",
            lastTransitionTime: "2020-02-16T16:31:22Z",
            reason: "KubeletHasSufficientMemory",
            message: "kubelet has sufficient memory available"
          },
          {
            type: "DiskPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:42Z",
            lastTransitionTime: "2020-02-16T16:31:22Z",
            reason: "KubeletHasNoDiskPressure",
            message: "kubelet has no disk pressure"
          },
          {
            type: "PIDPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:42Z",
            lastTransitionTime: "2020-02-16T16:31:22Z",
            reason: "KubeletHasSufficientPID",
            message: "kubelet has sufficient PID available"
          },
          {
            type: "Ready",
            status: "True",
            lastHeartbeatTime: "2020-02-16T17:52:42Z",
            lastTransitionTime: "2020-02-16T16:31:22Z",
            reason: "KubeletReady",
            message: "kubelet is posting ready status. AppArmor enabled"
          }
        ],
        addresses: [
          {
            type: "InternalIP",
            address: "10.146.0.25"
          },
          {
            type: "ExternalIP",
            address: "35.243.127.163"
          },
          {
            type: "InternalDNS",
            address:
              "geth-mainnet-2-kpqn.asia-northeast1-a.c.fiery-webbing-255306.internal"
          },
          {
            type: "Hostname",
            address:
              "geth-mainnet-2-kpqn.asia-northeast1-a.c.fiery-webbing-255306.internal"
          }
        ],
        daemonEndpoints: {
          kubeletEndpoint: {
            Port: 10250
          }
        },
        nodeInfo: {
          machineID: "cca971ff0f300daa1d44fa237f4ef1c9",
          systemUUID: "CCA971FF-0F30-0DAA-1D44-FA237F4EF1C9",
          bootID: "04d9b198-1064-48a2-9d74-67741b9917f3",
          kernelVersion: "4.4.111+",
          osImage: "Container-Optimized OS from Google",
          containerRuntimeVersion: "docker://17.3.2",
          kubeletVersion: "v1.14.6",
          kubeProxyVersion: "v1.14.6",
          operatingSystem: "linux",
          architecture: "amd64"
        },
        images: [
          {
            names: [
              "registry.example.io/example/dae@sha256:81a335b209bdd66e053d076b311a9a1d5eadf00412d1c388d52419668ba1ae50",
              "registry.example.io/example/dae:latest"
            ],
            sizeBytes: 1115932222
          },
          {
            names: [
              "registry.example.io/example/dae@sha256:49f3fec9ae5b3dffa6fda8a3344135d82c4e486e0a2e587eb736b748c23b40a3"
            ],
            sizeBytes: 1115637953
          },
          {
            names: [
              "example.com/groupName/admin@sha256:4d4187211f7ef3d733d97d989577551e9928aa4bcd3b401fbc5bb4800d2e9cdd",
              "example.com/groupName/admin:master"
            ],
            sizeBytes: 1096237925
          },
          {
            names: [
              "example.com/groupName/ws@sha256:ce5db930bc89e306f41013b18e9d6f1899e3b9ac82943062d183b6123eb19abe",
              "example.com/groupName/ws:master"
            ],
            sizeBytes: 989174948
          },
          {
            names: [
              "spotify/kafka@sha256:cf8f8f760b48a07fb99df24fab8201ec8b647634751e842b67103a25a388981b",
              "spotify/kafka:latest"
            ],
            sizeBytes: 442613052
          },
          {
            names: [
              "docker.elastic.co/beats/filebeat@sha256:6e28d74f50cc42b9472c6fb4daf84c0547582b222821a0b5f7a4efc2d58c8e4e",
              "docker.elastic.co/beats/filebeat:6.4.2"
            ],
            sizeBytes: 328119430
          },
          {
            names: ["protokube:1.14.0"],
            sizeBytes: 288144351
          },
          {
            names: [
              "solsson/kafka@sha256:7fdb326994bcde133c777d888d06863b7c1a0e80f043582816715d76643ab789"
            ],
            sizeBytes: 274221668
          },
          {
            names: [
              "postgres@sha256:686fc517b2b979f972aa2cdbdb4e3392f28b7d6e6dc31054c05144863e6d9098",
              "postgres:12.1-alpine"
            ],
            sizeBytes: 153561941
          },
          {
            names: [
              "solsson/kafka-initutils@sha256:18bf01c2c756b550103a99b3c14f741acccea106072cd37155c6d24be4edd6e2"
            ],
            sizeBytes: 142889574
          },
          {
            names: [
              "pgbi/kong-dashboard@sha256:2cb728f4d5ec42db3f8b8cf7d54f268ce34183e96329eab21f5dec3654b48220",
              "pgbi/kong-dashboard:v3.5.0"
            ],
            sizeBytes: 96322453
          },
          {
            names: [
              "kong@sha256:5ca1f841ec88cc18ac955c0d834f6523847e04f3756ba207ec037be0a1e18161",
              "kong:0.14"
            ],
            sizeBytes: 92327668
          },
          {
            names: [
              "kubernetesui/dashboard@sha256:ae756074fa3d1b72c39aa98cfc6246c6923e7da3beaf350d80b91167be868871",
              "kubernetesui/dashboard:v2.0.0-beta5"
            ],
            sizeBytes: 91466354
          },
          {
            names: [
              "kubernetesui/dashboard@sha256:1dc220ba89df386cf8696d53093fc324a12f918b82aefb8deca3974b0b179d04",
              "kubernetesui/dashboard:v2.0.0-beta4"
            ],
            sizeBytes: 84034786
          },
          {
            names: [
              "k8s.gcr.io/kube-proxy@sha256:e5c364dc75d816132bebf2d84b35518f0661fdeae39c686d92f9e5f9a07e96b9",
              "k8s.gcr.io/kube-proxy:v1.14.6"
            ],
            sizeBytes: 82106236
          },
          {
            names: [
              "k8s.gcr.io/k8s-dns-kube-dns-amd64@sha256:618a82fa66cf0c75e4753369a6999032372be7308866fc9afb381789b1e5ad52",
              "k8s.gcr.io/k8s-dns-kube-dns-amd64:1.14.13"
            ],
            sizeBytes: 51157394
          },
          {
            names: [
              "ethereum/client-go@sha256:105ad63172fdf5dbf4209e9b8b419819346257415dfbfdb3c68a777331e09712",
              "ethereum/client-go:v1.9.7"
            ],
            sizeBytes: 47548767
          },
          {
            names: [
              "ethereum/client-go@sha256:860a4c7de3a565dfc21b7076791f9c857e43fadb43add3a8c222f80bd38f2dc0",
              "ethereum/client-go:v1.9.6"
            ],
            sizeBytes: 47533031
          },
          {
            names: [
              "k8s.gcr.io/cluster-proportional-autoscaler-amd64@sha256:12370202895b621a2ac28226292e4578598f13c1502aa4d3ee90fff4325d9275",
              "k8s.gcr.io/cluster-proportional-autoscaler-amd64:1.4.0"
            ],
            sizeBytes: 45853555
          },
          {
            names: [
              "diveinto/kapp@sha256:899912869174d287339002f2653fe47aa1e21d6ce2b007ee953db6dbfd10481a",
              "diveinto/kapp:latest"
            ],
            sizeBytes: 43108883
          },
          {
            names: [
              "k8s.gcr.io/k8s-dns-sidecar-amd64@sha256:cedc8fe2098dffc26d17f64061296b7aa54258a31513b6c52df271a98bb522b3",
              "k8s.gcr.io/k8s-dns-sidecar-amd64:1.14.13"
            ],
            sizeBytes: 42852039
          },
          {
            names: [
              "ethereum/client-go@sha256:70006bbda458df5145f2b441cd790c36e90c467ec6a50005415a78d68ed5ca3e",
              "ethereum/client-go:v1.9.10"
            ],
            sizeBytes: 41519374
          },
          {
            names: [
              "k8s.gcr.io/k8s-dns-dnsmasq-nanny-amd64@sha256:45df3e8e0c551bd0c79cdba48ae6677f817971dcbd1eeed7fd1f9a35118410e4",
              "k8s.gcr.io/k8s-dns-dnsmasq-nanny-amd64:1.14.13"
            ],
            sizeBytes: 41372492
          },
          {
            names: [
              "gcr.io/kubebuilder/kube-rbac-proxy@sha256:6c915d948d4781d366300d6e75d67a7830a941f078319f0fecc21c7744053eff",
              "gcr.io/kubebuilder/kube-rbac-proxy:v0.4.1"
            ],
            sizeBytes: 41317870
          },
          {
            names: [
              "ethereum/client-go@sha256:d8766a02fe8de831f1815ed4230c8cb85a42275979724763b453a69bd17922fb",
              "ethereum/client-go:v1.9.9"
            ],
            sizeBytes: 41277663
          },
          {
            names: [
              "k8s.gcr.io/metrics-server-amd64@sha256:edab4c64c4e29f665adaf6c0e11fe00ac9d71bb1fdce61bfa3d9e2a664331f79",
              "k8s.gcr.io/metrics-server-amd64:v0.3.5"
            ],
            sizeBytes: 39944451
          },
          {
            names: [
              "quay.io/prometheus/node-exporter@sha256:0c7dd2350bed76fce17dff8bd2a2ac599bc989c7328eb77b0751b8024cf0457d",
              "quay.io/prometheus/node-exporter:v0.15.2"
            ],
            sizeBytes: 22821162
          },
          {
            names: [
              "quay.io/gambol99/keycloak-proxy@sha256:ff7817211046f7b474fa8a07594571b3abf437f975e8be0bb28af56ded30ec46",
              "quay.io/gambol99/keycloak-proxy:latest"
            ],
            sizeBytes: 15358705
          },
          {
            names: [
              "dannydirect/tinyproxy@sha256:0c1e9c56952955f799dabddabbd697661ab44172d334f4d27242fde4d33e8bfd",
              "dannydirect/tinyproxy:latest"
            ],
            sizeBytes: 8377361
          },
          {
            names: [
              "k8s.gcr.io/pause-amd64@sha256:163ac025575b775d1c0f9bf0bdd0f086883171eb475b5068e7defa4ca9e76516",
              "k8s.gcr.io/pause-amd64:3.0"
            ],
            sizeBytes: 746888
          }
        ],
        volumesInUse: [
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-95f12f3a-ebf3-11e9-9910-42010a92000c"
        ],
        volumesAttached: [
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-95f12f3a-ebf3-11e9-9910-42010a92000c",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-95f12f3a-ebf3-11e9-9910-42010a92000c"
          }
        ]
      }
    },
    {
      metadata: {
        name: "geth-ropsten-t88j",
        selfLink: "/api/v1/nodes/geth-ropsten-t88j",
        uid: "70e57df7-0158-11ea-bb4c-42010a920018",
        resourceVersion: "33227891",
        creationTimestamp: "2019-11-07T12:16:35Z",
        labels: {
          "beta.kubernetes.io/arch": "amd64",
          "beta.kubernetes.io/instance-type": "n1-standard-4",
          "beta.kubernetes.io/os": "linux",
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a",
          "kops.k8s.io/instancegroup": "geth-ropsten",
          "kubernetes.io/arch": "amd64",
          "kubernetes.io/hostname": "geth-ropsten-t88j",
          "kubernetes.io/os": "linux",
          "kubernetes.io/role": "node",
          "node-role.kubernetes.io/node": ""
        },
        annotations: {
          "node.alpha.kubernetes.io/ttl": "0",
          "volumes.kubernetes.io/controller-managed-attach-detach": "true"
        }
      },
      spec: {
        podCIDR: "100.96.25.0/24",
        providerID:
          "gce://fiery-webbing-255306/asia-northeast1-a/geth-ropsten-t88j"
      },
      status: {
        capacity: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "129900528Ki",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          memory: "15393540Ki",
          pods: "110"
        },
        allocatable: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "119716326407",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          memory: "15291140Ki",
          pods: "110"
        },
        conditions: [
          {
            type: "NetworkUnavailable",
            status: "False",
            lastHeartbeatTime: "2019-11-07T12:16:54Z",
            lastTransitionTime: "2019-11-07T12:16:54Z",
            reason: "RouteCreated",
            message: "RouteController created a route"
          },
          {
            type: "MemoryPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:40Z",
            lastTransitionTime: "2019-11-07T12:16:35Z",
            reason: "KubeletHasSufficientMemory",
            message: "kubelet has sufficient memory available"
          },
          {
            type: "DiskPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:40Z",
            lastTransitionTime: "2019-11-07T12:16:35Z",
            reason: "KubeletHasNoDiskPressure",
            message: "kubelet has no disk pressure"
          },
          {
            type: "PIDPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:40Z",
            lastTransitionTime: "2019-11-07T12:16:35Z",
            reason: "KubeletHasSufficientPID",
            message: "kubelet has sufficient PID available"
          },
          {
            type: "Ready",
            status: "True",
            lastHeartbeatTime: "2020-02-16T17:52:40Z",
            lastTransitionTime: "2019-11-07T12:16:35Z",
            reason: "KubeletReady",
            message: "kubelet is posting ready status. AppArmor enabled"
          }
        ],
        addresses: [
          {
            type: "InternalIP",
            address: "10.146.0.48"
          },
          {
            type: "ExternalIP",
            address: "34.84.87.240"
          },
          {
            type: "InternalDNS",
            address:
              "geth-ropsten-t88j.asia-northeast1-a.c.fiery-webbing-255306.internal"
          },
          {
            type: "Hostname",
            address:
              "geth-ropsten-t88j.asia-northeast1-a.c.fiery-webbing-255306.internal"
          }
        ],
        daemonEndpoints: {
          kubeletEndpoint: {
            Port: 10250
          }
        },
        nodeInfo: {
          machineID: "5ca87f747a385d76dbcf6bb694cc2038",
          systemUUID: "5CA87F74-7A38-5D76-DBCF-6BB694CC2038",
          bootID: "ffba2377-928a-4fb9-b251-34627bad6afd",
          kernelVersion: "4.15.0-1044-gcp",
          osImage: "Ubuntu 18.04.3 LTS",
          containerRuntimeVersion: "docker://18.6.3",
          kubeletVersion: "v1.14.6",
          kubeProxyVersion: "v1.14.6",
          operatingSystem: "linux",
          architecture: "amd64"
        },
        images: [
          {
            names: [
              "docker.elastic.co/beats/filebeat@sha256:6e28d74f50cc42b9472c6fb4daf84c0547582b222821a0b5f7a4efc2d58c8e4e",
              "docker.elastic.co/beats/filebeat:6.4.2"
            ],
            sizeBytes: 328119430
          },
          {
            names: ["protokube:1.14.0"],
            sizeBytes: 288144351
          },
          {
            names: [
              "solsson/kafka@sha256:7fdb326994bcde133c777d888d06863b7c1a0e80f043582816715d76643ab789"
            ],
            sizeBytes: 274221668
          },
          {
            names: [
              "solsson/kafka-initutils@sha256:18bf01c2c756b550103a99b3c14f741acccea106072cd37155c6d24be4edd6e2"
            ],
            sizeBytes: 142889574
          },
          {
            names: [
              "redis@sha256:59b65625627b912ef8bd6024f0dc332b64137a6f3f8edd49a4df35a1cd784e7b",
              "redis:5.0.7"
            ],
            sizeBytes: 98205111
          },
          {
            names: [
              "example.com/groupName/api@sha256:edc33a742731340ecdb162bb8240cca5e5efa2807b2ba6d1a59144c56c1148cb",
              "example.com/groupName/api:master"
            ],
            sizeBytes: 92586062
          },
          {
            names: [
              "kong@sha256:5ca1f841ec88cc18ac955c0d834f6523847e04f3756ba207ec037be0a1e18161",
              "kong:0.14"
            ],
            sizeBytes: 92327668
          },
          {
            names: [
              "k8s.gcr.io/kube-proxy@sha256:e5c364dc75d816132bebf2d84b35518f0661fdeae39c686d92f9e5f9a07e96b9",
              "k8s.gcr.io/kube-proxy:v1.14.6"
            ],
            sizeBytes: 82106236
          },
          {
            names: [
              "example.com/groupName/engine@sha256:133e3b188c2c0045244772c12d7ab557277dfb8e10ba03bd7ecc8ac9dd7bbf7e",
              "example.com/groupName/engine:master"
            ],
            sizeBytes: 77512808
          },
          {
            names: [
              "ethereum/client-go@sha256:105ad63172fdf5dbf4209e9b8b419819346257415dfbfdb3c68a777331e09712",
              "ethereum/client-go:v1.9.7"
            ],
            sizeBytes: 47548767
          },
          {
            names: [
              "ethereum/client-go@sha256:860a4c7de3a565dfc21b7076791f9c857e43fadb43add3a8c222f80bd38f2dc0",
              "ethereum/client-go:v1.9.6"
            ],
            sizeBytes: 47533031
          },
          {
            names: [
              "diveinto/kapp@sha256:899912869174d287339002f2653fe47aa1e21d6ce2b007ee953db6dbfd10481a",
              "diveinto/kapp:latest"
            ],
            sizeBytes: 43108883
          },
          {
            names: [
              "diveinto/kubebuilder-example@sha256:d010e7277383253ca906ac6c9cad1b3dcb92c2b78e4a525f2aeee890d0e3f9ce",
              "diveinto/kubebuilder-example:v0.1.0"
            ],
            sizeBytes: 42964873
          },
          {
            names: [
              "gcr.io/kubebuilder/kube-rbac-proxy@sha256:6c915d948d4781d366300d6e75d67a7830a941f078319f0fecc21c7744053eff",
              "gcr.io/kubebuilder/kube-rbac-proxy:v0.4.1"
            ],
            sizeBytes: 41317870
          },
          {
            names: [
              "ethereum/client-go@sha256:d8766a02fe8de831f1815ed4230c8cb85a42275979724763b453a69bd17922fb",
              "ethereum/client-go:v1.9.9"
            ],
            sizeBytes: 41277663
          },
          {
            names: [
              "quay.io/prometheus/node-exporter@sha256:0c7dd2350bed76fce17dff8bd2a2ac599bc989c7328eb77b0751b8024cf0457d",
              "quay.io/prometheus/node-exporter:v0.15.2"
            ],
            sizeBytes: 22821162
          },
          {
            names: [
              "dannydirect/tinyproxy@sha256:0c1e9c56952955f799dabddabbd697661ab44172d334f4d27242fde4d33e8bfd",
              "dannydirect/tinyproxy:latest"
            ],
            sizeBytes: 8377361
          },
          {
            names: [
              "k8s.gcr.io/pause-amd64@sha256:163ac025575b775d1c0f9bf0bdd0f086883171eb475b5068e7defa4ca9e76516",
              "k8s.gcr.io/pause-amd64:3.0"
            ],
            sizeBytes: 746888
          }
        ],
        volumesInUse: [
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-cfc60bfb-ebf0-11e9-9910-42010a92000c"
        ],
        volumesAttached: [
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-cfc60bfb-ebf0-11e9-9910-42010a92000c",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-cfc60bfb-ebf0-11e9-9910-42010a92000c"
          }
        ]
      }
    },
    {
      metadata: {
        name: "intense-nodes-p9r5",
        selfLink: "/api/v1/nodes/intense-nodes-p9r5",
        uid: "b5291aa4-ee88-11e9-bb4c-42010a920018",
        resourceVersion: "33227925",
        creationTimestamp: "2019-10-14T13:44:13Z",
        labels: {
          "beta.kubernetes.io/arch": "amd64",
          "beta.kubernetes.io/instance-type": "n1-standard-4",
          "beta.kubernetes.io/os": "linux",
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a",
          "kops.k8s.io/instancegroup": "intense-nodes",
          "kubernetes.io/arch": "amd64",
          "kubernetes.io/hostname": "intense-nodes-p9r5",
          "kubernetes.io/os": "linux",
          "kubernetes.io/role": "node",
          "node-role.kubernetes.io/node": ""
        },
        annotations: {
          "node.alpha.kubernetes.io/ttl": "0",
          "volumes.kubernetes.io/controller-managed-attach-detach": "true"
        }
      },
      spec: {
        podCIDR: "100.96.3.0/24",
        providerID:
          "gce://fiery-webbing-255306/asia-northeast1-a/intense-nodes-p9r5"
      },
      status: {
        capacity: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "127769584Ki",
          "hugepages-2Mi": "0",
          memory: "15406012Ki",
          pods: "110"
        },
        allocatable: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "117752448420",
          "hugepages-2Mi": "0",
          memory: "15303612Ki",
          pods: "110"
        },
        conditions: [
          {
            type: "NetworkUnavailable",
            status: "False",
            lastHeartbeatTime: "2019-10-14T13:44:29Z",
            lastTransitionTime: "2019-10-14T13:44:29Z",
            reason: "RouteCreated",
            message: "RouteController created a route"
          },
          {
            type: "MemoryPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:50Z",
            lastTransitionTime: "2019-10-14T13:44:13Z",
            reason: "KubeletHasSufficientMemory",
            message: "kubelet has sufficient memory available"
          },
          {
            type: "DiskPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:50Z",
            lastTransitionTime: "2019-10-14T13:44:13Z",
            reason: "KubeletHasNoDiskPressure",
            message: "kubelet has no disk pressure"
          },
          {
            type: "PIDPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:50Z",
            lastTransitionTime: "2019-10-14T13:44:13Z",
            reason: "KubeletHasSufficientPID",
            message: "kubelet has sufficient PID available"
          },
          {
            type: "Ready",
            status: "True",
            lastHeartbeatTime: "2020-02-16T17:52:50Z",
            lastTransitionTime: "2019-10-14T13:44:13Z",
            reason: "KubeletReady",
            message: "kubelet is posting ready status. AppArmor enabled"
          }
        ],
        addresses: [
          {
            type: "InternalIP",
            address: "10.146.0.27"
          },
          {
            type: "ExternalIP",
            address: "34.84.190.190"
          },
          {
            type: "InternalDNS",
            address:
              "intense-nodes-p9r5.asia-northeast1-a.c.fiery-webbing-255306.internal"
          },
          {
            type: "Hostname",
            address:
              "intense-nodes-p9r5.asia-northeast1-a.c.fiery-webbing-255306.internal"
          }
        ],
        daemonEndpoints: {
          kubeletEndpoint: {
            Port: 10250
          }
        },
        nodeInfo: {
          machineID: "344f92e635f3cfb8044ebfc9599f8145",
          systemUUID: "344F92E6-35F3-CFB8-044E-BFC9599F8145",
          bootID: "74beb59d-4772-4f59-91bb-1945eab1e752",
          kernelVersion: "4.4.111+",
          osImage: "Container-Optimized OS from Google",
          containerRuntimeVersion: "docker://17.3.2",
          kubeletVersion: "v1.14.6",
          kubeProxyVersion: "v1.14.6",
          operatingSystem: "linux",
          architecture: "amd64"
        },
        images: [
          {
            names: [
              "registry.example.io/hydro/canals@sha256:aae24094b35cb41dc704cd69069474fd415aefdad32e442d8322f51f8b1412f6"
            ],
            sizeBytes: 1077649184
          },
          {
            names: [
              "registry.example.io/hydro/canals@sha256:fdf2ed2f08d135f67a4333fc1101ee32c3aea756eca6d713b720ebc898a6e7c7"
            ],
            sizeBytes: 1077626561
          },
          {
            names: [
              "registry.example.io/hydro/canals@sha256:c510b2792cf15cfd44c9d59cb28c62f8210f58358d273fbed4b11296cd07f914"
            ],
            sizeBytes: 1077621700
          },
          {
            names: [
              "registry.example.io/hydro/canals@sha256:e0dcd98f80d31c79fc3f23f990b6e4c0848ec3b4fed32da03d250a5a1f210462"
            ],
            sizeBytes: 1077607169
          },
          {
            names: [
              "registry.example.io/hydro/canals@sha256:9b55132bc6be44135bd4f6096a0190dc40121b9d371804d3e2b74c764c58e76d"
            ],
            sizeBytes: 1077553915
          },
          {
            names: [
              "registry.example.io/hydro/canals@sha256:5d3530b0f0d9f5397a132a2e5fe5bad76ec6a0c423b80507116d512e947e1c10"
            ],
            sizeBytes: 1077550071
          },
          {
            names: [
              "registry.example.io/hydro/canals@sha256:7b1fa768515278aaeccf4020805c700f377e47d6ce6f02270a2d3a0f93158e0b",
              "registry.example.io/hydro/canals:latest"
            ],
            sizeBytes: 1071079593
          },
          {
            names: [
              "registry.example.io/hydro/canals@sha256:667b8c2ada4b6bb3967c3a44f5f09224d1fc8e5b952707258f4623adfc5f9bdc"
            ],
            sizeBytes: 1071029829
          },
          {
            names: [
              "registry.example.io/hydro/canals@sha256:8b76ad9d03966b203df0a9265ee95d0669cd590bec450d80ada768bf5a77cb9e"
            ],
            sizeBytes: 1049923829
          },
          {
            names: [
              "registry.example.io/hydro/canals@sha256:b9965e60385078f55ee176a3488bbec981484fb7285fa3b5aa7e7c2bb2dfc874"
            ],
            sizeBytes: 1049854075
          },
          {
            names: [
              "registry.example.io/hydro/canals@sha256:6ac9cffb09517dd1a2bac1f25a1aa9e8fe24d93fd1316cadeacba5f309c2c693"
            ],
            sizeBytes: 1049847928
          },
          {
            names: [
              "registry.example.io/hydro/canals@sha256:c85791720cdc8377f01d94b7d1e64cd45e4216427dd5541ad18b38e9383fefb5"
            ],
            sizeBytes: 1049838425
          },
          {
            names: [
              "registry.example.io/hydro/canals@sha256:6e73807721e3c35ce239d0a3daa4f74c9300455cc0733d8fa1fa94d6dee51be9"
            ],
            sizeBytes: 1049834568
          },
          {
            names: [
              "registry.example.io/hydro/canals@sha256:756866a4b878f0b3dceaf1bc493360315ad6014f8622bc1ee6d0af85406e5d65"
            ],
            sizeBytes: 1049831995
          },
          {
            names: [
              "registry.example.io/hydro/canals@sha256:2a2996a35cd1b6a5c9e110cbbe4cee314c959b06d82d5cec4014fdfa0115a77a",
              "registry.example.io/hydro/canals:example"
            ],
            sizeBytes: 1049567597
          },
          {
            names: [
              "registry.example.io/hydro/canals@sha256:56eb762d7d176f6419659871f2baf1dbcd974f80c2760df3ad45f7655ecb9b54",
              "registry.example.io/hydro/canals:5c21b4e2476ce343380d0e225e2e0de48fabd25e"
            ],
            sizeBytes: 1049562351
          },
          {
            names: [
              "registry.example.io/hydro/canals@sha256:ad1c28a089a09ceea2518f0e7622942121cfa896d6bb081481d7d68cd666475f"
            ],
            sizeBytes: 1049554905
          },
          {
            names: [
              "registry.example.io/hydro/canals@sha256:575e14bfc79c203c330cd79e87c8b936c10f9209db1c26b251ebc97e885420df"
            ],
            sizeBytes: 1049551678
          },
          {
            names: [
              "registry.example.io/hydro/canals@sha256:4255787fccc011c5d5a0aa9f31a41a8c075f91ef55a87042eea3574c4c198a94",
              "registry.example.io/hydro/canals:402a1f4b5a16cc014977004b1993b00e50aaf2a7"
            ],
            sizeBytes: 1049533697
          },
          {
            names: [
              "registry.example.io/hydro/canals@sha256:7ba9c42d7f78dea4c807a9ca1f23ff251b648dac10125202851ffd01c190ea8f"
            ],
            sizeBytes: 1049514774
          },
          {
            names: [
              "registry.example.io/hydro/canals@sha256:2945d1cfbf02865086059df4995f47f94557c6405ec6c7ba0f5ea665307567be"
            ],
            sizeBytes: 1049508719
          },
          {
            names: [
              "docker.elastic.co/beats/filebeat@sha256:6e28d74f50cc42b9472c6fb4daf84c0547582b222821a0b5f7a4efc2d58c8e4e",
              "docker.elastic.co/beats/filebeat:6.4.2"
            ],
            sizeBytes: 328119430
          },
          {
            names: ["protokube:1.14.0"],
            sizeBytes: 288144351
          },
          {
            names: [
              "ubuntu@sha256:6239ca16d54d8edd38788aacde7c6426e5999ffbbd7e97ac3cf04d474341d079",
              "ubuntu:16.04"
            ],
            sizeBytes: 121317192
          },
          {
            names: [
              "k8s.gcr.io/kube-proxy@sha256:e5c364dc75d816132bebf2d84b35518f0661fdeae39c686d92f9e5f9a07e96b9",
              "k8s.gcr.io/kube-proxy:v1.14.6"
            ],
            sizeBytes: 82106236
          },
          {
            names: [
              "registry.example.io/hydro/inventorymanager@sha256:25977a7692a7d73548c2ac16ed14b84ea2cf6f3c1b888c6763ffc30b0ae83bdb",
              "registry.example.io/hydro/inventorymanager:latest"
            ],
            sizeBytes: 56283479
          },
          {
            names: [
              "registry.example.io/hydro/inventorymanager@sha256:1d7e4d880d3ab6508bad78f155b7329c728b52a87c522b260d0c41e8c7e310cf"
            ],
            sizeBytes: 56275207
          },
          {
            names: [
              "registry.example.io/hydro/inventorymanager@sha256:bc6d866c52dd877e0f88461f9277d74041f79cac9e2376b6a77fdf9de8584de7"
            ],
            sizeBytes: 56270255
          },
          {
            names: [
              "registry.example.io/hydro/inventorymanager@sha256:81546fa830021c8feb0939d207d40eaf1aea9c7878c0a85724aa0bec271fd1cb"
            ],
            sizeBytes: 56229562
          },
          {
            names: [
              "registry.example.io/hydro/inventorymanager@sha256:12be25c9272f5a1e90d49b9d365411da7862ab75427b61d0bcb38c46a5844723"
            ],
            sizeBytes: 56229546
          },
          {
            names: [
              "registry.example.io/hydro/inventorymanager@sha256:efb8898d25d8017535260bf0c480f961d6dec6c0c247b2efb3446c02d0babd72"
            ],
            sizeBytes: 56225370
          },
          {
            names: [
              "registry.example.io/hydro/inventorymanager@sha256:c7939c0df3714457bd7acb8bcc995bc367861953ccb3e44c937b4f3df1a5ac1d"
            ],
            sizeBytes: 56225370
          },
          {
            names: [
              "registry.example.io/hydro/inventorymanager@sha256:1915b1383139ea087a5ae97b11d720fc145a39629fbf0a3b429412c7ea2e7976"
            ],
            sizeBytes: 41563810
          },
          {
            names: [
              "registry.example.io/hydro/inventorymanager@sha256:599dd46485a6361f92a8f3a5b15e244da1b6ce81c9d217480453bee72488d658"
            ],
            sizeBytes: 41560826
          },
          {
            names: [
              "registry.example.io/hydro/inventorymanager@sha256:fbefdd3f514aad90c5bc83a143ca68d593ea83b9e96c9be70b773fc860ce95b7"
            ],
            sizeBytes: 41560722
          },
          {
            names: [
              "registry.example.io/hydro/inventorymanager@sha256:5863618da2bc43d7f433f61cd8d774feb3b4c138c08d50b170433a12d8134fc4"
            ],
            sizeBytes: 41560714
          },
          {
            names: [
              "registry.example.io/hydro/inventorymanager@sha256:16376bedfa8bb1f6971fd39c8a0733ba272d2676ee5ac20c555afd6d03ed10bf"
            ],
            sizeBytes: 41560706
          },
          {
            names: [
              "registry.example.io/hydro/inventorymanager@sha256:7aaf02bf5ea8edefba2e8bcec8a6d6bd9e76cf0d1cfb6509bea72bb07437651d"
            ],
            sizeBytes: 41560698
          },
          {
            names: [
              "registry.example.io/hydro/inventorymanager@sha256:741d931f88a3c1a132f4337cd582a2682a5ec90adbd56c8790553e8158b84d9d"
            ],
            sizeBytes: 41560698
          },
          {
            names: [
              "registry.example.io/hydro/inventorymanager@sha256:87722945016a25c14c7ea7b8f93d8d091fe8deb63638c19a143801cf8e7a1ec0"
            ],
            sizeBytes: 41534738
          },
          {
            names: [
              "registry.example.io/hydro/inventorymanager@sha256:70088c4c8768979b773a338d0acbc4d5805082844168a7764b7928f918e74b58"
            ],
            sizeBytes: 41534730
          },
          {
            names: [
              "registry.example.io/mingda/spreadwatcher@sha256:7fd0ad7fa4f9a420c9aa1d4a26a267d8dafbbbfe2329e482367a7650895fd6f9",
              "registry.example.io/mingda/spreadwatcher:latest"
            ],
            sizeBytes: 26210174
          },
          {
            names: [
              "quay.io/prometheus/node-exporter@sha256:0c7dd2350bed76fce17dff8bd2a2ac599bc989c7328eb77b0751b8024cf0457d",
              "quay.io/prometheus/node-exporter:v0.15.2"
            ],
            sizeBytes: 22821162
          },
          {
            names: [
              "registry.example.io/hydro/goliquiditytools@sha256:5097ddb0843cdc32bb5916e81a5d3ff0325a60272cd03690293f4ed6a740a89a"
            ],
            sizeBytes: 21838871
          },
          {
            names: [
              "registry.example.io/hydro/goliquiditytools@sha256:78140439c2c481d83700a0ef8473db7cfb9c026954151a764ae7da43a13d047b"
            ],
            sizeBytes: 21838847
          },
          {
            names: [
              "registry.example.io/hydro/goliquiditytools@sha256:295d2058803f1b67652d68fc3c7e28bb944c83342907e424cd1dbc12d50a14ed"
            ],
            sizeBytes: 21814031
          },
          {
            names: [
              "registry.example.io/hydro/goliquiditytools@sha256:a03cb4601656440cc861ef3cda7a9100774dfd39eeb71543552077a49faa426a",
              "registry.example.io/hydro/goliquiditytools:example"
            ],
            sizeBytes: 21814031
          },
          {
            names: [
              "registry.example.io/hydro/goliquiditytools@sha256:d1631d4c85cb222823489c5a2ceed559847879bd91d036ae584555b3077c5704"
            ],
            sizeBytes: 21814031
          },
          {
            names: [
              "registry.example.io/hydro/goliquiditytools@sha256:07546c5aad2085f3476e06b8b6e3389eb95d897a1651fcd328bd94d3cce6b243"
            ],
            sizeBytes: 21813943
          },
          {
            names: [
              "registry.example.io/hydro/goliquiditytools@sha256:caac3b799f48576bd6fded9de909544c33f30bad950c1021de8de7eee1d6f67e"
            ],
            sizeBytes: 21813943
          }
        ]
      }
    },
    {
      metadata: {
        name: "master-asia-northeast1-a-20jp",
        selfLink: "/api/v1/nodes/master-asia-northeast1-a-20jp",
        uid: "099030fa-ee86-11e9-bb4c-42010a920018",
        resourceVersion: "33227812",
        creationTimestamp: "2019-10-14T13:25:06Z",
        labels: {
          "beta.kubernetes.io/arch": "amd64",
          "beta.kubernetes.io/instance-type": "n1-standard-1",
          "beta.kubernetes.io/os": "linux",
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a",
          "kops.k8s.io/instancegroup": "master-asia-northeast1-a",
          "kubernetes.io/arch": "amd64",
          "kubernetes.io/hostname": "master-asia-northeast1-a-20jp",
          "kubernetes.io/os": "linux",
          "kubernetes.io/role": "master",
          "node-role.kubernetes.io/master": ""
        },
        annotations: {
          "node.alpha.kubernetes.io/ttl": "0",
          "volumes.kubernetes.io/controller-managed-attach-detach": "true"
        }
      },
      spec: {
        podCIDR: "100.96.0.0/24",
        providerID:
          "gce://fiery-webbing-255306/asia-northeast1-a/master-asia-northeast1-a-20jp",
        taints: [
          {
            key: "node-role.kubernetes.io/master",
            effect: "NoSchedule"
          }
        ]
      },
      status: {
        capacity: {
          "attachable-volumes-gce-pd": "127",
          cpu: "1",
          "ephemeral-storage": "61709848Ki",
          "hugepages-2Mi": "0",
          memory: "3794356Ki",
          pods: "110"
        },
        allocatable: {
          "attachable-volumes-gce-pd": "127",
          cpu: "1",
          "ephemeral-storage": "56871795823",
          "hugepages-2Mi": "0",
          memory: "3691956Ki",
          pods: "110"
        },
        conditions: [
          {
            type: "NetworkUnavailable",
            status: "False",
            lastHeartbeatTime: "2019-10-14T13:25:56Z",
            lastTransitionTime: "2019-10-14T13:25:56Z",
            reason: "RouteCreated",
            message: "RouteController created a route"
          },
          {
            type: "MemoryPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:19Z",
            lastTransitionTime: "2019-10-14T13:25:06Z",
            reason: "KubeletHasSufficientMemory",
            message: "kubelet has sufficient memory available"
          },
          {
            type: "DiskPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:19Z",
            lastTransitionTime: "2019-10-14T13:25:06Z",
            reason: "KubeletHasNoDiskPressure",
            message: "kubelet has no disk pressure"
          },
          {
            type: "PIDPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:19Z",
            lastTransitionTime: "2019-10-14T13:25:06Z",
            reason: "KubeletHasSufficientPID",
            message: "kubelet has sufficient PID available"
          },
          {
            type: "Ready",
            status: "True",
            lastHeartbeatTime: "2020-02-16T17:52:19Z",
            lastTransitionTime: "2019-10-14T13:25:36Z",
            reason: "KubeletReady",
            message: "kubelet is posting ready status. AppArmor enabled"
          }
        ],
        addresses: [
          {
            type: "InternalIP",
            address: "10.146.0.24"
          },
          {
            type: "ExternalIP",
            address: "34.84.188.29"
          },
          {
            type: "InternalDNS",
            address:
              "master-asia-northeast1-a-20jp.asia-northeast1-a.c.fiery-webbing-255306.internal"
          },
          {
            type: "Hostname",
            address:
              "master-asia-northeast1-a-20jp.asia-northeast1-a.c.fiery-webbing-255306.internal"
          }
        ],
        daemonEndpoints: {
          kubeletEndpoint: {
            Port: 10250
          }
        },
        nodeInfo: {
          machineID: "53212b22898a2b071af054b4d2dfd6f2",
          systemUUID: "53212B22-898A-2B07-1AF0-54B4D2DFD6F2",
          bootID: "ba54f88f-dd4a-4ee5-8fac-a5df827c1c5d",
          kernelVersion: "4.4.111+",
          osImage: "Container-Optimized OS from Google",
          containerRuntimeVersion: "docker://17.3.2",
          kubeletVersion: "v1.14.6",
          kubeProxyVersion: "v1.14.6",
          operatingSystem: "linux",
          architecture: "amd64"
        },
        images: [
          {
            names: [
              "kopeio/etcd-manager@sha256:cb0ed7c56dadbc0f4cd515906d72b30094229d6e0a9fcb7aa44e23680bf9a3a8",
              "kopeio/etcd-manager:3.0.20190930"
            ],
            sizeBytes: 656348817
          },
          {
            names: ["protokube:1.14.0"],
            sizeBytes: 288144351
          },
          {
            names: [
              "k8s.gcr.io/kube-apiserver@sha256:8c43d27db9fc89f515ea35e6f7cd8cfe0429e9fc1a0cb7eda9ca9dced36675b0",
              "k8s.gcr.io/kube-apiserver:v1.14.6"
            ],
            sizeBytes: 209433406
          },
          {
            names: [
              "k8s.gcr.io/kube-controller-manager@sha256:1809ab49da73332ca9f8e46cb0a7b799375a49ed50996c579352fc6e880add95",
              "k8s.gcr.io/kube-controller-manager:v1.14.6"
            ],
            sizeBytes: 157458462
          },
          {
            names: [
              "kope/dns-controller@sha256:893d40b92ed32a8cf563d9061e29af003ccfbec42e2f3df6e584f32dae86937b",
              "kope/dns-controller:1.14.0"
            ],
            sizeBytes: 122916156
          },
          {
            names: [
              "k8s.gcr.io/kube-proxy@sha256:e5c364dc75d816132bebf2d84b35518f0661fdeae39c686d92f9e5f9a07e96b9",
              "k8s.gcr.io/kube-proxy:v1.14.6"
            ],
            sizeBytes: 82106236
          },
          {
            names: [
              "k8s.gcr.io/kube-scheduler@sha256:0147e498f115390c6276014c5ac038e1128ba1cc0d15d28c380ba5a8cab34851",
              "k8s.gcr.io/kube-scheduler:v1.14.6"
            ],
            sizeBytes: 81579742
          },
          {
            names: [
              "k8s.gcr.io/pause-amd64@sha256:163ac025575b775d1c0f9bf0bdd0f086883171eb475b5068e7defa4ca9e76516",
              "k8s.gcr.io/pause-amd64:3.0"
            ],
            sizeBytes: 746888
          }
        ]
      }
    },
    {
      metadata: {
        name: "monitoring-38lj",
        selfLink: "/api/v1/nodes/monitoring-38lj",
        uid: "e755ff6c-ee89-11e9-bb4c-42010a920018",
        resourceVersion: "33227936",
        creationTimestamp: "2019-10-14T13:52:47Z",
        labels: {
          "beta.kubernetes.io/arch": "amd64",
          "beta.kubernetes.io/instance-type": "n1-standard-4",
          "beta.kubernetes.io/os": "linux",
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a",
          "kops.k8s.io/instancegroup": "monitoring",
          "kubernetes.io/arch": "amd64",
          "kubernetes.io/hostname": "monitoring-38lj",
          "kubernetes.io/os": "linux",
          "kubernetes.io/role": "node",
          "node-role.kubernetes.io/node": ""
        },
        annotations: {
          "node.alpha.kubernetes.io/ttl": "0",
          "volumes.kubernetes.io/controller-managed-attach-detach": "true"
        }
      },
      spec: {
        podCIDR: "100.96.4.0/24",
        providerID:
          "gce://fiery-webbing-255306/asia-northeast1-a/monitoring-38lj"
      },
      status: {
        capacity: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "129900528Ki",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          memory: "15393540Ki",
          pods: "110"
        },
        allocatable: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "119716326407",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          memory: "15291140Ki",
          pods: "110"
        },
        conditions: [
          {
            type: "NetworkUnavailable",
            status: "False",
            lastHeartbeatTime: "2019-10-14T13:53:06Z",
            lastTransitionTime: "2019-10-14T13:53:06Z",
            reason: "RouteCreated",
            message: "RouteController created a route"
          },
          {
            type: "MemoryPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:54Z",
            lastTransitionTime: "2019-10-14T13:52:47Z",
            reason: "KubeletHasSufficientMemory",
            message: "kubelet has sufficient memory available"
          },
          {
            type: "DiskPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:54Z",
            lastTransitionTime: "2019-10-14T13:52:47Z",
            reason: "KubeletHasNoDiskPressure",
            message: "kubelet has no disk pressure"
          },
          {
            type: "PIDPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:54Z",
            lastTransitionTime: "2019-10-14T13:52:47Z",
            reason: "KubeletHasSufficientPID",
            message: "kubelet has sufficient PID available"
          },
          {
            type: "Ready",
            status: "True",
            lastHeartbeatTime: "2020-02-16T17:52:54Z",
            lastTransitionTime: "2019-10-14T13:52:47Z",
            reason: "KubeletReady",
            message: "kubelet is posting ready status. AppArmor enabled"
          }
        ],
        addresses: [
          {
            type: "InternalIP",
            address: "10.146.0.28"
          },
          {
            type: "ExternalIP",
            address: "34.84.19.162"
          },
          {
            type: "InternalDNS",
            address:
              "monitoring-38lj.asia-northeast1-a.c.fiery-webbing-255306.internal"
          },
          {
            type: "Hostname",
            address:
              "monitoring-38lj.asia-northeast1-a.c.fiery-webbing-255306.internal"
          }
        ],
        daemonEndpoints: {
          kubeletEndpoint: {
            Port: 10250
          }
        },
        nodeInfo: {
          machineID: "e97a3339246e4babb26eee594e3c2da0",
          systemUUID: "E97A3339-246E-4BAB-B26E-EE594E3C2DA0",
          bootID: "d4584a47-d169-4304-b72b-3d463657b300",
          kernelVersion: "4.15.0-1044-gcp",
          osImage: "Ubuntu 18.04.3 LTS",
          containerRuntimeVersion: "docker://18.6.3",
          kubeletVersion: "v1.14.6",
          kubeProxyVersion: "v1.14.6",
          operatingSystem: "linux",
          architecture: "amd64"
        },
        images: [
          {
            names: [
              "docker.elastic.co/logstash/logstash-oss@sha256:89b3bd9b975a7f62b98d27a60a089de224b2ded6c61ebbcc49fa8617308dd181",
              "docker.elastic.co/logstash/logstash-oss:6.2.2"
            ],
            sizeBytes: 702095702
          },
          {
            names: [
              "solsson/kafka-manager@sha256:28b1a0b355f3972a9e3b5ac82abcbfee9a72b66a2bfe86094f6ea2caad9ce3a7"
            ],
            sizeBytes: 338236127
          },
          {
            names: [
              "docker.elastic.co/beats/filebeat@sha256:6e28d74f50cc42b9472c6fb4daf84c0547582b222821a0b5f7a4efc2d58c8e4e",
              "docker.elastic.co/beats/filebeat:6.4.2"
            ],
            sizeBytes: 328119430
          },
          {
            names: ["protokube:1.14.0"],
            sizeBytes: 288144351
          },
          {
            names: [
              "grafana/grafana@sha256:830c3b7ee82fd9ba8ce860361a368565bdc98dd26cc8342dd1bc5ce75886f9a3",
              "grafana/grafana:latest"
            ],
            sizeBytes: 205960390
          },
          {
            names: [
              "prom/prometheus@sha256:129e16b08818a47259d972767fd834d84fb70ca11b423cc9976c9bce9b40c58f",
              "prom/prometheus:v2.2.1"
            ],
            sizeBytes: 113284989
          },
          {
            names: [
              "k8s.gcr.io/kube-proxy@sha256:e5c364dc75d816132bebf2d84b35518f0661fdeae39c686d92f9e5f9a07e96b9",
              "k8s.gcr.io/kube-proxy:v1.14.6"
            ],
            sizeBytes: 82106236
          },
          {
            names: [
              "k8s.gcr.io/k8s-dns-kube-dns-amd64@sha256:618a82fa66cf0c75e4753369a6999032372be7308866fc9afb381789b1e5ad52",
              "k8s.gcr.io/k8s-dns-kube-dns-amd64:1.14.13"
            ],
            sizeBytes: 51157394
          },
          {
            names: [
              "k8s.gcr.io/k8s-dns-sidecar-amd64@sha256:cedc8fe2098dffc26d17f64061296b7aa54258a31513b6c52df271a98bb522b3",
              "k8s.gcr.io/k8s-dns-sidecar-amd64:1.14.13"
            ],
            sizeBytes: 42852039
          },
          {
            names: [
              "k8s.gcr.io/k8s-dns-dnsmasq-nanny-amd64@sha256:45df3e8e0c551bd0c79cdba48ae6677f817971dcbd1eeed7fd1f9a35118410e4",
              "k8s.gcr.io/k8s-dns-dnsmasq-nanny-amd64:1.14.13"
            ],
            sizeBytes: 41372492
          },
          {
            names: [
              "prom/alertmanager@sha256:2ff45fb2704a387347aa34f154f450d4ad86a8f47bcf72437761267ebdf45efb",
              "prom/alertmanager:v0.14.0"
            ],
            sizeBytes: 31928798
          },
          {
            names: [
              "quay.io/prometheus/node-exporter@sha256:0c7dd2350bed76fce17dff8bd2a2ac599bc989c7328eb77b0751b8024cf0457d",
              "quay.io/prometheus/node-exporter:v0.15.2"
            ],
            sizeBytes: 22821162
          },
          {
            names: [
              "keycloak/keycloak-gatekeeper@sha256:388c60ca497aa5abf713c1f461f5ea641dcb9b0f1021427c75777bfddce77516",
              "keycloak/keycloak-gatekeeper:4.6.0.Final"
            ],
            sizeBytes: 16676733
          },
          {
            names: [
              "quay.io/gambol99/keycloak-proxy@sha256:ff7817211046f7b474fa8a07594571b3abf437f975e8be0bb28af56ded30ec46",
              "quay.io/gambol99/keycloak-proxy:latest"
            ],
            sizeBytes: 15358705
          },
          {
            names: [
              "registry.example.io/infrastructure/file-watcher@sha256:62b866b4b08698ff6137c136091d35dcba1ffe9a25d5da58aee5def738da6624",
              "registry.example.io/infrastructure/file-watcher:master"
            ],
            sizeBytes: 10013033
          },
          {
            names: [
              "dannydirect/tinyproxy@sha256:0c1e9c56952955f799dabddabbd697661ab44172d334f4d27242fde4d33e8bfd",
              "dannydirect/tinyproxy:latest"
            ],
            sizeBytes: 8377361
          },
          {
            names: [
              "k8s.gcr.io/pause-amd64@sha256:163ac025575b775d1c0f9bf0bdd0f086883171eb475b5068e7defa4ca9e76516",
              "k8s.gcr.io/pause-amd64:3.0"
            ],
            sizeBytes: 746888
          }
        ],
        volumesInUse: [
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-5cf8a828-ec13-11e9-9910-42010a92000c",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-902a38eb-ec18-11e9-9910-42010a92000c",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-9f5dd2ee-ec12-11e9-9910-42010a92000c",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-a002e410-ec12-11e9-9910-42010a92000c"
        ],
        volumesAttached: [
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-a002e410-ec12-11e9-9910-42010a92000c",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-a002e410-ec12-11e9-9910-42010a92000c"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-902a38eb-ec18-11e9-9910-42010a92000c",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-902a38eb-ec18-11e9-9910-42010a92000c"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-9f5dd2ee-ec12-11e9-9910-42010a92000c",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-9f5dd2ee-ec12-11e9-9910-42010a92000c"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-5cf8a828-ec13-11e9-9910-42010a92000c",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-5cf8a828-ec13-11e9-9910-42010a92000c"
          }
        ]
      }
    },
    {
      metadata: {
        name: "nodes-56ht",
        selfLink: "/api/v1/nodes/nodes-56ht",
        uid: "17ae6455-fa4b-11e9-bb4c-42010a920018",
        resourceVersion: "33227862",
        creationTimestamp: "2019-10-29T12:53:23Z",
        labels: {
          "beta.kubernetes.io/arch": "amd64",
          "beta.kubernetes.io/instance-type": "n1-standard-4",
          "beta.kubernetes.io/os": "linux",
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a",
          "kops.k8s.io/instancegroup": "nodes",
          "kubernetes.io/arch": "amd64",
          "kubernetes.io/hostname": "nodes-56ht",
          "kubernetes.io/os": "linux",
          "kubernetes.io/role": "node",
          "node-role.kubernetes.io/node": ""
        },
        annotations: {
          "node.alpha.kubernetes.io/ttl": "0",
          "volumes.kubernetes.io/controller-managed-attach-detach": "true"
        }
      },
      spec: {
        podCIDR: "100.96.21.0/24",
        providerID: "gce://fiery-webbing-255306/asia-northeast1-a/nodes-56ht"
      },
      status: {
        capacity: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "129900528Ki",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          memory: "15393540Ki",
          pods: "110"
        },
        allocatable: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "119716326407",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          memory: "15291140Ki",
          pods: "110"
        },
        conditions: [
          {
            type: "NetworkUnavailable",
            status: "False",
            lastHeartbeatTime: "2019-10-29T12:53:36Z",
            lastTransitionTime: "2019-10-29T12:53:36Z",
            reason: "RouteCreated",
            message: "RouteController created a route"
          },
          {
            type: "MemoryPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:33Z",
            lastTransitionTime: "2019-10-29T12:53:23Z",
            reason: "KubeletHasSufficientMemory",
            message: "kubelet has sufficient memory available"
          },
          {
            type: "DiskPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:33Z",
            lastTransitionTime: "2019-10-29T12:53:23Z",
            reason: "KubeletHasNoDiskPressure",
            message: "kubelet has no disk pressure"
          },
          {
            type: "PIDPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:33Z",
            lastTransitionTime: "2019-10-29T12:53:23Z",
            reason: "KubeletHasSufficientPID",
            message: "kubelet has sufficient PID available"
          },
          {
            type: "Ready",
            status: "True",
            lastHeartbeatTime: "2020-02-16T17:52:33Z",
            lastTransitionTime: "2019-10-29T12:53:23Z",
            reason: "KubeletReady",
            message: "kubelet is posting ready status. AppArmor enabled"
          }
        ],
        addresses: [
          {
            type: "InternalIP",
            address: "10.146.0.44"
          },
          {
            type: "ExternalIP",
            address: "34.84.137.196"
          },
          {
            type: "InternalDNS",
            address:
              "nodes-56ht.asia-northeast1-a.c.fiery-webbing-255306.internal"
          },
          {
            type: "Hostname",
            address:
              "nodes-56ht.asia-northeast1-a.c.fiery-webbing-255306.internal"
          }
        ],
        daemonEndpoints: {
          kubeletEndpoint: {
            Port: 10250
          }
        },
        nodeInfo: {
          machineID: "31e0e505d65d53322385565fe756d0ee",
          systemUUID: "31E0E505-D65D-5332-2385-565FE756D0EE",
          bootID: "cf5660b4-f47b-4767-a745-b586389127e1",
          kernelVersion: "4.15.0-1044-gcp",
          osImage: "Ubuntu 18.04.3 LTS",
          containerRuntimeVersion: "docker://18.6.3",
          kubeletVersion: "v1.14.6",
          kubeProxyVersion: "v1.14.6",
          operatingSystem: "linux",
          architecture: "amd64"
        },
        images: [
          {
            names: [
              "example.com/groupName/web@sha256:1219878a115fd910bff9ca805ac911c3d552fbeddf665b40978ebcf1390bd109"
            ],
            sizeBytes: 1653295835
          },
          {
            names: [
              "example.com/groupName/web@sha256:e15d4c5ee0d00c77d34b1b69f7bf28f7951c4b54850c99cf2b6e2e225f2afd00",
              "example.com/groupName/web:ddexglobale9b08be6b0cb7dc43445619ebb63bcd2b013aa57"
            ],
            sizeBytes: 1653253771
          },
          {
            names: [
              "example.com/groupName/web@sha256:558887ad18416ee668a5f3960ff5da7e0e31721dce0e7a7a03637edb29a9be25",
              "example.com/groupName/web:66a40afd68db3976980e4f99be1af70a8b794291"
            ],
            sizeBytes: 1653152392
          },
          {
            names: [
              "example.com/groupName/web@sha256:ca6a21dd25de9bf2e20f9006a0b382e6764c2aa475189777d5ea614c01f62f99",
              "example.com/groupName/web:master"
            ],
            sizeBytes: 1653061760
          },
          {
            names: [
              "example.com/groupName/web@sha256:b93f3cc9afb55e7417084ff6edb8700a7fe5ade3376b831f8a855265bf5fd189",
              "example.com/groupName/web:76000eef975a3ab0b630a99b7495d7c67eebf5dc"
            ],
            sizeBytes: 1653054491
          },
          {
            names: [
              "example.com/groupName/web@sha256:3ea2645360aad954f2b8989799f9560fa687dbeec421d53deced3c8f7c35a495",
              "example.com/groupName/web:0217387f2dfb3cc2d0b156d0290d68d6963cf329"
            ],
            sizeBytes: 1653041820
          },
          {
            names: [
              "example.com/groupName/web@sha256:ebf89c66eb6c59f39aa8e740fcd05629f3f5acc1089a6efbe4e33317e79eeb62",
              "example.com/groupName/web:83dfde8fb393e110bae4794e1037ad9cd0761e34"
            ],
            sizeBytes: 1652630795
          },
          {
            names: [
              "example.com/groupName/web@sha256:884c5e017a4fc7ff4cd98ca0f1cb7c03f77881a2d3e0504b7a0751212c64637d",
              "example.com/groupName/web:web2"
            ],
            sizeBytes: 1652549070
          },
          {
            names: [
              "example.com/groupName/web@sha256:eb5f0618ffd635424b9ae86f279dc11d636fcccaccfffd4595c22687fd4f934e"
            ],
            sizeBytes: 1652459694
          },
          {
            names: [
              "example.com/groupName/web@sha256:f77ec1e906d6226882aaa03352b4ba1e178fb223b611600cc32027afb7eb07dd"
            ],
            sizeBytes: 1652381354
          },
          {
            names: [
              "example.com/groupName/web@sha256:0cc388b2a90ca9abdbded4c0d710203d5ba2339609594188d785f821940cb186"
            ],
            sizeBytes: 1652346274
          },
          {
            names: [
              "example.com/groupName/web@sha256:9beecfdc18f58f33a42dadb01081178ac2994356606173d79de5ce0639f73b4d",
              "example.com/groupName/web:140753a75d09c64a87a362c986a5d20fb3f8052c"
            ],
            sizeBytes: 1651764243
          },
          {
            names: [
              "example.com/groupName/web@sha256:7e78d0efa8800ea63f9b13bdb7fe15fa34fb224998b0cff11f8a8a136694e5aa",
              "example.com/groupName/web:ddexglobal140753a75d09c64a87a362c986a5d20fb3f8052c"
            ],
            sizeBytes: 1651695708
          },
          {
            names: [
              "example.com/groupName/web@sha256:ce7a73f9715f49f4664c9d8c9ad11497552841fb938173483bf9fac835199d81",
              "example.com/groupName/web:b706a784bff54cec1b7fa627e6a5c0ba83cc80ef"
            ],
            sizeBytes: 1651400555
          },
          {
            names: [
              "example.com/groupName/web@sha256:efe6f6ae0591b958aa0938dd9c5f7f63da2895e7150549c7de3b56e79474a25a"
            ],
            sizeBytes: 1651394568
          },
          {
            names: [
              "example.com/groupName/web@sha256:8b80eac2f77dc4cc835b238d05fdba1b5e807866b96b84260dff4e8102eed41b",
              "example.com/groupName/web:ad1f235da7c6e856bc59b12db09583553cdd99fc"
            ],
            sizeBytes: 1651389436
          },
          {
            names: [
              "example.com/groupName/web@sha256:b70ab80674c9883ed53ccf864f7c212f86e743c700672baaf8d95b6a4b15776e",
              "example.com/groupName/web:ddexglobalb706a784bff54cec1b7fa627e6a5c0ba83cc80ef"
            ],
            sizeBytes: 1651335124
          },
          {
            names: [
              "example.com/groupName/web@sha256:9d78630f47556bd7db78db3524215ef18fae53240e0bd784c8ce5343dfcb8953",
              "example.com/groupName/web:73dfb78f8cedb4e939538f18ee6bdefc36b3ac4d"
            ],
            sizeBytes: 1650922903
          },
          {
            names: [
              "example.com/groupName/web@sha256:146c000be03a03eb68befdb029053cbc09e6f410c5d077f843e0729fcc2b1ab8",
              "example.com/groupName/web:04b56e0fa2ed74cd5bacfb1358deaa4128219689"
            ],
            sizeBytes: 1650862142
          },
          {
            names: [
              "example.com/groupName/web@sha256:66f7eaed11cbdcd5daf66711e9a47af61cf80bcb1bc9888f56b31ce16adafc3f",
              "example.com/groupName/web:6d02a9950d8e18fc8ed7a07bfabe3536c20453b4"
            ],
            sizeBytes: 1650802865
          },
          {
            names: [
              "example.com/groupName/web@sha256:bac776bba43e7f613bf5818cc5b9732d32a8a62a54806d5b0f8d0b5054258423",
              "example.com/groupName/web:ef3627e8ef56ac5ea80485014c1480e19a68ec7a"
            ],
            sizeBytes: 1650790062
          },
          {
            names: [
              "example.com/groupName/web@sha256:3f146bc446edf1f939b8c6590687f461dee0bce0eeae45c7cdcbbff0e507ffa9",
              "example.com/groupName/web:a292f257c0c9c4dc4a73824b102159b3fe5d70d2"
            ],
            sizeBytes: 1650585168
          },
          {
            names: [
              "example.com/groupName/web@sha256:80a473f42af6e04a1ee20b0392714bdee7008d9096384c34f5fb81a0a65e647c"
            ],
            sizeBytes: 1650376147
          },
          {
            names: [
              "example.com/groupName/web@sha256:ae31ab32b7f736e52b7c6398e14907ee4433a6c77f58fb091bd47d73ac7ba6c9"
            ],
            sizeBytes: 1650176539
          },
          {
            names: [
              "example.com/groupName/web@sha256:0edcb486b96a6f36f8bd6a868c3d17a3f1d995ef97a14a31c649504e75fead85",
              "example.com/groupName/web:ddexglobalabceacd2a9a28fae27e7d27cd32208e5e7b8edd1"
            ],
            sizeBytes: 1650091904
          },
          {
            names: [
              "example.com/groupName/web@sha256:edcc71ded7302a6cc9ebae6a046d5022fcc85ff02ff17ed913ae07f7b20d1421"
            ],
            sizeBytes: 1650066113
          },
          {
            names: [
              "example.com/groupName/web@sha256:aa249de15e66ee3c76a9539eadab10291773c5915796585ff36e9c836f22ea2e",
              "example.com/groupName/web:d4bbf203aeea8326e2c7163294935ada7d339e0e"
            ],
            sizeBytes: 1650027378
          },
          {
            names: [
              "example.com/groupName/web@sha256:08202498e6a8ea66c468150ad678c36290054e35b0970e0209698c2dc3753a6e"
            ],
            sizeBytes: 1649893653
          },
          {
            names: [
              "example.com/groupName/web@sha256:395bdd4a55a5fc40a8819422fbed24ce76f332cb293d18016e0e15ba08d2f5d0",
              "example.com/groupName/web:46172ab1338e9cbe5ae8fdec1b3ef98f72ccc494"
            ],
            sizeBytes: 1649706141
          },
          {
            names: [
              "example.com/groupName/web@sha256:14e42abcd9a671350b75cac84683bef894aede1668784daee4a71ef4cbedbba6",
              "example.com/groupName/web:ddexglobal46172ab1338e9cbe5ae8fdec1b3ef98f72ccc494"
            ],
            sizeBytes: 1649696066
          },
          {
            names: [
              "example.com/groupName/web@sha256:56da7e9685794eebc6ab37ada81c9a5598b65c340e2fedef98dd9dd01ce92777"
            ],
            sizeBytes: 1649500861
          },
          {
            names: [
              "example.com/groupName/web@sha256:9826f0b93eae78f4181cee6d00b79301cb3e3ce0b24d9d415193ba6a19260051"
            ],
            sizeBytes: 1648935377
          },
          {
            names: [
              "example.com/groupName/web@sha256:3458d7cb36fb6efdeab5d6c39e3fb311d632813700b153978e4071262696f005",
              "example.com/groupName/web:05f502469b4e4deabeb008fbe79a030051845c51"
            ],
            sizeBytes: 1648618706
          },
          {
            names: [
              "example.com/groupName/web@sha256:6669eff0925dcdfb31908da6cfbe0e816307baa474258f49d49c6d29a66e89e2"
            ],
            sizeBytes: 1648550840
          },
          {
            names: [
              "example.com/groupName/web@sha256:1c584d7f4a504c6a2464f0fafde1e71c3ecbc85550611f0a27d6c8bdf6e8f98d",
              "example.com/groupName/web:067ef105e81e315a1f108f75a173e996d57124cd"
            ],
            sizeBytes: 1648426474
          },
          {
            names: [
              "example.com/groupName/web@sha256:00ae7c3576ca37993f011a35c9c6abea6b75edfd19df1ebb6b24325f204ceb90"
            ],
            sizeBytes: 1648185567
          },
          {
            names: [
              "example.com/groupName/web@sha256:88c422cdd824fed6de31499c46232926fcd85e83f43f9a627460afbf3709abb2",
              "example.com/groupName/web:c4aa9cc8e33ab42ec2ca9871530146d414c3b24f"
            ],
            sizeBytes: 1647167442
          },
          {
            names: [
              "example.com/groupName/web@sha256:3d5d0d0c6d2dce4cce35fd18a11b147a5e6c72085ca7a90f2e017f9d149bbde2",
              "example.com/groupName/web:ddexglobal16380e38f3a7ae3fa1687637d793de7b597a7a89"
            ],
            sizeBytes: 1647097932
          },
          {
            names: [
              "example.com/groupName/web@sha256:cb7c212f601badcfc14a2eaa4c3024fa92c9b8faf0bb118532b6c95739147ad2",
              "example.com/groupName/web:72b877981e43d12cdb7da3491231900921c0ba09"
            ],
            sizeBytes: 1647061973
          },
          {
            names: [
              "example.com/groupName/web@sha256:b1a966a22ac51f2153d32ad12979dd4038aff761ac6645a34370f7797248ee1e",
              "example.com/groupName/web:e69149c33171613e067f35abb3a4da76393ee6a2"
            ],
            sizeBytes: 1647050423
          },
          {
            names: [
              "example.com/groupName/web@sha256:951060485ad9e9dd2727659bb53a7a9b5fe496407fe94e9c1f064f3316dd23b6",
              "example.com/groupName/web:227fd5254a41454f98871bce28d16eb5309641b5"
            ],
            sizeBytes: 1646978876
          },
          {
            names: [
              "example.com/groupName/web@sha256:6bdc774f6255d3e5d760c0094f17029c2f706b9fad61109e060a4c0fe18c0409",
              "example.com/groupName/web:fd22e235ae6a4d7e49eaeb1827ecb2ccc64110b4"
            ],
            sizeBytes: 1646955970
          },
          {
            names: [
              "example.com/groupName/web@sha256:43f1c6e9ea70eef95c31d32763a498e7343ec52c0d43fe826f0d5626acd0ca11",
              "example.com/groupName/web:b9fee363455dba921bb873b952525b75cdfb950f"
            ],
            sizeBytes: 1646766557
          },
          {
            names: [
              "example.com/groupName/web@sha256:bcf3d0ec6d9f690f47f787854ac618acc65000cd72e8e798b18e210297d8a001",
              "example.com/groupName/web:16fb58f334002083eccdc5f44460241ccc68c9ff"
            ],
            sizeBytes: 1646574080
          },
          {
            names: [
              "example.com/groupName/web@sha256:f3da696320d182374e318e48eb5b167b335a536bf2e10c64e29295cce8529c41"
            ],
            sizeBytes: 1631972570
          },
          {
            names: [
              "example.com/groupName/web@sha256:4bacc7ea6b16a2e4a4464b6bbed6730a728350668a11f320bc6d982db1a7966f",
              "example.com/groupName/web:2252988e9945907aa34ba86bb5c5fa54dad7d834"
            ],
            sizeBytes: 1631898461
          },
          {
            names: [
              "example.com/groupName/web@sha256:4bcf0a72155edbceb97873ae683fb510ab8ac28f4ce2dde9d401b61594b2b9bf",
              "example.com/groupName/web:ddexglobal0cd3126f1e372beaee276fefee8b89882358743f"
            ],
            sizeBytes: 1631885039
          },
          {
            names: [
              "example.com/groupName/web@sha256:2feb62b39a74ec34bc0c9123ad45c0b8c1302903e8d50d98b27133d9198654f8",
              "example.com/groupName/web:62fa1d0fdac68614c5494e7e8befd4dd6a2ada07"
            ],
            sizeBytes: 1631647987
          },
          {
            names: [
              "example.com/groupName/web@sha256:82f8de7f38bf57c0f101cb52b0276784b648eb76ed0fa9d86ad562f5c36f6901"
            ],
            sizeBytes: 1631462913
          },
          {
            names: [
              "example.com/groupName/web@sha256:f05dbfa6ebfd0b6210d0f1731dc035c3d3e1025555b6c6cf64bbec9abf97e4b4"
            ],
            sizeBytes: 1631270727
          }
        ],
        volumesInUse: [
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-0668ce38-ec22-11e9-9910-42010a92000c",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-7ed977ca-fad6-11e9-bb4c-42010a920018",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-7edd74a5-fad6-11e9-bb4c-42010a920018",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-a5c0a640-ec21-11e9-9910-42010a92000c"
        ],
        volumesAttached: [
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-7edd74a5-fad6-11e9-bb4c-42010a920018",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-7edd74a5-fad6-11e9-bb4c-42010a920018"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-7ed977ca-fad6-11e9-bb4c-42010a920018",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-7ed977ca-fad6-11e9-bb4c-42010a920018"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-0668ce38-ec22-11e9-9910-42010a92000c",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-0668ce38-ec22-11e9-9910-42010a92000c"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-a5c0a640-ec21-11e9-9910-42010a92000c",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-a5c0a640-ec21-11e9-9910-42010a92000c"
          }
        ]
      }
    },
    {
      metadata: {
        name: "nodes-bxfb",
        selfLink: "/api/v1/nodes/nodes-bxfb",
        uid: "713e01a3-fa4b-11e9-bb4c-42010a920018",
        resourceVersion: "33227761",
        creationTimestamp: "2019-10-29T12:55:54Z",
        labels: {
          "beta.kubernetes.io/arch": "amd64",
          "beta.kubernetes.io/instance-type": "n1-standard-4",
          "beta.kubernetes.io/os": "linux",
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a",
          "kops.k8s.io/instancegroup": "nodes",
          "kubernetes.io/arch": "amd64",
          "kubernetes.io/hostname": "nodes-bxfb",
          "kubernetes.io/os": "linux",
          "kubernetes.io/role": "node",
          "node-role.kubernetes.io/node": ""
        },
        annotations: {
          "node.alpha.kubernetes.io/ttl": "0",
          "volumes.kubernetes.io/controller-managed-attach-detach": "true"
        }
      },
      spec: {
        podCIDR: "100.96.23.0/24",
        providerID: "gce://fiery-webbing-255306/asia-northeast1-a/nodes-bxfb"
      },
      status: {
        capacity: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "129900528Ki",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          memory: "15393540Ki",
          pods: "110"
        },
        allocatable: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "119716326407",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          memory: "15291140Ki",
          pods: "110"
        },
        conditions: [
          {
            type: "NetworkUnavailable",
            status: "False",
            lastHeartbeatTime: "2019-10-29T12:56:13Z",
            lastTransitionTime: "2019-10-29T12:56:13Z",
            reason: "RouteCreated",
            message: "RouteController created a route"
          },
          {
            type: "MemoryPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:03Z",
            lastTransitionTime: "2019-10-29T12:55:54Z",
            reason: "KubeletHasSufficientMemory",
            message: "kubelet has sufficient memory available"
          },
          {
            type: "DiskPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:03Z",
            lastTransitionTime: "2019-10-29T12:55:54Z",
            reason: "KubeletHasNoDiskPressure",
            message: "kubelet has no disk pressure"
          },
          {
            type: "PIDPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:03Z",
            lastTransitionTime: "2019-10-29T12:55:54Z",
            reason: "KubeletHasSufficientPID",
            message: "kubelet has sufficient PID available"
          },
          {
            type: "Ready",
            status: "True",
            lastHeartbeatTime: "2020-02-16T17:52:03Z",
            lastTransitionTime: "2019-10-29T12:55:54Z",
            reason: "KubeletReady",
            message: "kubelet is posting ready status. AppArmor enabled"
          }
        ],
        addresses: [
          {
            type: "InternalIP",
            address: "10.146.0.45"
          },
          {
            type: "ExternalIP",
            address: "34.84.253.115"
          },
          {
            type: "InternalDNS",
            address:
              "nodes-bxfb.asia-northeast1-a.c.fiery-webbing-255306.internal"
          },
          {
            type: "Hostname",
            address:
              "nodes-bxfb.asia-northeast1-a.c.fiery-webbing-255306.internal"
          }
        ],
        daemonEndpoints: {
          kubeletEndpoint: {
            Port: 10250
          }
        },
        nodeInfo: {
          machineID: "5ec68933216c07af23546ec50f01c548",
          systemUUID: "5EC68933-216C-07AF-2354-6EC50F01C548",
          bootID: "ab94ead9-8fe9-4daf-9464-1ce201097c2f",
          kernelVersion: "4.15.0-1044-gcp",
          osImage: "Ubuntu 18.04.3 LTS",
          containerRuntimeVersion: "docker://18.6.3",
          kubeletVersion: "v1.14.6",
          kubeProxyVersion: "v1.14.6",
          operatingSystem: "linux",
          architecture: "amd64"
        },
        images: [
          {
            names: [
              "example.com/groupName/web@sha256:73c72037fadc84bdd340e9d01cc3f3523e2c775059a8eb7b70922868cf1ab38a",
              "example.com/groupName/web:9b8ccbc6fc6854ce468a4fdcd2c8dbf1175887d2"
            ],
            sizeBytes: 1653202064
          },
          {
            names: [
              "example.com/groupName/web@sha256:558887ad18416ee668a5f3960ff5da7e0e31721dce0e7a7a03637edb29a9be25",
              "example.com/groupName/web:66a40afd68db3976980e4f99be1af70a8b794291"
            ],
            sizeBytes: 1653152392
          },
          {
            names: [
              "example.com/groupName/web@sha256:08a08ea53055d848a8dbb5a625b0173e3bf1bf349b95e552286af607a3fcfe94",
              "example.com/groupName/web:2e31df7504283da671f11b7a119f9f11b373bf2a"
            ],
            sizeBytes: 1653056244
          },
          {
            names: [
              "example.com/groupName/web@sha256:c9e0418967f807869001825b083ec7140459fe1351bb35a3f2f6037a224d887b",
              "example.com/groupName/web:f36e3636ab1529e8f2a54feb8fe80130e1d27ee7"
            ],
            sizeBytes: 1653048389
          },
          {
            names: [
              "example.com/groupName/web@sha256:3a8be2eabe4876f08e78f469d343660f86fb5dd5ddfa1288005df2b884abe4fa",
              "example.com/groupName/web:web2"
            ],
            sizeBytes: 1652655503
          },
          {
            names: [
              "example.com/groupName/web@sha256:de872c20ec5554c8e62e35ed1584dc7f57bb6ac623acac514917b85007158c7a",
              "example.com/groupName/web:18db43079af560680c01e82fe97da6923808caea"
            ],
            sizeBytes: 1652512610
          },
          {
            names: [
              "example.com/groupName/web@sha256:20fcfaf280449078a9324737f7fed1ff6c031afbc5fc758c7f7075c8be45070d",
              "example.com/groupName/web:64e654a18fd51bb225aa80153e02905e1746a127"
            ],
            sizeBytes: 1652359792
          },
          {
            names: [
              "example.com/groupName/web@sha256:ed0dab1a037019eac1e67e082966a22cb8ca207301e2c8fc03bce8a4ddc9c70e",
              "example.com/groupName/web:19794891918577d40aa2878752ffc11bfd318dc1"
            ],
            sizeBytes: 1652325324
          },
          {
            names: [
              "example.com/groupName/web@sha256:f40d1fe35b517e980816d1ee076e133a6611339cc9057a2ad6ec4e42979a7c2a",
              "example.com/groupName/web:12cea717cbb00cda7c463f8d4918c1d9076b5ba8"
            ],
            sizeBytes: 1652262084
          },
          {
            names: [
              "example.com/groupName/web@sha256:c84b274b665c4805fdbf7b5475a3559903d25f2101d653094704ab47adff3961"
            ],
            sizeBytes: 1652208215
          },
          {
            names: [
              "example.com/groupName/web@sha256:c097c68a266f970cbe6b3d2905a6c520fb2a34d401edd1b72c1f3bcd8d2c030f"
            ],
            sizeBytes: 1652141920
          },
          {
            names: [
              "example.com/groupName/web@sha256:6f6c728522c748a9cdb2b42ebdae404d6aad8a02bd924576f16c72d2d0c2e546",
              "example.com/groupName/web:e34b3b51a2a14e006fe52b3d60da589a8164a96d"
            ],
            sizeBytes: 1652126193
          },
          {
            names: [
              "example.com/groupName/web@sha256:e5c17d1d9c1dc19b5e0eac231c297db614f7960b6c9dd4efdfa608dc6b162582",
              "example.com/groupName/web:cd0d761d5f8bf4eeae9b8846b6374af607cf0893"
            ],
            sizeBytes: 1652096476
          },
          {
            names: [
              "example.com/groupName/web@sha256:0e47e3e39a9d8ff7c42708d3450ebf9f21b7c5ba6777bec2e43c1a55e1a22f3b"
            ],
            sizeBytes: 1651923379
          },
          {
            names: [
              "example.com/groupName/web@sha256:a0346c646d55056dbb4ba586d639973670e6e00369dd3418706c0574f40995fe",
              "example.com/groupName/web:8981d76cee0bdf8df3e4f1b1d7e58fc093051249"
            ],
            sizeBytes: 1651921735
          },
          {
            names: [
              "example.com/groupName/web@sha256:9b3e8ac438802eb7a62e09a021ed021fcce3ee2f3765e2a57a81a5c3b1ed29a7",
              "example.com/groupName/web:7de9958a52d475456823e521123a47cc2f0029c2"
            ],
            sizeBytes: 1651896067
          },
          {
            names: [
              "example.com/groupName/web@sha256:a64559c5586ff3d7e3de31fff1466c3703380a9b8ba82c8b9ffe94b690558580",
              "example.com/groupName/web:f51780de139c5a4c9fee91b044adef2611662671"
            ],
            sizeBytes: 1651885154
          },
          {
            names: [
              "example.com/groupName/web@sha256:c28095a1c7a375668576420c69bbbf3626b7f497b63f5e0c781fb0041ad8fb59"
            ],
            sizeBytes: 1651845342
          },
          {
            names: [
              "example.com/groupName/web@sha256:fd2c27997b134a2dced80415f5d64c8bcbc57fa2d051374f80ef90d93067ce4a"
            ],
            sizeBytes: 1651810539
          },
          {
            names: [
              "example.com/groupName/web@sha256:e429c879e10755c7fee4cfc1d217bddc534d107246eb519849e53012f7dbb464",
              "example.com/groupName/web:20c43768de46f17eb5de2433bc580e14a12f2881"
            ],
            sizeBytes: 1651768589
          },
          {
            names: [
              "example.com/groupName/web@sha256:2343ef965199f07abd2ff20323b040fbfe72958973f3e39929faad35d088a95b"
            ],
            sizeBytes: 1651594891
          },
          {
            names: [
              "example.com/groupName/web@sha256:eebea30026e2324add625ec6ec7df2f8c715fc42bc12972ec114d2c24cf32679"
            ],
            sizeBytes: 1651512385
          },
          {
            names: [
              "example.com/groupName/web@sha256:19a9e8e5de1e9539c92b0e8869bca3277b0444492a1d6dd8c3dbdc3a8924af9b",
              "example.com/groupName/web:0d1201c67d4aa6bde0dd1aa347b59109eeadd1db"
            ],
            sizeBytes: 1651503943
          },
          {
            names: [
              "example.com/groupName/web@sha256:94e773e41d01a1d9d2c8d9967ef1dc193cca1577d4433d567e21096fe1e178a2"
            ],
            sizeBytes: 1651493673
          },
          {
            names: [
              "example.com/groupName/web@sha256:3ee999609b9e0317b8d5a4a83bebe201e7d7bb29b848edda56f077b3816bf6be"
            ],
            sizeBytes: 1651455861
          },
          {
            names: [
              "example.com/groupName/web@sha256:ac632ec427d700cb35e1c51556dd9519ac5fec23683b3eb4ece15dff681fdf13"
            ],
            sizeBytes: 1651363618
          },
          {
            names: [
              "example.com/groupName/web@sha256:767e82ea91afd9121ca2e849c36537f0f83c2ad9d909d24d84741b91e534d0d3"
            ],
            sizeBytes: 1651344822
          },
          {
            names: [
              "example.com/groupName/web@sha256:e0ce81174e55f133dd46615e793ba6d86973e45458dbb93a03c81bef0efa129c",
              "example.com/groupName/web:2079eeacfaf8b23c226026130b11697b92837ef5"
            ],
            sizeBytes: 1651294116
          },
          {
            names: [
              "example.com/groupName/web@sha256:857f9f730f0959bb88af3c102bf66332a896262420943489288bb0ee1d60991b",
              "example.com/groupName/web:abceacd2a9a28fae27e7d27cd32208e5e7b8edd1"
            ],
            sizeBytes: 1651281703
          },
          {
            names: [
              "example.com/groupName/web@sha256:6a71a63fd10746a46d016940fd87283196bd0d3d02e1cdb78fd6d32a6514595d",
              "example.com/groupName/web:0e5a4ff031f9b1bd9e68ee31c9c3e0c029035e78"
            ],
            sizeBytes: 1651262669
          },
          {
            names: [
              "example.com/groupName/web@sha256:545b503ffd3d8ea08e0fd797bea5c6e127c4b3f401265e06cd6ad10432d0d4c0",
              "example.com/groupName/web:f207b792eaf288aa5ecabb3f5ba3556dd956dfe6"
            ],
            sizeBytes: 1650869920
          },
          {
            names: [
              "example.com/groupName/web@sha256:669d40ffa78ee2c59e962812185271d8fa4a8a56d84e6e604e04b906ba8af3c1",
              "example.com/groupName/web:ddexglobal6d02a9950d8e18fc8ed7a07bfabe3536c20453b4"
            ],
            sizeBytes: 1650795009
          },
          {
            names: [
              "example.com/groupName/web@sha256:2b1ba7acf6ef8f00c536eb553416487947e785d58ea967266692699d44f6f333",
              "example.com/groupName/web:d9b3ae7ace2441e556b84464167f044cc9c06b3b"
            ],
            sizeBytes: 1650738462
          },
          {
            names: [
              "example.com/groupName/web@sha256:1e470b32e2373ea1cda106778f92f89e5a6a88a5cdcf02d54974c6c1e51a44aa"
            ],
            sizeBytes: 1650533937
          },
          {
            names: [
              "example.com/groupName/web@sha256:91316dd7b5147d80393543c0283ccdf053416f1e0f163ff0fe2ddcd2bec1e355",
              "example.com/groupName/web:6fb0e3557e351f8cdd455f96d7fd4e615d9e2c1b"
            ],
            sizeBytes: 1650529594
          },
          {
            names: [
              "example.com/groupName/web@sha256:9c32e891d283e6262bc0cbc9329be5136d2733116ceb7935cbb9fd3a02485e8a",
              "example.com/groupName/web:78c22e2487c7f57a074a8c440f0c7a0765a7fea6"
            ],
            sizeBytes: 1650528757
          },
          {
            names: [
              "example.com/groupName/web@sha256:60466ab79e2dfe1da5c71b81a717d0f3d1bc91fa960ba76fc18754c0137f11b9"
            ],
            sizeBytes: 1650509470
          },
          {
            names: [
              "example.com/groupName/web@sha256:6a5d2923715640d927270c32a35e5affecc9fdbfd44d3c6ab1c066b5b6a6c887",
              "example.com/groupName/web:2647403dbb817e1d1246dd586fff284895386754"
            ],
            sizeBytes: 1650209683
          },
          {
            names: [
              "example.com/groupName/web@sha256:08202498e6a8ea66c468150ad678c36290054e35b0970e0209698c2dc3753a6e"
            ],
            sizeBytes: 1649893653
          },
          {
            names: [
              "example.com/groupName/web@sha256:d267d1249cdb19c0b7382ad22be5dd2fa6cb58778de07f92508ef203f20490b1",
              "example.com/groupName/web:9f045c912a0e8c65c3b323183dc111e0b2086a54"
            ],
            sizeBytes: 1649869339
          },
          {
            names: [
              "example.com/groupName/web@sha256:44d0e84bb62a4b0133b30a4c3c1a464fecbf273b7e8d78d84bcff202d3833575"
            ],
            sizeBytes: 1649619033
          },
          {
            names: [
              "example.com/groupName/web@sha256:c3c9a8d6e57b625302071fd3c5058a0fe983e8f9ef932c152826cf2c910e813c",
              "example.com/groupName/web:99b2e458de2198d3980f1fc02bc76a034206e05f"
            ],
            sizeBytes: 1649198189
          },
          {
            names: [
              "example.com/groupName/web@sha256:94478404a4ce300f2d764a4dea6c0ab4dffcd8b51c5cb99d121941f1f86d9166",
              "example.com/groupName/web:7e1d34cbf3b36341463ff6008a036370a6e1d82c"
            ],
            sizeBytes: 1649185209
          },
          {
            names: [
              "example.com/groupName/web@sha256:b64e4da43113d1085c4ac3d7760a3750c5ec82e1114c0f70415832e7806b886a",
              "example.com/groupName/web:d3fdc36970479e0a0988eeae5837837c05dec054"
            ],
            sizeBytes: 1649173460
          },
          {
            names: [
              "example.com/groupName/web@sha256:e970faf7e78a092c1dc0129c7d028ba3ee3500c52f4f60ff40fed612cfd3b6b0",
              "example.com/groupName/web:cf3e84efaf10e291fc3ad9de9c5ac351ce26142f"
            ],
            sizeBytes: 1649063548
          },
          {
            names: [
              "example.com/groupName/web@sha256:29c4b3e300cc2779a57ce713af2155ec9eff752f33e7c36c2ef00eb83606bf77",
              "example.com/groupName/web:dadb2a82a033522640414f8e7f218622b36a8341"
            ],
            sizeBytes: 1648481242
          },
          {
            names: [
              "example.com/groupName/web@sha256:e43d3a42b59c2d8f76151ae7357be5c01290582ffe5bfcc1526bd7cdd99b773c",
              "example.com/groupName/web:37789151a9234b791614f28445f95d30d201b3c6"
            ],
            sizeBytes: 1648083401
          },
          {
            names: [
              "example.com/groupName/web@sha256:601c180e1a4af4277ed2cc222025eefd9d4718104144b5819c2bcc88ea90ce4d",
              "example.com/groupName/web:1f34e9f4874e6798758f3890e650e355b308e84a"
            ],
            sizeBytes: 1648003815
          },
          {
            names: [
              "example.com/groupName/web@sha256:de216e43592cc1767fa12476240a8b2f650a3f2d94a76a671e52abc4de209c04",
              "example.com/groupName/web:3895d63603915bf35568d8e3992d343f0eb024a0"
            ],
            sizeBytes: 1647913482
          },
          {
            names: [
              "example.com/groupName/web@sha256:62c757645c47bc4b6dd4d0cd9463d66391c3d0f6a3344da4d29bb87f601d0330",
              "example.com/groupName/web:b4ae3f5d04bd4edab8a664ec724f8894831a92d2"
            ],
            sizeBytes: 1647817922
          }
        ],
        volumesInUse: [
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-4239f0a9-ebf7-11e9-9910-42010a92000c",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-5d97a56f-1c89-11ea-bb4c-42010a920018",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-8c70de5c-ec21-11e9-9910-42010a92000c"
        ],
        volumesAttached: [
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-4239f0a9-ebf7-11e9-9910-42010a92000c",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-4239f0a9-ebf7-11e9-9910-42010a92000c"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-8c70de5c-ec21-11e9-9910-42010a92000c",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-8c70de5c-ec21-11e9-9910-42010a92000c"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-5d97a56f-1c89-11ea-bb4c-42010a920018",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-5d97a56f-1c89-11ea-bb4c-42010a920018"
          }
        ]
      }
    },
    {
      metadata: {
        name: "nodes-c507",
        selfLink: "/api/v1/nodes/nodes-c507",
        uid: "8bf94296-f189-11e9-bb4c-42010a920018",
        resourceVersion: "33227830",
        creationTimestamp: "2019-10-18T09:27:47Z",
        labels: {
          "beta.kubernetes.io/arch": "amd64",
          "beta.kubernetes.io/instance-type": "n1-standard-4",
          "beta.kubernetes.io/os": "linux",
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a",
          "kops.k8s.io/instancegroup": "nodes",
          "kubernetes.io/arch": "amd64",
          "kubernetes.io/hostname": "nodes-c507",
          "kubernetes.io/os": "linux",
          "kubernetes.io/role": "node",
          "node-role.kubernetes.io/node": ""
        },
        annotations: {
          "node.alpha.kubernetes.io/ttl": "0",
          "volumes.kubernetes.io/controller-managed-attach-detach": "true"
        }
      },
      spec: {
        podCIDR: "100.96.17.0/24",
        providerID: "gce://fiery-webbing-255306/asia-northeast1-a/nodes-c507"
      },
      status: {
        capacity: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "129900528Ki",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          memory: "15393540Ki",
          pods: "110"
        },
        allocatable: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "119716326407",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          memory: "15291140Ki",
          pods: "110"
        },
        conditions: [
          {
            type: "NetworkUnavailable",
            status: "False",
            lastHeartbeatTime: "2019-10-18T09:28:06Z",
            lastTransitionTime: "2019-10-18T09:28:06Z",
            reason: "RouteCreated",
            message: "RouteController created a route"
          },
          {
            type: "MemoryPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:23Z",
            lastTransitionTime: "2019-10-18T09:27:47Z",
            reason: "KubeletHasSufficientMemory",
            message: "kubelet has sufficient memory available"
          },
          {
            type: "DiskPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:23Z",
            lastTransitionTime: "2019-10-18T09:27:47Z",
            reason: "KubeletHasNoDiskPressure",
            message: "kubelet has no disk pressure"
          },
          {
            type: "PIDPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:23Z",
            lastTransitionTime: "2019-10-18T09:27:47Z",
            reason: "KubeletHasSufficientPID",
            message: "kubelet has sufficient PID available"
          },
          {
            type: "Ready",
            status: "True",
            lastHeartbeatTime: "2020-02-16T17:52:23Z",
            lastTransitionTime: "2019-10-18T09:27:47Z",
            reason: "KubeletReady",
            message: "kubelet is posting ready status. AppArmor enabled"
          }
        ],
        addresses: [
          {
            type: "InternalIP",
            address: "10.146.0.40"
          },
          {
            type: "ExternalIP",
            address: "34.84.5.130"
          },
          {
            type: "InternalDNS",
            address:
              "nodes-c507.asia-northeast1-a.c.fiery-webbing-255306.internal"
          },
          {
            type: "Hostname",
            address:
              "nodes-c507.asia-northeast1-a.c.fiery-webbing-255306.internal"
          }
        ],
        daemonEndpoints: {
          kubeletEndpoint: {
            Port: 10250
          }
        },
        nodeInfo: {
          machineID: "f5ff2dfec510f0a41dc1a0167b6f4014",
          systemUUID: "F5FF2DFE-C510-F0A4-1DC1-A0167B6F4014",
          bootID: "857b3c86-9cf7-4b63-a6b6-567d3befd016",
          kernelVersion: "4.15.0-1044-gcp",
          osImage: "Ubuntu 18.04.3 LTS",
          containerRuntimeVersion: "docker://18.6.3",
          kubeletVersion: "v1.14.6",
          kubeProxyVersion: "v1.14.6",
          operatingSystem: "linux",
          architecture: "amd64"
        },
        images: [
          {
            names: [
              "example.com/groupName/web@sha256:ae415e1c3802ff184657d53bdf794615a4f405011c6519b924b8e72daf7aab80",
              "example.com/groupName/web:ddexglobal66a40afd68db3976980e4f99be1af70a8b794291"
            ],
            sizeBytes: 1653086885
          },
          {
            names: [
              "example.com/groupName/web@sha256:de872c20ec5554c8e62e35ed1584dc7f57bb6ac623acac514917b85007158c7a",
              "example.com/groupName/web:18db43079af560680c01e82fe97da6923808caea"
            ],
            sizeBytes: 1652512610
          },
          {
            names: [
              "example.com/groupName/web@sha256:4b5a7f12bc48417a8e39fae5b11fc1662ab76dbaf905ca7c9665597deb39f29e",
              "example.com/groupName/web:93ea9f71c280c8a1c59f5458479bb2b01194e1a4"
            ],
            sizeBytes: 1652475454
          },
          {
            names: [
              "example.com/groupName/web@sha256:0cc388b2a90ca9abdbded4c0d710203d5ba2339609594188d785f821940cb186",
              "example.com/groupName/web:7fc6b900f85385ac37f0b15e322c35641e8abd9b"
            ],
            sizeBytes: 1652346274
          },
          {
            names: [
              "example.com/groupName/web@sha256:5a9c29b232b403e69baaa3e2daa61c9a5927dede9bea87b20639cf3191605520",
              "example.com/groupName/web:f1c6356360c98d262b9ccb6ad369c83b15523eb4"
            ],
            sizeBytes: 1652242499
          },
          {
            names: [
              "example.com/groupName/web@sha256:f5f195ec269ed1c07b3b2807809a39a52fd2a31d66760fbbe69b195b536e8c4f",
              "example.com/groupName/web:master"
            ],
            sizeBytes: 1652224439
          },
          {
            names: [
              "example.com/groupName/web@sha256:a079024390d82568100e9e3b66942f4cbe5c8fc81c022b315e9561b3a11c1c04",
              "example.com/groupName/web:d4ac59a597124e6ad6dd9af099bc96c04e483b46"
            ],
            sizeBytes: 1652011439
          },
          {
            names: [
              "example.com/groupName/web@sha256:a0346c646d55056dbb4ba586d639973670e6e00369dd3418706c0574f40995fe",
              "example.com/groupName/web:8981d76cee0bdf8df3e4f1b1d7e58fc093051249"
            ],
            sizeBytes: 1651921735
          },
          {
            names: [
              "example.com/groupName/web@sha256:7045d1b84fbe6cd5f16b2ab492b7ce8e7bab0d92eede12f3fd92a097797871ff",
              "example.com/groupName/web:c4462b84cff67e9a165445352f902359fdcd617d"
            ],
            sizeBytes: 1651856247
          },
          {
            names: [
              "example.com/groupName/web@sha256:c5680c7db027eb42563727a101a6be04df5da5fef33277159c11ec04cb7a39fd",
              "example.com/groupName/web:1ae0c9e9e237f220337ecd2575c634f6829b1bd7"
            ],
            sizeBytes: 1651818629
          },
          {
            names: [
              "example.com/groupName/web@sha256:93b44c47e9d710a54328744d2e3dd7bb3183092ecea9cfb729b8f2a3d8ad984b"
            ],
            sizeBytes: 1651793672
          },
          {
            names: [
              "example.com/groupName/web@sha256:857f9f730f0959bb88af3c102bf66332a896262420943489288bb0ee1d60991b",
              "example.com/groupName/web:abceacd2a9a28fae27e7d27cd32208e5e7b8edd1"
            ],
            sizeBytes: 1651281703
          },
          {
            names: [
              "example.com/groupName/web@sha256:d4322d870d47e7b0ac7ef39184f0bbd906d56bfec008ae9c16ceafd9489d24ad"
            ],
            sizeBytes: 1651166149
          },
          {
            names: [
              "example.com/groupName/web@sha256:73ef6cfdcf7c26f34944bf07d73d12b7d1ea4a6551f798ac5561bfce2377f85f"
            ],
            sizeBytes: 1651023852
          },
          {
            names: [
              "example.com/groupName/web@sha256:127950edf30b3557e1bb61d656af2b38097588f1ad9632bf465f1a5cebe6a098",
              "example.com/groupName/web:ddexglobalf207b792eaf288aa5ecabb3f5ba3556dd956dfe6"
            ],
            sizeBytes: 1650849703
          },
          {
            names: [
              "example.com/groupName/web@sha256:67730bb7919351a8cdcb3941303d7fa67677f660db74ed1603811b4572b625c3",
              "example.com/groupName/web:web2"
            ],
            sizeBytes: 1650644725
          },
          {
            names: [
              "example.com/groupName/web@sha256:5c48a1edaec82dbe6fecfe2afff4aec8df0eb6196c3f412aa1ab7dd3f2c031d3"
            ],
            sizeBytes: 1650597464
          },
          {
            names: [
              "example.com/groupName/web@sha256:586efddf96e9192b7cf17b9a7aa4c7b95cd729cb290bae84046dbf43b4f760de"
            ],
            sizeBytes: 1650318306
          },
          {
            names: [
              "example.com/groupName/web@sha256:210c4bf872067f442b65ddfc46848c24128966dcec1d7a93b2e0d472e47cba05",
              "example.com/groupName/web:4afd4b0cdfc4b4abb87cefe9d78d7419ec0f6e13"
            ],
            sizeBytes: 1650211720
          },
          {
            names: [
              "example.com/groupName/web@sha256:77009c9f5b2fa0bccfa5ef2f285fafaa01144051bfe8a6d78c5d7d76ea02b8e0",
              "example.com/groupName/web:113eec48ecd39254d2e78ee9b34bd3a24f0e2d31"
            ],
            sizeBytes: 1650210009
          },
          {
            names: [
              "example.com/groupName/web@sha256:5f48e74961c51dffd892c31913e763e2ec92e93a9ae1e7ad1581b910ca3584ad"
            ],
            sizeBytes: 1650170499
          },
          {
            names: [
              "example.com/groupName/web@sha256:a14d5a8f76bf6a0b3e9faafbf599f9a8b33d838aa2e39f17bc5cca2c29d060fa",
              "example.com/groupName/web:4a62bff954b5bbe04ed1ede67d7a5eda09115c09"
            ],
            sizeBytes: 1650167648
          },
          {
            names: [
              "example.com/groupName/web@sha256:5763ea71a143147bec086192d4689062dbd78ba1180afd0509eb90ac36f13838",
              "example.com/groupName/web:30a4a8eed817502c1dd8115ee85aec57a5b22827"
            ],
            sizeBytes: 1650051583
          },
          {
            names: [
              "example.com/groupName/web@sha256:0209688f1271408d7092c532c2796f543f957b673f011633ab0ff7dcda707ad1",
              "example.com/groupName/web:b2cb2b8d46fbb79fb310e2e600a442775950f278"
            ],
            sizeBytes: 1649944977
          },
          {
            names: [
              "example.com/groupName/web@sha256:ca189723873c2092753e5db9718cedbc52ca4c0d755d3c7e96c5689e97e1f858"
            ],
            sizeBytes: 1649389336
          },
          {
            names: [
              "example.com/groupName/web@sha256:94478404a4ce300f2d764a4dea6c0ab4dffcd8b51c5cb99d121941f1f86d9166",
              "example.com/groupName/web:7e1d34cbf3b36341463ff6008a036370a6e1d82c"
            ],
            sizeBytes: 1649185209
          },
          {
            names: [
              "example.com/groupName/web@sha256:b64e4da43113d1085c4ac3d7760a3750c5ec82e1114c0f70415832e7806b886a",
              "example.com/groupName/web:d3fdc36970479e0a0988eeae5837837c05dec054"
            ],
            sizeBytes: 1649173460
          },
          {
            names: [
              "example.com/groupName/web@sha256:9b97d9e6f9bc7a9437e5abd9f964ccc2de69529fec3d55dd40aeec827f56026c"
            ],
            sizeBytes: 1649106758
          },
          {
            names: [
              "example.com/groupName/web@sha256:a2e7e9ffd6eed068a634d21f2fc601586eb93c5449da73fc9a89e64469377cf4",
              "example.com/groupName/web:29a847e1702c75e7b1a983f32b2e2970cc05afb8"
            ],
            sizeBytes: 1648705077
          },
          {
            names: [
              "example.com/groupName/web@sha256:20d886f22abcee96816f572a4345989a8581676dbfbe431c6d680334a49ec521",
              "example.com/groupName/web:a21fbf38c6b825cdcf7d9b7fa35c5d1ed12adac3"
            ],
            sizeBytes: 1648656264
          },
          {
            names: [
              "example.com/groupName/web@sha256:3458d7cb36fb6efdeab5d6c39e3fb311d632813700b153978e4071262696f005"
            ],
            sizeBytes: 1648618706
          },
          {
            names: [
              "example.com/groupName/web@sha256:41ab52664123471ca77e1b2dc84543b68ab95b523227e422be50c8afb183ed5c",
              "example.com/groupName/web:521441e8367f985a38030aece8a04f6f12cae863"
            ],
            sizeBytes: 1648609299
          },
          {
            names: [
              "example.com/groupName/web@sha256:29c4b3e300cc2779a57ce713af2155ec9eff752f33e7c36c2ef00eb83606bf77"
            ],
            sizeBytes: 1648481242
          },
          {
            names: [
              "example.com/groupName/web@sha256:1c584d7f4a504c6a2464f0fafde1e71c3ecbc85550611f0a27d6c8bdf6e8f98d",
              "example.com/groupName/web:067ef105e81e315a1f108f75a173e996d57124cd"
            ],
            sizeBytes: 1648426474
          },
          {
            names: [
              "example.com/groupName/web@sha256:e61a5cb98f7cded582b801135b75fd06b9ff1a55d14f8e4df3c218915636fb6c",
              "example.com/groupName/web:ddexglobalb5371677a61ae5486e6b7d4ca60c9ff948ebe5b4"
            ],
            sizeBytes: 1648423971
          },
          {
            names: [
              "example.com/groupName/web@sha256:c01f61c47aaebdfc5e15e8ba794ee92b661155951224b03039c2a5d4d267e104",
              "example.com/groupName/web:4ead57489d39859315a8a3fceef8a1290db6bdf6"
            ],
            sizeBytes: 1648229004
          },
          {
            names: [
              "example.com/groupName/web@sha256:bf459c3b48fb2d7846ccc60a7f7443cbcca66a3017b22c9f10d90ad68e9ad9af"
            ],
            sizeBytes: 1648071301
          },
          {
            names: [
              "example.com/groupName/web@sha256:ee22a25c01f98f9a2efc4342c0f8e899cc5f26ab35c61448a5cb427c3d6e0574",
              "example.com/groupName/web:fef1cf2c3808e4f80e870926e41fd6f8679b3795"
            ],
            sizeBytes: 1648045038
          },
          {
            names: [
              "example.com/groupName/web@sha256:601c180e1a4af4277ed2cc222025eefd9d4718104144b5819c2bcc88ea90ce4d",
              "example.com/groupName/web:1f34e9f4874e6798758f3890e650e355b308e84a"
            ],
            sizeBytes: 1648003815
          },
          {
            names: [
              "example.com/groupName/web@sha256:8a00605d56b259ed8ad81a6734fd9402b1d66d7627eb51c1346f1bb9a8399540",
              "example.com/groupName/web:5130798a06dc97d3d4263f818864ff80bbecef52"
            ],
            sizeBytes: 1647963616
          },
          {
            names: [
              "example.com/groupName/web@sha256:de216e43592cc1767fa12476240a8b2f650a3f2d94a76a671e52abc4de209c04",
              "example.com/groupName/web:3895d63603915bf35568d8e3992d343f0eb024a0"
            ],
            sizeBytes: 1647913482
          },
          {
            names: [
              "example.com/groupName/web@sha256:62c757645c47bc4b6dd4d0cd9463d66391c3d0f6a3344da4d29bb87f601d0330"
            ],
            sizeBytes: 1647817922
          },
          {
            names: [
              "example.com/groupName/web@sha256:27dba76318e0ff8a5b2d6142d7319ad99d6d071030f8b3f9db482da68723956f",
              "example.com/groupName/web:808aa823ad06a7be396f2b1ab1daf26812e3e1c2"
            ],
            sizeBytes: 1647813812
          },
          {
            names: [
              "example.com/groupName/web@sha256:bb59f95558a6ab1a1179a91c96a4ecc547fee7ad8a454d728b54e98aaf43b265",
              "example.com/groupName/web:3db8d696b8a290c6d121d66e369afaea4dfe1d20"
            ],
            sizeBytes: 1647783642
          },
          {
            names: [
              "example.com/groupName/web@sha256:8dc352b342356d0853ff4bc86d42fcd40562c22480acad8b01c63fc0fc2b43e1"
            ],
            sizeBytes: 1647738585
          },
          {
            names: [
              "example.com/groupName/web@sha256:07f0b6c534a6dc2daeda39810917b353bffa64e85ed7e06623ab1d69e227eade"
            ],
            sizeBytes: 1647734891
          },
          {
            names: [
              "example.com/groupName/web@sha256:2580bf1ec68c6264d273ee0eefdae17e73e95a2b2fb6e0174d515c9e03030906"
            ],
            sizeBytes: 1647723778
          },
          {
            names: [
              "example.com/groupName/web@sha256:1cc7bd43d88eeb3e5d6ca6571b82f7c6f3f8a4696027a0ad9f9282f44f8c002e"
            ],
            sizeBytes: 1647636797
          },
          {
            names: [
              "example.com/groupName/web@sha256:f4edadac553836c8b597263507d53e49d19e57b36e4a8dfe55e1dc293ac7e7a5"
            ],
            sizeBytes: 1647564974
          },
          {
            names: [
              "example.com/groupName/web@sha256:2b1efe8b212b10c6261220414f0eb9d6f953145a2a49c7f0696d993019a8beb3"
            ],
            sizeBytes: 1647189385
          }
        ],
        volumesInUse: [
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-049d3549-f569-11e9-bb4c-42010a920018",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-58078649-ec13-11e9-9910-42010a92000c",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-6c527549-ebf7-11e9-9910-42010a92000c",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-d699ef5d-ebf6-11e9-9910-42010a92000c",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-dd18634a-eff3-11e9-bb4c-42010a920018"
        ],
        volumesAttached: [
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-d699ef5d-ebf6-11e9-9910-42010a92000c",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-d699ef5d-ebf6-11e9-9910-42010a92000c"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-049d3549-f569-11e9-bb4c-42010a920018",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-049d3549-f569-11e9-bb4c-42010a920018"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-6c527549-ebf7-11e9-9910-42010a92000c",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-6c527549-ebf7-11e9-9910-42010a92000c"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-dd18634a-eff3-11e9-bb4c-42010a920018",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-dd18634a-eff3-11e9-bb4c-42010a920018"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-58078649-ec13-11e9-9910-42010a92000c",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-58078649-ec13-11e9-9910-42010a92000c"
          }
        ]
      }
    },
    {
      metadata: {
        name: "nodes-hg55",
        selfLink: "/api/v1/nodes/nodes-hg55",
        uid: "627ed3e6-fa0f-11e9-bb4c-42010a920018",
        resourceVersion: "33227893",
        creationTimestamp: "2019-10-29T05:45:59Z",
        labels: {
          "beta.kubernetes.io/arch": "amd64",
          "beta.kubernetes.io/instance-type": "n1-standard-4",
          "beta.kubernetes.io/os": "linux",
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a",
          "kops.k8s.io/instancegroup": "nodes",
          "kubernetes.io/arch": "amd64",
          "kubernetes.io/hostname": "nodes-hg55",
          "kubernetes.io/os": "linux",
          "kubernetes.io/role": "node",
          "node-role.kubernetes.io/node": ""
        },
        annotations: {
          "node.alpha.kubernetes.io/ttl": "0",
          "volumes.kubernetes.io/controller-managed-attach-detach": "true"
        }
      },
      spec: {
        podCIDR: "100.96.20.0/24",
        providerID: "gce://fiery-webbing-255306/asia-northeast1-a/nodes-hg55"
      },
      status: {
        capacity: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "129900528Ki",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          memory: "15393540Ki",
          pods: "110"
        },
        allocatable: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "119716326407",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          memory: "15291140Ki",
          pods: "110"
        },
        conditions: [
          {
            type: "NetworkUnavailable",
            status: "False",
            lastHeartbeatTime: "2019-10-29T05:46:16Z",
            lastTransitionTime: "2019-10-29T05:46:16Z",
            reason: "RouteCreated",
            message: "RouteController created a route"
          },
          {
            type: "MemoryPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:41Z",
            lastTransitionTime: "2019-10-29T05:45:59Z",
            reason: "KubeletHasSufficientMemory",
            message: "kubelet has sufficient memory available"
          },
          {
            type: "DiskPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:41Z",
            lastTransitionTime: "2019-10-29T05:45:59Z",
            reason: "KubeletHasNoDiskPressure",
            message: "kubelet has no disk pressure"
          },
          {
            type: "PIDPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:41Z",
            lastTransitionTime: "2019-10-29T05:45:59Z",
            reason: "KubeletHasSufficientPID",
            message: "kubelet has sufficient PID available"
          },
          {
            type: "Ready",
            status: "True",
            lastHeartbeatTime: "2020-02-16T17:52:41Z",
            lastTransitionTime: "2019-10-29T05:45:59Z",
            reason: "KubeletReady",
            message: "kubelet is posting ready status. AppArmor enabled"
          }
        ],
        addresses: [
          {
            type: "InternalIP",
            address: "10.146.0.43"
          },
          {
            type: "ExternalIP",
            address: "34.84.17.47"
          },
          {
            type: "InternalDNS",
            address:
              "nodes-hg55.asia-northeast1-a.c.fiery-webbing-255306.internal"
          },
          {
            type: "Hostname",
            address:
              "nodes-hg55.asia-northeast1-a.c.fiery-webbing-255306.internal"
          }
        ],
        daemonEndpoints: {
          kubeletEndpoint: {
            Port: 10250
          }
        },
        nodeInfo: {
          machineID: "971cf9618945584a2e0090dbe84b2599",
          systemUUID: "971CF961-8945-584A-2E00-90DBE84B2599",
          bootID: "574db9c7-8367-4570-b1a0-9ba0438dbc54",
          kernelVersion: "4.15.0-1044-gcp",
          osImage: "Ubuntu 18.04.3 LTS",
          containerRuntimeVersion: "docker://18.6.3",
          kubeletVersion: "v1.14.6",
          kubeProxyVersion: "v1.14.6",
          operatingSystem: "linux",
          architecture: "amd64"
        },
        images: [
          {
            names: [
              "example.com/groupName/web@sha256:08a08ea53055d848a8dbb5a625b0173e3bf1bf349b95e552286af607a3fcfe94",
              "example.com/groupName/web:2e31df7504283da671f11b7a119f9f11b373bf2a",
              "example.com/groupName/web:master"
            ],
            sizeBytes: 1653056244
          },
          {
            names: [
              "example.com/groupName/web@sha256:b93f3cc9afb55e7417084ff6edb8700a7fe5ade3376b831f8a855265bf5fd189"
            ],
            sizeBytes: 1653054491
          },
          {
            names: [
              "example.com/groupName/web@sha256:c9e0418967f807869001825b083ec7140459fe1351bb35a3f2f6037a224d887b"
            ],
            sizeBytes: 1653048389
          },
          {
            names: [
              "example.com/groupName/web@sha256:3ea2645360aad954f2b8989799f9560fa687dbeec421d53deced3c8f7c35a495"
            ],
            sizeBytes: 1653041820
          },
          {
            names: [
              "example.com/groupName/web@sha256:c86037fb921832fa72b76af19197e257118c4722579067e7e8209b2be32ecd94"
            ],
            sizeBytes: 1653019696
          },
          {
            names: [
              "example.com/groupName/web@sha256:905d9391d2e0343663de0b1adc6841b4e89d3fc88f91e97ca8a47d410e7889c6",
              "example.com/groupName/web:web2"
            ],
            sizeBytes: 1653007912
          },
          {
            names: [
              "example.com/groupName/web@sha256:536fbfa02f29da56e1166285398a7cee054c8c7d94ff95025bbbaf77554ac6d7"
            ],
            sizeBytes: 1653004207
          },
          {
            names: [
              "example.com/groupName/web@sha256:ebd4d118a7d2e5a490b03aabb153fd5a0317a15aa35d00e4f930cb7016ca5520",
              "example.com/groupName/web:staging"
            ],
            sizeBytes: 1652999389
          },
          {
            names: [
              "example.com/groupName/web@sha256:82696ed63136138f1ef71f5682e90ea56ec4ef3796cacd535c54b796c54d0055"
            ],
            sizeBytes: 1652959692
          },
          {
            names: [
              "example.com/groupName/web@sha256:884c5e017a4fc7ff4cd98ca0f1cb7c03f77881a2d3e0504b7a0751212c64637d"
            ],
            sizeBytes: 1652549070
          },
          {
            names: [
              "example.com/groupName/web@sha256:ec7efdc538c83a5c748312348db560a5631c9523eb4861e9adde9de16deb97b8"
            ],
            sizeBytes: 1652500290
          },
          {
            names: [
              "example.com/groupName/web@sha256:4b5a7f12bc48417a8e39fae5b11fc1662ab76dbaf905ca7c9665597deb39f29e",
              "example.com/groupName/web:93ea9f71c280c8a1c59f5458479bb2b01194e1a4"
            ],
            sizeBytes: 1652475454
          },
          {
            names: [
              "example.com/groupName/web@sha256:cc1a348178d668a70c3f447576ac850903dca93bbc50d39863b69a5a3f992939"
            ],
            sizeBytes: 1652415489
          },
          {
            names: [
              "example.com/groupName/web@sha256:88c69f5d0e837aa4657e9bcb117c3eec5b1def78a0b00c9ff2e69390ed28e25f"
            ],
            sizeBytes: 1652397547
          },
          {
            names: [
              "example.com/groupName/web@sha256:ed0dab1a037019eac1e67e082966a22cb8ca207301e2c8fc03bce8a4ddc9c70e"
            ],
            sizeBytes: 1652325324
          },
          {
            names: [
              "example.com/groupName/web@sha256:3e6e3c0555a148cae7803387b54dd3a15a49026c96394093d1fa87f6cc67fbe9"
            ],
            sizeBytes: 1652287881
          },
          {
            names: [
              "example.com/groupName/web@sha256:2e7bfb76c2c771543ebd1e31bbe378e294cd5a20e96ce0370429df2345d3e85a"
            ],
            sizeBytes: 1652281337
          },
          {
            names: [
              "example.com/groupName/web@sha256:f40d1fe35b517e980816d1ee076e133a6611339cc9057a2ad6ec4e42979a7c2a",
              "example.com/groupName/web:12cea717cbb00cda7c463f8d4918c1d9076b5ba8"
            ],
            sizeBytes: 1652262084
          },
          {
            names: [
              "example.com/groupName/web@sha256:a3697ef9e24568b3384a06a985f62591faf4a74fb6a5941f64cfd02553b4b69f"
            ],
            sizeBytes: 1652256428
          },
          {
            names: [
              "example.com/groupName/web@sha256:0c01ee0a5842a1ec51f2c390842e3959cc2d2be3ed41fc58677d25a376f89264"
            ],
            sizeBytes: 1652212628
          },
          {
            names: [
              "example.com/groupName/web@sha256:a5dc350e5f4bf608a9d8fc509c3e9aa8bc59de4df8257cd337a9af13fee5490b"
            ],
            sizeBytes: 1652146355
          },
          {
            names: [
              "example.com/groupName/web@sha256:182f4e028583fb6ccd862f7a69e37f0b8f208883efe1044b87aff01d645d5547"
            ],
            sizeBytes: 1652129043
          },
          {
            names: [
              "example.com/groupName/web@sha256:e5c17d1d9c1dc19b5e0eac231c297db614f7960b6c9dd4efdfa608dc6b162582"
            ],
            sizeBytes: 1652096476
          },
          {
            names: [
              "example.com/groupName/web@sha256:a079024390d82568100e9e3b66942f4cbe5c8fc81c022b315e9561b3a11c1c04"
            ],
            sizeBytes: 1652011439
          },
          {
            names: [
              "example.com/groupName/web@sha256:1a46e6d4d296a06f78733b515809ce7b22332f2a466ef5fd95cb842886fd5041"
            ],
            sizeBytes: 1651979537
          },
          {
            names: [
              "example.com/groupName/web@sha256:a0346c646d55056dbb4ba586d639973670e6e00369dd3418706c0574f40995fe"
            ],
            sizeBytes: 1651921735
          },
          {
            names: [
              "example.com/groupName/web@sha256:a64559c5586ff3d7e3de31fff1466c3703380a9b8ba82c8b9ffe94b690558580",
              "example.com/groupName/web:f51780de139c5a4c9fee91b044adef2611662671"
            ],
            sizeBytes: 1651885154
          },
          {
            names: [
              "example.com/groupName/web@sha256:adfdacb3731316e64aaee529a6ff5a7737100a738ecccaadd6f3b5db27c02532"
            ],
            sizeBytes: 1651874248
          },
          {
            names: [
              "example.com/groupName/web@sha256:c5680c7db027eb42563727a101a6be04df5da5fef33277159c11ec04cb7a39fd",
              "example.com/groupName/web:1ae0c9e9e237f220337ecd2575c634f6829b1bd7"
            ],
            sizeBytes: 1651818629
          },
          {
            names: [
              "example.com/groupName/web@sha256:c252931c5aa193222d6b5278b1ad1f781eb96d67f7f47a365924c1a36be6c160"
            ],
            sizeBytes: 1651796094
          },
          {
            names: [
              "example.com/groupName/web@sha256:93b44c47e9d710a54328744d2e3dd7bb3183092ecea9cfb729b8f2a3d8ad984b",
              "example.com/groupName/web:bdea59bab5626add512febf2191a8fb020b3a1b4"
            ],
            sizeBytes: 1651793672
          },
          {
            names: [
              "example.com/groupName/web@sha256:60da62cf5ee0f68be02493b2065c6eb4cb752ec0d58e72efeaec89525ece4ecd"
            ],
            sizeBytes: 1651647577
          },
          {
            names: [
              "example.com/groupName/web@sha256:aa50017bd4b5f9cbaba39c299b5553b0e5e11a5b162402dcbf91f51bd31162ad"
            ],
            sizeBytes: 1651617629
          },
          {
            names: [
              "example.com/groupName/web@sha256:7b23524b8bf64d04bca1afb87be368fb5f6cdf40b4846583644d83e612c440a4"
            ],
            sizeBytes: 1651598320
          },
          {
            names: [
              "example.com/groupName/web@sha256:15681b9c355e525214776e5dc579e15e96694b25674230bb32aab48791f7b1c6"
            ],
            sizeBytes: 1651552186
          },
          {
            names: [
              "example.com/groupName/web@sha256:19a9e8e5de1e9539c92b0e8869bca3277b0444492a1d6dd8c3dbdc3a8924af9b",
              "example.com/groupName/web:0d1201c67d4aa6bde0dd1aa347b59109eeadd1db"
            ],
            sizeBytes: 1651503943
          },
          {
            names: [
              "example.com/groupName/web@sha256:ac632ec427d700cb35e1c51556dd9519ac5fec23683b3eb4ece15dff681fdf13"
            ],
            sizeBytes: 1651363618
          },
          {
            names: [
              "example.com/groupName/web@sha256:bd4f03a955515b9871a7e49e5f8187a16c65ccca482808eed91c993809d257f3"
            ],
            sizeBytes: 1651334113
          },
          {
            names: [
              "example.com/groupName/web@sha256:01b667b4a64b2e741faca9da200b1b05a10aadfd83f924b70824974797ab078c"
            ],
            sizeBytes: 1651329016
          },
          {
            names: [
              "example.com/groupName/web@sha256:1d0ec9182a66dbde0c62745bd6141ac49da9a20de303f503acc74f7a32dfd02b"
            ],
            sizeBytes: 1651317997
          },
          {
            names: [
              "example.com/groupName/web@sha256:e0ce81174e55f133dd46615e793ba6d86973e45458dbb93a03c81bef0efa129c"
            ],
            sizeBytes: 1651294116
          },
          {
            names: [
              "example.com/groupName/web@sha256:9fa9972c514de9817a4b9730ca45af5ea4266247660a61b6a44677d86c29d51e"
            ],
            sizeBytes: 1651281576
          },
          {
            names: [
              "example.com/groupName/web@sha256:6a71a63fd10746a46d016940fd87283196bd0d3d02e1cdb78fd6d32a6514595d",
              "example.com/groupName/web:0e5a4ff031f9b1bd9e68ee31c9c3e0c029035e78"
            ],
            sizeBytes: 1651262669
          },
          {
            names: [
              "example.com/groupName/web@sha256:d4322d870d47e7b0ac7ef39184f0bbd906d56bfec008ae9c16ceafd9489d24ad",
              "example.com/groupName/web:91813c584b4ec7d06cada9269e5dc0e8b6a45379"
            ],
            sizeBytes: 1651166149
          },
          {
            names: [
              "example.com/groupName/web@sha256:752c4f0842f194001c92e81b2ef64746ca3ed12fce8f863720ce90744e3b20af"
            ],
            sizeBytes: 1650986799
          },
          {
            names: [
              "example.com/groupName/web@sha256:0563fa58e6cc2742ea55df299af2482075a36b9e835e80451382900068e8a264"
            ],
            sizeBytes: 1650810121
          },
          {
            names: [
              "example.com/groupName/web@sha256:f0a73fa0709ebe4aac8cae3559899dfa4fd4c40894b44fe7357de69d2fca4bb3"
            ],
            sizeBytes: 1650774767
          },
          {
            names: [
              "example.com/groupName/web@sha256:5c48a1edaec82dbe6fecfe2afff4aec8df0eb6196c3f412aa1ab7dd3f2c031d3"
            ],
            sizeBytes: 1650597464
          },
          {
            names: [
              "example.com/groupName/web@sha256:586efddf96e9192b7cf17b9a7aa4c7b95cd729cb290bae84046dbf43b4f760de"
            ],
            sizeBytes: 1650318306
          },
          {
            names: [
              "example.com/groupName/web@sha256:47a5869eecb611f5f381120b350747a222f2f0dc6f88c7409c19b8d6e2ac315a"
            ],
            sizeBytes: 1650267992
          }
        ],
        volumesInUse: [
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-4d2fb66c-ec22-11e9-9910-42010a92000c",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-7bca13df-fa1d-11e9-bb4c-42010a920018",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-7bd06182-fa1d-11e9-bb4c-42010a920018",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-c17224ed-ebcf-11e9-9910-42010a92000c",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-e33e3055-fa1d-11e9-bb4c-42010a920018"
        ],
        volumesAttached: [
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-7bd06182-fa1d-11e9-bb4c-42010a920018",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-7bd06182-fa1d-11e9-bb4c-42010a920018"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-7bca13df-fa1d-11e9-bb4c-42010a920018",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-7bca13df-fa1d-11e9-bb4c-42010a920018"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-e33e3055-fa1d-11e9-bb4c-42010a920018",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-e33e3055-fa1d-11e9-bb4c-42010a920018"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-c17224ed-ebcf-11e9-9910-42010a92000c",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-c17224ed-ebcf-11e9-9910-42010a92000c"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-4d2fb66c-ec22-11e9-9910-42010a92000c",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-4d2fb66c-ec22-11e9-9910-42010a92000c"
          }
        ]
      }
    },
    {
      metadata: {
        name: "nodes-lgpx",
        selfLink: "/api/v1/nodes/nodes-lgpx",
        uid: "69ebab0f-f182-11e9-bb4c-42010a920018",
        resourceVersion: "33227876",
        creationTimestamp: "2019-10-18T08:36:43Z",
        labels: {
          "beta.kubernetes.io/arch": "amd64",
          "beta.kubernetes.io/instance-type": "n1-standard-4",
          "beta.kubernetes.io/os": "linux",
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a",
          "kops.k8s.io/instancegroup": "nodes",
          "kubernetes.io/arch": "amd64",
          "kubernetes.io/hostname": "nodes-lgpx",
          "kubernetes.io/os": "linux",
          "kubernetes.io/role": "node",
          "node-role.kubernetes.io/node": ""
        },
        annotations: {
          "node.alpha.kubernetes.io/ttl": "0",
          "volumes.kubernetes.io/controller-managed-attach-detach": "true"
        }
      },
      spec: {
        podCIDR: "100.96.16.0/24",
        providerID: "gce://fiery-webbing-255306/asia-northeast1-a/nodes-lgpx"
      },
      status: {
        capacity: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "129900528Ki",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          memory: "15393540Ki",
          pods: "110"
        },
        allocatable: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "119716326407",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          memory: "15291140Ki",
          pods: "110"
        },
        conditions: [
          {
            type: "NetworkUnavailable",
            status: "False",
            lastHeartbeatTime: "2019-10-18T08:36:57Z",
            lastTransitionTime: "2019-10-18T08:36:57Z",
            reason: "RouteCreated",
            message: "RouteController created a route"
          },
          {
            type: "MemoryPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:36Z",
            lastTransitionTime: "2019-10-18T08:36:43Z",
            reason: "KubeletHasSufficientMemory",
            message: "kubelet has sufficient memory available"
          },
          {
            type: "DiskPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:36Z",
            lastTransitionTime: "2019-10-18T08:36:43Z",
            reason: "KubeletHasNoDiskPressure",
            message: "kubelet has no disk pressure"
          },
          {
            type: "PIDPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:36Z",
            lastTransitionTime: "2019-10-18T08:36:43Z",
            reason: "KubeletHasSufficientPID",
            message: "kubelet has sufficient PID available"
          },
          {
            type: "Ready",
            status: "True",
            lastHeartbeatTime: "2020-02-16T17:52:36Z",
            lastTransitionTime: "2019-10-18T08:36:43Z",
            reason: "KubeletReady",
            message: "kubelet is posting ready status. AppArmor enabled"
          }
        ],
        addresses: [
          {
            type: "InternalIP",
            address: "10.146.0.39"
          },
          {
            type: "ExternalIP",
            address: "34.84.61.45"
          },
          {
            type: "InternalDNS",
            address:
              "nodes-lgpx.asia-northeast1-a.c.fiery-webbing-255306.internal"
          },
          {
            type: "Hostname",
            address:
              "nodes-lgpx.asia-northeast1-a.c.fiery-webbing-255306.internal"
          }
        ],
        daemonEndpoints: {
          kubeletEndpoint: {
            Port: 10250
          }
        },
        nodeInfo: {
          machineID: "da451bbbc0fdc50104e07f86e4f851ce",
          systemUUID: "DA451BBB-C0FD-C501-04E0-7F86E4F851CE",
          bootID: "ae9b9feb-8808-4a92-8cdd-e238f4c65676",
          kernelVersion: "4.15.0-1044-gcp",
          osImage: "Ubuntu 18.04.3 LTS",
          containerRuntimeVersion: "docker://18.6.3",
          kubeletVersion: "v1.14.6",
          kubeProxyVersion: "v1.14.6",
          operatingSystem: "linux",
          architecture: "amd64"
        },
        images: [
          {
            names: [
              "example.com/groupName/web@sha256:73c72037fadc84bdd340e9d01cc3f3523e2c775059a8eb7b70922868cf1ab38a",
              "example.com/groupName/web:9b8ccbc6fc6854ce468a4fdcd2c8dbf1175887d2"
            ],
            sizeBytes: 1653202064
          },
          {
            names: [
              "example.com/groupName/web@sha256:c9e0418967f807869001825b083ec7140459fe1351bb35a3f2f6037a224d887b",
              "example.com/groupName/web:f36e3636ab1529e8f2a54feb8fe80130e1d27ee7"
            ],
            sizeBytes: 1653048389
          },
          {
            names: [
              "example.com/groupName/web@sha256:c86037fb921832fa72b76af19197e257118c4722579067e7e8209b2be32ecd94",
              "example.com/groupName/web:9d2a9ebceaf965890b7200aac8b33eedc08495ca"
            ],
            sizeBytes: 1653019696
          },
          {
            names: [
              "example.com/groupName/web@sha256:20fcfaf280449078a9324737f7fed1ff6c031afbc5fc758c7f7075c8be45070d",
              "example.com/groupName/web:64e654a18fd51bb225aa80153e02905e1746a127"
            ],
            sizeBytes: 1652359792
          },
          {
            names: [
              "example.com/groupName/web@sha256:c84b274b665c4805fdbf7b5475a3559903d25f2101d653094704ab47adff3961"
            ],
            sizeBytes: 1652208215
          },
          {
            names: [
              "example.com/groupName/web@sha256:463e76b8e258ffc1533255bcafa4ec242fa929898af768928cac8f6777e6d284"
            ],
            sizeBytes: 1652108885
          },
          {
            names: [
              "example.com/groupName/web@sha256:e5c17d1d9c1dc19b5e0eac231c297db614f7960b6c9dd4efdfa608dc6b162582",
              "example.com/groupName/web:cd0d761d5f8bf4eeae9b8846b6374af607cf0893"
            ],
            sizeBytes: 1652096476
          },
          {
            names: [
              "example.com/groupName/web@sha256:9cee11efbc09b95d6d00774ede7cd0e8cdb89711fd172579611d3a8ca1823a14",
              "example.com/groupName/web:web2"
            ],
            sizeBytes: 1651991327
          },
          {
            names: [
              "example.com/groupName/web@sha256:7045d1b84fbe6cd5f16b2ab492b7ce8e7bab0d92eede12f3fd92a097797871ff",
              "example.com/groupName/web:c4462b84cff67e9a165445352f902359fdcd617d"
            ],
            sizeBytes: 1651856247
          },
          {
            names: [
              "example.com/groupName/web@sha256:e429c879e10755c7fee4cfc1d217bddc534d107246eb519849e53012f7dbb464",
              "example.com/groupName/web:20c43768de46f17eb5de2433bc580e14a12f2881"
            ],
            sizeBytes: 1651768589
          },
          {
            names: [
              "example.com/groupName/web@sha256:36c3890e5b1c12d09b54f73e67dfe838c46ac6e843b5d5ef7616be20e010f1cb",
              "example.com/groupName/web:24e9b54b3f40822703372b9ceb964a74f9cfe6fe"
            ],
            sizeBytes: 1651752508
          },
          {
            names: [
              "example.com/groupName/web@sha256:5eea13732a3922aa0ba84b81bf1c75a64699568e8feb74f3ad81ed1bf6cdbfbb",
              "example.com/groupName/web:ddexglobal20c43768de46f17eb5de2433bc580e14a12f2881"
            ],
            sizeBytes: 1651710034
          },
          {
            names: [
              "example.com/groupName/web@sha256:5e6c72581d52086b7808b0842afa114070c347a3df41f6ca15b6415c216dfdc5",
              "example.com/groupName/web:staging"
            ],
            sizeBytes: 1651470802
          },
          {
            names: [
              "example.com/groupName/web@sha256:e0ce81174e55f133dd46615e793ba6d86973e45458dbb93a03c81bef0efa129c",
              "example.com/groupName/web:2079eeacfaf8b23c226026130b11697b92837ef5"
            ],
            sizeBytes: 1651294116
          },
          {
            names: [
              "example.com/groupName/web@sha256:2b1ba7acf6ef8f00c536eb553416487947e785d58ea967266692699d44f6f333",
              "example.com/groupName/web:d9b3ae7ace2441e556b84464167f044cc9c06b3b"
            ],
            sizeBytes: 1650738462
          },
          {
            names: [
              "example.com/groupName/web@sha256:1cb5717a617ccf103bb5a2c567699c52e94060737e95fc88f7d9d26ee85f19fe"
            ],
            sizeBytes: 1650450282
          },
          {
            names: [
              "example.com/groupName/web@sha256:47a5869eecb611f5f381120b350747a222f2f0dc6f88c7409c19b8d6e2ac315a",
              "example.com/groupName/web:363a767e6b6ccdfa7d807f7a6caf5f2c5dad4012"
            ],
            sizeBytes: 1650267992
          },
          {
            names: [
              "example.com/groupName/web@sha256:8a06adcb0a18bae75d42ba4f685af87b7c03d05fbde122549f56e0072f2c49a9",
              "example.com/groupName/web:bf0a8f77887100dd8f6326cbcdf71b9c1840917f"
            ],
            sizeBytes: 1650239272
          },
          {
            names: [
              "example.com/groupName/web@sha256:44272f061afdb1c9dccd7109ce6da1db81e49ea961139f8b1121af639b59c553",
              "example.com/groupName/web:995c766cae730c8c0a746cd980e9c23f6b28533e"
            ],
            sizeBytes: 1650197696
          },
          {
            names: [
              "example.com/groupName/web@sha256:6adf45635e07589999104681201b5848fa0e212366ed13cb5070f276c91d8797"
            ],
            sizeBytes: 1650048178
          },
          {
            names: [
              "example.com/groupName/web@sha256:aa249de15e66ee3c76a9539eadab10291773c5915796585ff36e9c836f22ea2e",
              "example.com/groupName/web:d4bbf203aeea8326e2c7163294935ada7d339e0e"
            ],
            sizeBytes: 1650027378
          },
          {
            names: [
              "example.com/groupName/web@sha256:6d1885b839718fa669468e468e607a56ecb9df6a686769781b6cc2bfe43e7575"
            ],
            sizeBytes: 1649770423
          },
          {
            names: [
              "example.com/groupName/web@sha256:6ea44f688f942fe9cc6ed27dbada0212a02c299ca24e0908e4a0db25f881d997"
            ],
            sizeBytes: 1649416037
          },
          {
            names: [
              "example.com/groupName/web@sha256:661860c04b90efdba02ef7675b7df1cf961282bd2a654552561613a94eb536e0",
              "example.com/groupName/web:643ec01d88d490373ca1d2469aa3c7372973e30e"
            ],
            sizeBytes: 1649189056
          },
          {
            names: [
              "example.com/groupName/web@sha256:0bd253221fc03528f15f475120e30b815373285d11a52509d8438473384f9f8b",
              "example.com/groupName/web:17642bfec7831b971109a402abd5daf4977ea50d"
            ],
            sizeBytes: 1648911061
          },
          {
            names: [
              "example.com/groupName/web@sha256:a2e7e9ffd6eed068a634d21f2fc601586eb93c5449da73fc9a89e64469377cf4",
              "example.com/groupName/web:29a847e1702c75e7b1a983f32b2e2970cc05afb8"
            ],
            sizeBytes: 1648705077
          },
          {
            names: [
              "example.com/groupName/web@sha256:ae494e792205d4c49490d63ea9e760e2cd24aae0d999946c9fe55835ef9b096c"
            ],
            sizeBytes: 1648631420
          },
          {
            names: [
              "example.com/groupName/web@sha256:3458d7cb36fb6efdeab5d6c39e3fb311d632813700b153978e4071262696f005",
              "example.com/groupName/web:05f502469b4e4deabeb008fbe79a030051845c51"
            ],
            sizeBytes: 1648618706
          },
          {
            names: [
              "example.com/groupName/web@sha256:41ab52664123471ca77e1b2dc84543b68ab95b523227e422be50c8afb183ed5c",
              "example.com/groupName/web:521441e8367f985a38030aece8a04f6f12cae863"
            ],
            sizeBytes: 1648609299
          },
          {
            names: [
              "example.com/groupName/web@sha256:98ddcf4e4a983849e8cc18ab30dc086307ac6f9cf751bc53640d6fec77fd3bca"
            ],
            sizeBytes: 1648553108
          },
          {
            names: [
              "example.com/groupName/web@sha256:fe28421079f6859608c3cea83e7d0cad2cf3962da16c768332c2e088abe0d0cb"
            ],
            sizeBytes: 1648541772
          },
          {
            names: [
              "example.com/groupName/web@sha256:596a485322801db4d461cc73108cfe5a442cef0447f6f99d626ea689284a76b9"
            ],
            sizeBytes: 1648527647
          },
          {
            names: [
              "example.com/groupName/web@sha256:9bfdbfc4e6056b869e7cdcd6aab427aad4d4deda434af470d7c7f15b2d9a77c1"
            ],
            sizeBytes: 1648345579
          },
          {
            names: [
              "example.com/groupName/web@sha256:8a5cbffbcc3b5d4aebca210a2b2cc22be60d902bac34cf256ca172e351a32073"
            ],
            sizeBytes: 1648315779
          },
          {
            names: [
              "example.com/groupName/web@sha256:2cd30632bc051ead8b945b9008d5c43c601cd2be7836d19e043cb23f7e79bd19"
            ],
            sizeBytes: 1648253121
          },
          {
            names: [
              "example.com/groupName/web@sha256:cb6fd540a1a48129365474c071b18bb6889491211baa7e8004b1c391bff92910"
            ],
            sizeBytes: 1648136862
          },
          {
            names: [
              "example.com/groupName/web@sha256:bf459c3b48fb2d7846ccc60a7f7443cbcca66a3017b22c9f10d90ad68e9ad9af",
              "example.com/groupName/web:ef273a7ea95cc165620bfd41457730180af173e4"
            ],
            sizeBytes: 1648071301
          },
          {
            names: [
              "example.com/groupName/web@sha256:02ac94c3d2c7c734b86a430f1fba879f16baec47cf01f2e1b8fcb8dc1244c5e3",
              "example.com/groupName/web:7bf7b2789abd0fd1471d011e4587ffb61fea19fd"
            ],
            sizeBytes: 1648068338
          },
          {
            names: [
              "example.com/groupName/web@sha256:a0b71d4561adff0d82ccacded4528339892db949223c5776fb44bcec6e8d163e",
              "example.com/groupName/web:cd7790eedc05434da359068cb30bd654334c64f5"
            ],
            sizeBytes: 1648032373
          },
          {
            names: [
              "example.com/groupName/web@sha256:5d0eb364e8fb8ee65eaaa07d1a0ecca47501d8c4bbc8c71fe25e2e2b81609bc8"
            ],
            sizeBytes: 1647839405
          },
          {
            names: [
              "example.com/groupName/web@sha256:27dba76318e0ff8a5b2d6142d7319ad99d6d071030f8b3f9db482da68723956f",
              "example.com/groupName/web:808aa823ad06a7be396f2b1ab1daf26812e3e1c2"
            ],
            sizeBytes: 1647813812
          },
          {
            names: [
              "example.com/groupName/web@sha256:48576f1d4db3ab4f1e01553f60c0d0d37fe6b62bfbf1d74148b454484cadc751"
            ],
            sizeBytes: 1647762432
          },
          {
            names: [
              "example.com/groupName/web@sha256:237a9fc6b3df98e7476376b98a5c0b6a7d01a2798a92998ad1cc861cb826e9a9",
              "example.com/groupName/web:2515312aa2e7fc36f36f93194a4e459ce7cebcf4"
            ],
            sizeBytes: 1647726715
          },
          {
            names: [
              "example.com/groupName/web@sha256:cdc11c525c6b562de9ef453bd0b0ec8163f59bead0a67637476b453951977901"
            ],
            sizeBytes: 1647715922
          },
          {
            names: [
              "example.com/groupName/web@sha256:f75e44c1b6104e35d745d4f04c0218bb1b0a2975fd006973039b25229e77daf4",
              "example.com/groupName/web:6c39ae881bdc1f98bd2854dfb4422040e2e962fb"
            ],
            sizeBytes: 1647601075
          },
          {
            names: [
              "example.com/groupName/web@sha256:f4edadac553836c8b597263507d53e49d19e57b36e4a8dfe55e1dc293ac7e7a5"
            ],
            sizeBytes: 1647564974
          },
          {
            names: [
              "example.com/groupName/web@sha256:c78b9c1960210d9a17d4ac7bfe140c6a4f51b4041f881c176837c7637a2a4ff2",
              "example.com/groupName/web:cd58fd00078aa253efaa19ae448bfa6ae8536a75"
            ],
            sizeBytes: 1647436897
          },
          {
            names: [
              "example.com/groupName/web@sha256:382993251d904f5148faf63d4f128afca130bbd29e0593be956729807dbc4c98",
              "example.com/groupName/web:ddexglobalcd58fd00078aa253efaa19ae448bfa6ae8536a75"
            ],
            sizeBytes: 1647312379
          },
          {
            names: [
              "example.com/groupName/web@sha256:2b1efe8b212b10c6261220414f0eb9d6f953145a2a49c7f0696d993019a8beb3"
            ],
            sizeBytes: 1647189385
          },
          {
            names: [
              "example.com/groupName/web@sha256:62847b2838e7fcaf181d2d6ab191196cb085ff983a32eb0f59ee3bb8601b0e0d"
            ],
            sizeBytes: 1647182218
          }
        ],
        volumesInUse: [
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-43d977e0-f3f5-11e9-bb4c-42010a920018",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-5946e3fb-ebf7-11e9-9910-42010a92000c",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-5da23b0c-1c89-11ea-bb4c-42010a920018",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-5da7a978-1c89-11ea-bb4c-42010a920018",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-d9ec9070-ec05-11e9-9910-42010a92000c"
        ],
        volumesAttached: [
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-5da7a978-1c89-11ea-bb4c-42010a920018",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-5da7a978-1c89-11ea-bb4c-42010a920018"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-5da23b0c-1c89-11ea-bb4c-42010a920018",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-5da23b0c-1c89-11ea-bb4c-42010a920018"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-5946e3fb-ebf7-11e9-9910-42010a92000c",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-5946e3fb-ebf7-11e9-9910-42010a92000c"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-43d977e0-f3f5-11e9-bb4c-42010a920018",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-43d977e0-f3f5-11e9-bb4c-42010a920018"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-d9ec9070-ec05-11e9-9910-42010a92000c",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-d9ec9070-ec05-11e9-9910-42010a92000c"
          }
        ]
      }
    },
    {
      metadata: {
        name: "nodes-q8df",
        selfLink: "/api/v1/nodes/nodes-q8df",
        uid: "eb2bbca1-f623-11e9-bb4c-42010a920018",
        resourceVersion: "33227847",
        creationTimestamp: "2019-10-24T06:02:54Z",
        labels: {
          "beta.kubernetes.io/arch": "amd64",
          "beta.kubernetes.io/instance-type": "n1-standard-4",
          "beta.kubernetes.io/os": "linux",
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a",
          "kops.k8s.io/instancegroup": "nodes",
          "kubernetes.io/arch": "amd64",
          "kubernetes.io/hostname": "nodes-q8df",
          "kubernetes.io/os": "linux",
          "kubernetes.io/role": "node",
          "node-role.kubernetes.io/node": ""
        },
        annotations: {
          "node.alpha.kubernetes.io/ttl": "0",
          "volumes.kubernetes.io/controller-managed-attach-detach": "true"
        }
      },
      spec: {
        podCIDR: "100.96.19.0/24",
        providerID: "gce://fiery-webbing-255306/asia-northeast1-a/nodes-q8df"
      },
      status: {
        capacity: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "129900528Ki",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          memory: "15393540Ki",
          pods: "110"
        },
        allocatable: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "119716326407",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          memory: "15291140Ki",
          pods: "110"
        },
        conditions: [
          {
            type: "NetworkUnavailable",
            status: "False",
            lastHeartbeatTime: "2019-10-24T06:03:12Z",
            lastTransitionTime: "2019-10-24T06:03:12Z",
            reason: "RouteCreated",
            message: "RouteController created a route"
          },
          {
            type: "MemoryPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:28Z",
            lastTransitionTime: "2019-10-24T06:02:54Z",
            reason: "KubeletHasSufficientMemory",
            message: "kubelet has sufficient memory available"
          },
          {
            type: "DiskPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:28Z",
            lastTransitionTime: "2019-10-24T06:02:54Z",
            reason: "KubeletHasNoDiskPressure",
            message: "kubelet has no disk pressure"
          },
          {
            type: "PIDPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:28Z",
            lastTransitionTime: "2019-10-24T06:02:54Z",
            reason: "KubeletHasSufficientPID",
            message: "kubelet has sufficient PID available"
          },
          {
            type: "Ready",
            status: "True",
            lastHeartbeatTime: "2020-02-16T17:52:28Z",
            lastTransitionTime: "2019-10-24T06:02:54Z",
            reason: "KubeletReady",
            message: "kubelet is posting ready status. AppArmor enabled"
          }
        ],
        addresses: [
          {
            type: "InternalIP",
            address: "10.146.0.42"
          },
          {
            type: "ExternalIP",
            address: "35.187.207.17"
          },
          {
            type: "InternalDNS",
            address:
              "nodes-q8df.asia-northeast1-a.c.fiery-webbing-255306.internal"
          },
          {
            type: "Hostname",
            address:
              "nodes-q8df.asia-northeast1-a.c.fiery-webbing-255306.internal"
          }
        ],
        daemonEndpoints: {
          kubeletEndpoint: {
            Port: 10250
          }
        },
        nodeInfo: {
          machineID: "4a328bcd2fe49efd46d4d5545a4a479f",
          systemUUID: "4A328BCD-2FE4-9EFD-46D4-D5545A4A479F",
          bootID: "fa8bd68f-b3df-4265-9c8e-b74afc398d72",
          kernelVersion: "4.15.0-1044-gcp",
          osImage: "Ubuntu 18.04.3 LTS",
          containerRuntimeVersion: "docker://18.6.3",
          kubeletVersion: "v1.14.6",
          kubeProxyVersion: "v1.14.6",
          operatingSystem: "linux",
          architecture: "amd64"
        },
        images: [
          {
            names: [
              "example.com/groupName/web@sha256:b93f3cc9afb55e7417084ff6edb8700a7fe5ade3376b831f8a855265bf5fd189",
              "example.com/groupName/web:76000eef975a3ab0b630a99b7495d7c67eebf5dc"
            ],
            sizeBytes: 1653054491
          },
          {
            names: [
              "example.com/groupName/web@sha256:3ea2645360aad954f2b8989799f9560fa687dbeec421d53deced3c8f7c35a495",
              "example.com/groupName/web:0217387f2dfb3cc2d0b156d0290d68d6963cf329"
            ],
            sizeBytes: 1653041820
          },
          {
            names: [
              "example.com/groupName/web@sha256:20fcfaf280449078a9324737f7fed1ff6c031afbc5fc758c7f7075c8be45070d",
              "example.com/groupName/web:master"
            ],
            sizeBytes: 1652359792
          },
          {
            names: [
              "example.com/groupName/web@sha256:ed0dab1a037019eac1e67e082966a22cb8ca207301e2c8fc03bce8a4ddc9c70e",
              "example.com/groupName/web:19794891918577d40aa2878752ffc11bfd318dc1"
            ],
            sizeBytes: 1652325324
          },
          {
            names: [
              "example.com/groupName/web@sha256:5a9c29b232b403e69baaa3e2daa61c9a5927dede9bea87b20639cf3191605520",
              "example.com/groupName/web:f1c6356360c98d262b9ccb6ad369c83b15523eb4"
            ],
            sizeBytes: 1652242499
          },
          {
            names: [
              "example.com/groupName/web@sha256:6f6c728522c748a9cdb2b42ebdae404d6aad8a02bd924576f16c72d2d0c2e546"
            ],
            sizeBytes: 1652126193
          },
          {
            names: [
              "example.com/groupName/web@sha256:54e41e16bccff50d20b6fcd93915a44152e30d01f0c6028cdebb110cbc094ef1",
              "example.com/groupName/web:952b7bd865ac23ec84c2a4d9574d9618ebfefd37"
            ],
            sizeBytes: 1651982965
          },
          {
            names: [
              "example.com/groupName/web@sha256:93b44c47e9d710a54328744d2e3dd7bb3183092ecea9cfb729b8f2a3d8ad984b",
              "example.com/groupName/web:bdea59bab5626add512febf2191a8fb020b3a1b4"
            ],
            sizeBytes: 1651793672
          },
          {
            names: [
              "example.com/groupName/web@sha256:ce7a73f9715f49f4664c9d8c9ad11497552841fb938173483bf9fac835199d81",
              "example.com/groupName/web:b706a784bff54cec1b7fa627e6a5c0ba83cc80ef"
            ],
            sizeBytes: 1651400555
          },
          {
            names: [
              "example.com/groupName/web@sha256:d4322d870d47e7b0ac7ef39184f0bbd906d56bfec008ae9c16ceafd9489d24ad",
              "example.com/groupName/web:91813c584b4ec7d06cada9269e5dc0e8b6a45379"
            ],
            sizeBytes: 1651166149
          },
          {
            names: [
              "example.com/groupName/web@sha256:91316dd7b5147d80393543c0283ccdf053416f1e0f163ff0fe2ddcd2bec1e355",
              "example.com/groupName/web:6fb0e3557e351f8cdd455f96d7fd4e615d9e2c1b"
            ],
            sizeBytes: 1650529594
          },
          {
            names: [
              "example.com/groupName/web@sha256:d836dd8ac4086c47af6678d3464d45bb0369f07c252a51e280fd5c53b828ca15",
              "example.com/groupName/web:ddexglobal8e03b2db932201f4c53cbd811e0973a6a1acc3d1"
            ],
            sizeBytes: 1650373792
          },
          {
            names: [
              "example.com/groupName/web@sha256:47a5869eecb611f5f381120b350747a222f2f0dc6f88c7409c19b8d6e2ac315a",
              "example.com/groupName/web:363a767e6b6ccdfa7d807f7a6caf5f2c5dad4012"
            ],
            sizeBytes: 1650267992
          },
          {
            names: [
              "example.com/groupName/web@sha256:5763ea71a143147bec086192d4689062dbd78ba1180afd0509eb90ac36f13838",
              "example.com/groupName/web:30a4a8eed817502c1dd8115ee85aec57a5b22827"
            ],
            sizeBytes: 1650051583
          },
          {
            names: [
              "example.com/groupName/web@sha256:d267d1249cdb19c0b7382ad22be5dd2fa6cb58778de07f92508ef203f20490b1",
              "example.com/groupName/web:9f045c912a0e8c65c3b323183dc111e0b2086a54"
            ],
            sizeBytes: 1649869339
          },
          {
            names: [
              "example.com/groupName/web@sha256:9466977006d7bde8afb00c70782bba1fce731b5730e55a703bc7081ce12d2f7d",
              "example.com/groupName/web:e4b196e1b3544b5d9f24a7dd479518fa80813acd"
            ],
            sizeBytes: 1649394009
          },
          {
            names: [
              "example.com/groupName/web@sha256:c455e20fec7e9504ffcef71b11813fb2b5fa8b135ea4145421fd4934693c30db"
            ],
            sizeBytes: 1649379965
          },
          {
            names: [
              "example.com/groupName/web@sha256:661860c04b90efdba02ef7675b7df1cf961282bd2a654552561613a94eb536e0",
              "example.com/groupName/web:643ec01d88d490373ca1d2469aa3c7372973e30e"
            ],
            sizeBytes: 1649189056
          },
          {
            names: [
              "example.com/groupName/web@sha256:fee29cff0bc2924f0be15d2249c410a6bbe63607ba6b40f6f62656f2999d63e7",
              "example.com/groupName/web:c2b12931b4ae022e358971ee5d18218e8f346172"
            ],
            sizeBytes: 1648493833
          },
          {
            names: [
              "example.com/groupName/web@sha256:e43d3a42b59c2d8f76151ae7357be5c01290582ffe5bfcc1526bd7cdd99b773c",
              "example.com/groupName/web:37789151a9234b791614f28445f95d30d201b3c6"
            ],
            sizeBytes: 1648083401
          },
          {
            names: [
              "example.com/groupName/web@sha256:ee22a25c01f98f9a2efc4342c0f8e899cc5f26ab35c61448a5cb427c3d6e0574",
              "example.com/groupName/web:fef1cf2c3808e4f80e870926e41fd6f8679b3795"
            ],
            sizeBytes: 1648045038
          },
          {
            names: [
              "example.com/groupName/web@sha256:de216e43592cc1767fa12476240a8b2f650a3f2d94a76a671e52abc4de209c04"
            ],
            sizeBytes: 1647913482
          },
          {
            names: [
              "example.com/groupName/web@sha256:62c757645c47bc4b6dd4d0cd9463d66391c3d0f6a3344da4d29bb87f601d0330",
              "example.com/groupName/web:b4ae3f5d04bd4edab8a664ec724f8894831a92d2"
            ],
            sizeBytes: 1647817922
          },
          {
            names: [
              "example.com/groupName/web@sha256:27dba76318e0ff8a5b2d6142d7319ad99d6d071030f8b3f9db482da68723956f"
            ],
            sizeBytes: 1647813812
          },
          {
            names: [
              "example.com/groupName/web@sha256:bb59f95558a6ab1a1179a91c96a4ecc547fee7ad8a454d728b54e98aaf43b265"
            ],
            sizeBytes: 1647783642
          },
          {
            names: [
              "example.com/groupName/web@sha256:974854e49ab44649311abe6a3e49c789483e9ef6e582abe781740df4e9867bb7"
            ],
            sizeBytes: 1647759866
          },
          {
            names: [
              "example.com/groupName/web@sha256:682ec76f999bc2027ca615e859937e999571c694b1b9c534e081b4ed30b3d309"
            ],
            sizeBytes: 1647743702
          },
          {
            names: [
              "example.com/groupName/web@sha256:237a9fc6b3df98e7476376b98a5c0b6a7d01a2798a92998ad1cc861cb826e9a9",
              "example.com/groupName/web:2515312aa2e7fc36f36f93194a4e459ce7cebcf4"
            ],
            sizeBytes: 1647726715
          },
          {
            names: [
              "example.com/groupName/web@sha256:f8152679a35100805df3a3e8e44fba65f64bf5197f61fbabac000c1ef689a588"
            ],
            sizeBytes: 1647705070
          },
          {
            names: [
              "example.com/groupName/web@sha256:f75e44c1b6104e35d745d4f04c0218bb1b0a2975fd006973039b25229e77daf4",
              "example.com/groupName/web:6c39ae881bdc1f98bd2854dfb4422040e2e962fb"
            ],
            sizeBytes: 1647601075
          },
          {
            names: [
              "example.com/groupName/web@sha256:c78b9c1960210d9a17d4ac7bfe140c6a4f51b4041f881c176837c7637a2a4ff2",
              "example.com/groupName/web:cd58fd00078aa253efaa19ae448bfa6ae8536a75"
            ],
            sizeBytes: 1647436897
          },
          {
            names: [
              "example.com/groupName/web@sha256:31045b537dfed5a3826697af702acfee41de77b489b4def164859f35b0ae3759",
              "example.com/groupName/web:ddexglobal82ed88f3a58da3f94aac32dce1b88cce913ea78d"
            ],
            sizeBytes: 1647397793
          },
          {
            names: [
              "example.com/groupName/web@sha256:b72f17b431251dd6ba858f09bc9501f58b3fe3afb7dbd10fab8c45db4cfde779",
              "example.com/groupName/web:82ed88f3a58da3f94aac32dce1b88cce913ea78d"
            ],
            sizeBytes: 1647373066
          },
          {
            names: [
              "example.com/groupName/web@sha256:3aef41902605658674cb912bbdbb759e69daeaa3f77280169605c361e1305d6f",
              "example.com/groupName/web:ddexglobalc4aa9cc8e33ab42ec2ca9871530146d414c3b24f"
            ],
            sizeBytes: 1646149283
          },
          {
            names: [
              "example.com/groupName/web@sha256:0db2b6aa4780e4323789a8b7e4ef65992244f6521e7ac3597f03003abbd061de"
            ],
            sizeBytes: 1631118967
          },
          {
            names: [
              "example.com/groupName/web@sha256:4083be8c4af26c3fa36acad530bcb9fee85d2436eae21aebd5d79f02332806ea",
              "example.com/groupName/web:2578cc7f3006d465462819a4b4e1004d2b6324bb"
            ],
            sizeBytes: 1630183041
          },
          {
            names: [
              "example.com/groupName/web@sha256:90173ffe9aea67464bd79d7f1eedeea0fb59c184954799333897f207b47d55c2",
              "example.com/groupName/web:637a6cff63e577fa6dc76fb7f3fc673ae6513675"
            ],
            sizeBytes: 1629906855
          },
          {
            names: [
              "registry.example.io/example/example-web@sha256:1df494bf544cb444927d2560fce09b106f302f434a165346bc6ced2ddcbb725f",
              "registry.example.io/example/example-web:2b437533c8b6b56459adb87f88e0b7d82d2cc88a-example"
            ],
            sizeBytes: 1585429356
          },
          {
            names: [
              "registry.example.io/example/example-web@sha256:11753df2b7c52779938c760a7e2507cb0dd7ded48cc654579d95a09c30d2c1b7",
              "registry.example.io/example/example-web:dd5212fa9865cb9dcc0ba8c4cf244f0182f61150-example"
            ],
            sizeBytes: 1582956178
          },
          {
            names: [
              "registry.example.io/example/example-web@sha256:f4dc7fface1ae12fde174d78860f21790b24196c408e747d90dabd2b9c84c252",
              "registry.example.io/example/example-web:b01f9b9a302384b5aca1d08c9b6e2c670be773e0-example"
            ],
            sizeBytes: 1582668028
          },
          {
            names: [
              "registry.example.io/example/example-web@sha256:d70bc3907d70b3a6734150c5151dc40f3a4a338fa0e7470c00514a4ed87b73b7",
              "registry.example.io/example/example-web:724e262f4928cd33141b6ceaa9cdab6f6dd1797b-example"
            ],
            sizeBytes: 1582566326
          },
          {
            names: [
              "registry.example.io/example/example-web@sha256:c3b3099fb514b8587f1d36565dfe6d01f2a5d2c83ace675c0f72f1cef5e0fe5a",
              "registry.example.io/example/example-web:b5a42e829d50b05f4f3f21019a97b2317fa3dd09-example"
            ],
            sizeBytes: 1582358317
          },
          {
            names: [
              "example.com/groupName/web@sha256:de971e1c453d0949904f77904d4d89deefa174b7ff2461000522208efb847cea",
              "example.com/groupName/web:ddexglobal9d2a9ebceaf965890b7200aac8b33eedc08495ca"
            ],
            sizeBytes: 1531945935
          },
          {
            names: [
              "example.com/groupName/web@sha256:c138a1d5cb627c44cb74463800c90cfdee4ce2001d730eda26c76749205d5e01",
              "example.com/groupName/web:ddexglobal18db43079af560680c01e82fe97da6923808caea"
            ],
            sizeBytes: 1529494968
          },
          {
            names: [
              "example.com/groupName/web@sha256:ecc47bd22c8e9254b32163805b1bee6c3fcde8b465fcf3f1d3e792e0fe732f6c",
              "example.com/groupName/web:ddexglobal8981d76cee0bdf8df3e4f1b1d7e58fc093051249"
            ],
            sizeBytes: 1529252995
          },
          {
            names: [
              "example.com/groupName/web@sha256:1ac7d0a1199926ea846c90a72796dd1d7676c9869ac8b322be81e704516b6bed",
              "example.com/groupName/web:ddexglobalb2cb2b8d46fbb79fb310e2e600a442775950f278"
            ],
            sizeBytes: 1528435622
          },
          {
            names: [
              "example.com/groupName/web@sha256:2a2dd20e187309fa6c64955182af62fbd29d8f1dc7532df87bad9af702ab614e",
              "example.com/groupName/web:ddexglobald3fdc36970479e0a0988eeae5837837c05dec054"
            ],
            sizeBytes: 1523314575
          },
          {
            names: [
              "example.com/groupName/web@sha256:9dda414af849a50fe0031a4a3ccfb9dfd79478d7205bb386c8c92d6368c61973",
              "example.com/groupName/web:ddexglobal79bd69d9e852b4e50fe2349133d1dc8ce1252ee9"
            ],
            sizeBytes: 1522940090
          },
          {
            names: [
              "example.com/groupName/web@sha256:19a209962cda632377a502b21c417b42359e9155c548836e93ab0b429fb66827",
              "example.com/groupName/web:ddexglobala21fbf38c6b825cdcf7d9b7fa35c5d1ed12adac3"
            ],
            sizeBytes: 1522792047
          },
          {
            names: [
              "example.com/groupName/web@sha256:e70b4c2e7ebda1498b0c5ea274292e7207bc17bee65c48f92bbd1e779f2029bd",
              "example.com/groupName/web:ddexglobalcd7790eedc05434da359068cb30bd654334c64f5"
            ],
            sizeBytes: 1522183174
          }
        ],
        volumesInUse: [
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-15946bff-efe3-11e9-bb4c-42010a920018",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-1ded38af-f956-11e9-bb4c-42010a920018"
        ],
        volumesAttached: [
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-1ded38af-f956-11e9-bb4c-42010a920018",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-1ded38af-f956-11e9-bb4c-42010a920018"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-15946bff-efe3-11e9-bb4c-42010a920018",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-15946bff-efe3-11e9-bb4c-42010a920018"
          }
        ]
      }
    },
    {
      metadata: {
        name: "nodes-z1gd",
        selfLink: "/api/v1/nodes/nodes-z1gd",
        uid: "674aa286-fa4b-11e9-bb4c-42010a920018",
        resourceVersion: "33227913",
        creationTimestamp: "2019-10-29T12:55:37Z",
        labels: {
          "beta.kubernetes.io/arch": "amd64",
          "beta.kubernetes.io/instance-type": "n1-standard-4",
          "beta.kubernetes.io/os": "linux",
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a",
          "kops.k8s.io/instancegroup": "nodes",
          "kubernetes.io/arch": "amd64",
          "kubernetes.io/hostname": "nodes-z1gd",
          "kubernetes.io/os": "linux",
          "kubernetes.io/role": "node",
          "node-role.kubernetes.io/node": ""
        },
        annotations: {
          "node.alpha.kubernetes.io/ttl": "0",
          "volumes.kubernetes.io/controller-managed-attach-detach": "true"
        }
      },
      spec: {
        podCIDR: "100.96.22.0/24",
        providerID: "gce://fiery-webbing-255306/asia-northeast1-a/nodes-z1gd"
      },
      status: {
        capacity: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "129900528Ki",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          memory: "15393532Ki",
          pods: "110"
        },
        allocatable: {
          "attachable-volumes-gce-pd": "127",
          cpu: "4",
          "ephemeral-storage": "119716326407",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          memory: "15291132Ki",
          pods: "110"
        },
        conditions: [
          {
            type: "NetworkUnavailable",
            status: "False",
            lastHeartbeatTime: "2019-10-29T12:56:00Z",
            lastTransitionTime: "2019-10-29T12:56:00Z",
            reason: "RouteCreated",
            message: "RouteController created a route"
          },
          {
            type: "MemoryPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:47Z",
            lastTransitionTime: "2019-10-29T12:55:37Z",
            reason: "KubeletHasSufficientMemory",
            message: "kubelet has sufficient memory available"
          },
          {
            type: "DiskPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:47Z",
            lastTransitionTime: "2019-10-29T12:55:37Z",
            reason: "KubeletHasNoDiskPressure",
            message: "kubelet has no disk pressure"
          },
          {
            type: "PIDPressure",
            status: "False",
            lastHeartbeatTime: "2020-02-16T17:52:47Z",
            lastTransitionTime: "2019-10-29T12:55:37Z",
            reason: "KubeletHasSufficientPID",
            message: "kubelet has sufficient PID available"
          },
          {
            type: "Ready",
            status: "True",
            lastHeartbeatTime: "2020-02-16T17:52:47Z",
            lastTransitionTime: "2019-10-29T12:55:37Z",
            reason: "KubeletReady",
            message: "kubelet is posting ready status. AppArmor enabled"
          }
        ],
        addresses: [
          {
            type: "InternalIP",
            address: "10.146.0.46"
          },
          {
            type: "ExternalIP",
            address: "34.84.186.61"
          },
          {
            type: "InternalDNS",
            address:
              "nodes-z1gd.asia-northeast1-a.c.fiery-webbing-255306.internal"
          },
          {
            type: "Hostname",
            address:
              "nodes-z1gd.asia-northeast1-a.c.fiery-webbing-255306.internal"
          }
        ],
        daemonEndpoints: {
          kubeletEndpoint: {
            Port: 10250
          }
        },
        nodeInfo: {
          machineID: "2ddf0c80d49d0a0ba7f948bad7c43240",
          systemUUID: "2DDF0C80-D49D-0A0B-A7F9-48BAD7C43240",
          bootID: "fe80b530-969c-45e5-b6e1-548b3548e0eb",
          kernelVersion: "4.15.0-1044-gcp",
          osImage: "Ubuntu 18.04.3 LTS",
          containerRuntimeVersion: "docker://18.6.3",
          kubeletVersion: "v1.14.6",
          kubeProxyVersion: "v1.14.6",
          operatingSystem: "linux",
          architecture: "amd64"
        },
        images: [
          {
            names: [
              "example.com/groupName/web@sha256:c86037fb921832fa72b76af19197e257118c4722579067e7e8209b2be32ecd94",
              "example.com/groupName/web:9d2a9ebceaf965890b7200aac8b33eedc08495ca"
            ],
            sizeBytes: 1653019696
          },
          {
            names: [
              "example.com/groupName/web@sha256:dc7a2e1df86294bba3f0163c57fde259e75b2e42f24bebed410a611e6e45ed27",
              "example.com/groupName/web:web2"
            ],
            sizeBytes: 1653005575
          },
          {
            names: [
              "example.com/groupName/web@sha256:5c426491e96871829f0a45071557c2d5c9a14bdf1223444a07b730d99624cae1"
            ],
            sizeBytes: 1652600423
          },
          {
            names: [
              "example.com/groupName/web@sha256:de872c20ec5554c8e62e35ed1584dc7f57bb6ac623acac514917b85007158c7a",
              "example.com/groupName/web:master"
            ],
            sizeBytes: 1652512610
          },
          {
            names: [
              "example.com/groupName/web@sha256:4b5a7f12bc48417a8e39fae5b11fc1662ab76dbaf905ca7c9665597deb39f29e"
            ],
            sizeBytes: 1652475454
          },
          {
            names: [
              "example.com/groupName/web@sha256:0cc388b2a90ca9abdbded4c0d710203d5ba2339609594188d785f821940cb186",
              "example.com/groupName/web:7fc6b900f85385ac37f0b15e322c35641e8abd9b"
            ],
            sizeBytes: 1652346274
          },
          {
            names: [
              "example.com/groupName/web@sha256:ed0dab1a037019eac1e67e082966a22cb8ca207301e2c8fc03bce8a4ddc9c70e"
            ],
            sizeBytes: 1652325324
          },
          {
            names: [
              "example.com/groupName/web@sha256:f40d1fe35b517e980816d1ee076e133a6611339cc9057a2ad6ec4e42979a7c2a"
            ],
            sizeBytes: 1652262084
          },
          {
            names: [
              "example.com/groupName/web@sha256:a2a5e507de4106eb63a8f4bb0a407fd7e99cd8b5328663486d8def9a3aa0b7be"
            ],
            sizeBytes: 1652252365
          },
          {
            names: [
              "example.com/groupName/web@sha256:5a9c29b232b403e69baaa3e2daa61c9a5927dede9bea87b20639cf3191605520"
            ],
            sizeBytes: 1652242499
          },
          {
            names: [
              "example.com/groupName/web@sha256:6f6c728522c748a9cdb2b42ebdae404d6aad8a02bd924576f16c72d2d0c2e546",
              "example.com/groupName/web:e34b3b51a2a14e006fe52b3d60da589a8164a96d"
            ],
            sizeBytes: 1652126193
          },
          {
            names: [
              "example.com/groupName/web@sha256:a079024390d82568100e9e3b66942f4cbe5c8fc81c022b315e9561b3a11c1c04",
              "example.com/groupName/web:d4ac59a597124e6ad6dd9af099bc96c04e483b46"
            ],
            sizeBytes: 1652011439
          },
          {
            names: [
              "example.com/groupName/web@sha256:54e41e16bccff50d20b6fcd93915a44152e30d01f0c6028cdebb110cbc094ef1",
              "example.com/groupName/web:952b7bd865ac23ec84c2a4d9574d9618ebfefd37"
            ],
            sizeBytes: 1651982965
          },
          {
            names: [
              "example.com/groupName/web@sha256:21916facf0929158dab06bf0afbed89c18ac42b634ab42dac60f4a1e301626ae"
            ],
            sizeBytes: 1651946842
          },
          {
            names: [
              "example.com/groupName/web@sha256:9b3e8ac438802eb7a62e09a021ed021fcce3ee2f3765e2a57a81a5c3b1ed29a7",
              "example.com/groupName/web:7de9958a52d475456823e521123a47cc2f0029c2"
            ],
            sizeBytes: 1651896067
          },
          {
            names: [
              "example.com/groupName/web@sha256:7045d1b84fbe6cd5f16b2ab492b7ce8e7bab0d92eede12f3fd92a097797871ff"
            ],
            sizeBytes: 1651856247
          },
          {
            names: [
              "example.com/groupName/web@sha256:75c0520e3d9378d8d3345ab01ea1600290deda67b6f138a0ef82c0e1f36099d5"
            ],
            sizeBytes: 1651575001
          },
          {
            names: [
              "example.com/groupName/web@sha256:19a9e8e5de1e9539c92b0e8869bca3277b0444492a1d6dd8c3dbdc3a8924af9b"
            ],
            sizeBytes: 1651503943
          },
          {
            names: [
              "example.com/groupName/web@sha256:aad2cf415b51a53ff5a0bf7fe4487db87fb76bcd4031f2510479a1b74bf2ecca"
            ],
            sizeBytes: 1651491189
          },
          {
            names: [
              "example.com/groupName/web@sha256:0f7c5f9e3d6eda01d753ed250a54b48ee293d48ae2090ed14fc3df6a6ecfe1a5"
            ],
            sizeBytes: 1651478779
          },
          {
            names: [
              "example.com/groupName/web@sha256:ac632ec427d700cb35e1c51556dd9519ac5fec23683b3eb4ece15dff681fdf13"
            ],
            sizeBytes: 1651363618
          },
          {
            names: [
              "example.com/groupName/web@sha256:e0ce81174e55f133dd46615e793ba6d86973e45458dbb93a03c81bef0efa129c"
            ],
            sizeBytes: 1651294116
          },
          {
            names: [
              "example.com/groupName/web@sha256:6a71a63fd10746a46d016940fd87283196bd0d3d02e1cdb78fd6d32a6514595d"
            ],
            sizeBytes: 1651262669
          },
          {
            names: [
              "example.com/groupName/web@sha256:e3609388b8fcb4736fb60c530233be8f296bff8de87156e1d823d613f8f20744"
            ],
            sizeBytes: 1651005915
          },
          {
            names: [
              "example.com/groupName/web@sha256:0c5c670fad43b0a2ffb7a5ea470fe9e7627df6f5f5f8878e9fab3516dd24dbde",
              "example.com/groupName/web:staging"
            ],
            sizeBytes: 1650927825
          },
          {
            names: [
              "example.com/groupName/web@sha256:91316dd7b5147d80393543c0283ccdf053416f1e0f163ff0fe2ddcd2bec1e355"
            ],
            sizeBytes: 1650529594
          },
          {
            names: [
              "example.com/groupName/web@sha256:210c4bf872067f442b65ddfc46848c24128966dcec1d7a93b2e0d472e47cba05",
              "example.com/groupName/web:4afd4b0cdfc4b4abb87cefe9d78d7419ec0f6e13"
            ],
            sizeBytes: 1650211720
          },
          {
            names: [
              "example.com/groupName/web@sha256:44272f061afdb1c9dccd7109ce6da1db81e49ea961139f8b1121af639b59c553",
              "example.com/groupName/web:995c766cae730c8c0a746cd980e9c23f6b28533e"
            ],
            sizeBytes: 1650197696
          },
          {
            names: [
              "example.com/groupName/web@sha256:a14d5a8f76bf6a0b3e9faafbf599f9a8b33d838aa2e39f17bc5cca2c29d060fa"
            ],
            sizeBytes: 1650167648
          },
          {
            names: [
              "example.com/groupName/web@sha256:70fcfea63185d6da0d1dd46c24ece5c36c83d10cf2431847f6245d213597626d",
              "example.com/groupName/web:4844c35a6b5a82edd72c6ad63e3431fa22bd9fd7"
            ],
            sizeBytes: 1650053214
          },
          {
            names: [
              "example.com/groupName/web@sha256:5763ea71a143147bec086192d4689062dbd78ba1180afd0509eb90ac36f13838"
            ],
            sizeBytes: 1650051583
          },
          {
            names: [
              "example.com/groupName/web@sha256:6adf45635e07589999104681201b5848fa0e212366ed13cb5070f276c91d8797"
            ],
            sizeBytes: 1650048178
          },
          {
            names: [
              "example.com/groupName/web@sha256:a2fea408c5187f486c09df089f12aab8edb6e4cb8e211f423d428d2abdc56f1f"
            ],
            sizeBytes: 1650039701
          },
          {
            names: [
              "example.com/groupName/web@sha256:cadfafde141fd284ab00fd70b2276d7fe3239ef6b6b56ee648c9b0511bb5062c"
            ],
            sizeBytes: 1650034882
          },
          {
            names: [
              "example.com/groupName/web@sha256:68c32200fe7d2442cea5008fb99c021f6cf918a3800389235032126ad6c0ca23"
            ],
            sizeBytes: 1650012078
          },
          {
            names: [
              "example.com/groupName/web@sha256:ed3aa3324d6395843b16c39fef5a75732e4b6d1e25331846a2a18e18dd465696"
            ],
            sizeBytes: 1649992313
          },
          {
            names: [
              "example.com/groupName/web@sha256:0209688f1271408d7092c532c2796f543f957b673f011633ab0ff7dcda707ad1"
            ],
            sizeBytes: 1649944977
          },
          {
            names: [
              "example.com/groupName/web@sha256:2f06307ddd1152fe39c501dd9a9b23c87bf3200494026753bcb304d0f04fb200"
            ],
            sizeBytes: 1649892286
          },
          {
            names: [
              "example.com/groupName/web@sha256:d267d1249cdb19c0b7382ad22be5dd2fa6cb58778de07f92508ef203f20490b1"
            ],
            sizeBytes: 1649869339
          },
          {
            names: [
              "example.com/groupName/web@sha256:9466977006d7bde8afb00c70782bba1fce731b5730e55a703bc7081ce12d2f7d",
              "example.com/groupName/web:e4b196e1b3544b5d9f24a7dd479518fa80813acd"
            ],
            sizeBytes: 1649394009
          },
          {
            names: [
              "example.com/groupName/web@sha256:c3c9a8d6e57b625302071fd3c5058a0fe983e8f9ef932c152826cf2c910e813c",
              "example.com/groupName/web:99b2e458de2198d3980f1fc02bc76a034206e05f"
            ],
            sizeBytes: 1649198189
          },
          {
            names: [
              "example.com/groupName/web@sha256:b64e4da43113d1085c4ac3d7760a3750c5ec82e1114c0f70415832e7806b886a"
            ],
            sizeBytes: 1649173460
          },
          {
            names: [
              "example.com/groupName/web@sha256:9826f0b93eae78f4181cee6d00b79301cb3e3ce0b24d9d415193ba6a19260051"
            ],
            sizeBytes: 1648935377
          },
          {
            names: [
              "example.com/groupName/web@sha256:0bd253221fc03528f15f475120e30b815373285d11a52509d8438473384f9f8b",
              "example.com/groupName/web:17642bfec7831b971109a402abd5daf4977ea50d"
            ],
            sizeBytes: 1648911061
          },
          {
            names: [
              "example.com/groupName/web@sha256:ecdfcbd82c13cb55884b0db5fa1423942fd2349a68e31390a7130918d5110044"
            ],
            sizeBytes: 1648797101
          },
          {
            names: [
              "example.com/groupName/web@sha256:ab9f36a4fb2db1855cadca7e236c1baede9fc9e85c3c9149aa138ade5b4a2330"
            ],
            sizeBytes: 1648715615
          },
          {
            names: [
              "example.com/groupName/web@sha256:a2e7e9ffd6eed068a634d21f2fc601586eb93c5449da73fc9a89e64469377cf4"
            ],
            sizeBytes: 1648705077
          },
          {
            names: [
              "example.com/groupName/web@sha256:4f78c4ce1161216bc31010d249a4de9e8de3c0e211f2cbd3bc6ec882e32f72e7"
            ],
            sizeBytes: 1648676387
          },
          {
            names: [
              "example.com/groupName/web@sha256:20d886f22abcee96816f572a4345989a8581676dbfbe431c6d680334a49ec521"
            ],
            sizeBytes: 1648656264
          },
          {
            names: [
              "example.com/groupName/web@sha256:41ab52664123471ca77e1b2dc84543b68ab95b523227e422be50c8afb183ed5c"
            ],
            sizeBytes: 1648609299
          }
        ],
        volumesInUse: [
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-32cc7356-ec22-11e9-9910-42010a92000c",
          "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-a60c10b3-ec20-11e9-9910-42010a92000c"
        ],
        volumesAttached: [
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-32cc7356-ec22-11e9-9910-42010a92000c",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-32cc7356-ec22-11e9-9910-42010a92000c"
          },
          {
            name:
              "kubernetes.io/gce-pd/example-k8s-local-dynamic-pvc-a60c10b3-ec20-11e9-9910-42010a92000c",
            devicePath:
              "/dev/disk/by-id/google-example-k8s-local-dynamic-pvc-a60c10b3-ec20-11e9-9910-42010a92000c"
          }
        ]
      }
    }
  ]
};

const apiV1PersistentVolumnBody = {
  kind: "PersistentVolumeList",
  apiVersion: "v1",
  metadata: {
    selfLink: "/api/v1/persistentvolumes",
    resourceVersion: "33233654"
  },
  items: [
    {
      metadata: {
        name: "pvc-049d3549-f569-11e9-bb4c-42010a920018",
        selfLink:
          "/api/v1/persistentvolumes/pvc-049d3549-f569-11e9-bb4c-42010a920018",
        uid: "0f30b01f-f569-11e9-bb4c-42010a920018",
        resourceVersion: "3077747",
        creationTimestamp: "2019-10-23T07:45:18Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "5Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-049d3549-f569-11e9-bb4c-42010a920018",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "canals",
          name: "canals-influxdb",
          uid: "049d3549-f569-11e9-bb4c-42010a920018",
          apiVersion: "v1",
          resourceVersion: "3077732"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-0668ce38-ec22-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-0668ce38-ec22-11e9-9910-42010a92000c",
        uid: "0aa7c5d5-ec22-11e9-9910-42010a92000c",
        resourceVersion: "276837",
        creationTimestamp: "2019-10-11T12:24:16Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "200Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-0668ce38-ec22-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "kafka",
          name: "data-kafka-0",
          uid: "0668ce38-ec22-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "276825"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-06878024-efe3-11e9-bb4c-42010a920018",
        selfLink:
          "/api/v1/persistentvolumes/pvc-06878024-efe3-11e9-bb4c-42010a920018",
        uid: "1059c5d4-efe3-11e9-bb4c-42010a920018",
        resourceVersion: "1310407",
        creationTimestamp: "2019-10-16T07:03:32Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "38Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-06878024-efe3-11e9-bb4c-42010a920018",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "loanbalance",
          name: "pg-disk",
          uid: "06878024-efe3-11e9-bb4c-42010a920018",
          apiVersion: "v1",
          resourceVersion: "1289943"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Released"
      }
    },
    {
      metadata: {
        name: "pvc-15946bff-efe3-11e9-bb4c-42010a920018",
        selfLink:
          "/api/v1/persistentvolumes/pvc-15946bff-efe3-11e9-bb4c-42010a920018",
        uid: "21a20313-efe3-11e9-bb4c-42010a920018",
        resourceVersion: "1290063",
        creationTimestamp: "2019-10-16T07:04:01Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "2Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-15946bff-efe3-11e9-bb4c-42010a920018",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "loanbalance",
          name: "redis-disk",
          uid: "15946bff-efe3-11e9-bb4c-42010a920018",
          apiVersion: "v1",
          resourceVersion: "1290048"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-1ded38af-f956-11e9-bb4c-42010a920018",
        selfLink:
          "/api/v1/persistentvolumes/pvc-1ded38af-f956-11e9-bb4c-42010a920018",
        uid: "25e87a53-f956-11e9-bb4c-42010a920018",
        resourceVersion: "4388115",
        creationTimestamp: "2019-10-28T07:40:01Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "19Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-1ded38af-f956-11e9-bb4c-42010a920018",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "sandbox",
          name: "athens-disk",
          uid: "1ded38af-f956-11e9-bb4c-42010a920018",
          apiVersion: "v1",
          resourceVersion: "4388094"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-32cc7356-ec22-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-32cc7356-ec22-11e9-9910-42010a92000c",
        uid: "377e1681-ec22-11e9-9910-42010a92000c",
        resourceVersion: "277058",
        creationTimestamp: "2019-10-11T12:25:31Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "200Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-32cc7356-ec22-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "kafka",
          name: "data-kafka-1",
          uid: "32cc7356-ec22-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "277045"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-4239f0a9-ebf7-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-4239f0a9-ebf7-11e9-9910-42010a92000c",
        uid: "4af56e97-ebf7-11e9-9910-42010a92000c",
        resourceVersion: "262117",
        creationTimestamp: "2019-10-11T07:18:15Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "1Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-4239f0a9-ebf7-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "kube-system",
          name: "datadir-etcd-0",
          uid: "4239f0a9-ebf7-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "235307"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-43d977e0-f3f5-11e9-bb4c-42010a920018",
        selfLink:
          "/api/v1/persistentvolumes/pvc-43d977e0-f3f5-11e9-bb4c-42010a920018",
        uid: "4fc1bfc2-f3f5-11e9-bb4c-42010a920018",
        resourceVersion: "2607231",
        creationTimestamp: "2019-10-21T11:24:14Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "1Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-43d977e0-f3f5-11e9-bb4c-42010a920018",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "sandbox",
          name: "kong-manager-disk",
          uid: "43d977e0-f3f5-11e9-bb4c-42010a920018",
          apiVersion: "v1",
          resourceVersion: "2607214"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-4d2fb66c-ec22-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-4d2fb66c-ec22-11e9-9910-42010a92000c",
        uid: "4fd37634-ec22-11e9-9910-42010a92000c",
        resourceVersion: "277182",
        creationTimestamp: "2019-10-11T12:26:12Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "200Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-4d2fb66c-ec22-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "kafka",
          name: "data-kafka-2",
          uid: "4d2fb66c-ec22-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "277165"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-4dbedcc9-ebf3-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-4dbedcc9-ebf3-11e9-9910-42010a92000c",
        uid: "59081d66-ebf3-11e9-9910-42010a92000c",
        resourceVersion: "262119",
        creationTimestamp: "2019-10-11T06:50:01Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "600Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-4dbedcc9-ebf3-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "ethereum",
          name: "geth-mainnet-storage-1",
          uid: "4dbedcc9-ebf3-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "231732"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-58078649-ec13-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-58078649-ec13-11e9-9910-42010a92000c",
        uid: "5f5f7f09-ec13-11e9-9910-42010a92000c",
        resourceVersion: "262121",
        creationTimestamp: "2019-10-11T10:39:16Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "94Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-58078649-ec13-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "monitoring",
          name: "redis-disk",
          uid: "58078649-ec13-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "261775"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-5946e3fb-ebf7-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-5946e3fb-ebf7-11e9-9910-42010a92000c",
        uid: "5cb3c375-ebf7-11e9-9910-42010a92000c",
        resourceVersion: "262124",
        creationTimestamp: "2019-10-11T07:18:45Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "1Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-5946e3fb-ebf7-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "kube-system",
          name: "datadir-etcd-1",
          uid: "5946e3fb-ebf7-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "235401"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-5cf8a828-ec13-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-5cf8a828-ec13-11e9-9910-42010a92000c",
        uid: "6894b35d-ec13-11e9-9910-42010a92000c",
        resourceVersion: "262126",
        creationTimestamp: "2019-10-11T10:39:31Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "20Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-5cf8a828-ec13-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "monitoring",
          name: "grafana-data",
          uid: "5cf8a828-ec13-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "261840"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-5d97a56f-1c89-11ea-bb4c-42010a920018",
        selfLink:
          "/api/v1/persistentvolumes/pvc-5d97a56f-1c89-11ea-bb4c-42010a920018",
        uid: "62a26d2c-1c89-11ea-bb4c-42010a920018",
        resourceVersion: "15921770",
        creationTimestamp: "2019-12-12T02:44:57Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "10Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-5d97a56f-1c89-11ea-bb4c-42010a920018",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "example-staging-33437cd2",
          name: "postgres-data-disk",
          uid: "5d97a56f-1c89-11ea-bb4c-42010a920018",
          apiVersion: "v1",
          resourceVersion: "15921744"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-5da23b0c-1c89-11ea-bb4c-42010a920018",
        selfLink:
          "/api/v1/persistentvolumes/pvc-5da23b0c-1c89-11ea-bb4c-42010a920018",
        uid: "62bcdf44-1c89-11ea-bb4c-42010a920018",
        resourceVersion: "15921776",
        creationTimestamp: "2019-12-12T02:44:58Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "1Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-5da23b0c-1c89-11ea-bb4c-42010a920018",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "example-staging-33437cd2",
          name: "redis-data-disk",
          uid: "5da23b0c-1c89-11ea-bb4c-42010a920018",
          apiVersion: "v1",
          resourceVersion: "15921745"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-5da7a978-1c89-11ea-bb4c-42010a920018",
        selfLink:
          "/api/v1/persistentvolumes/pvc-5da7a978-1c89-11ea-bb4c-42010a920018",
        uid: "62bfedde-1c89-11ea-bb4c-42010a920018",
        resourceVersion: "15921780",
        creationTimestamp: "2019-12-12T02:44:58Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "1Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-5da7a978-1c89-11ea-bb4c-42010a920018",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "example-staging-33437cd2",
          name: "etcd-data-disk",
          uid: "5da7a978-1c89-11ea-bb4c-42010a920018",
          apiVersion: "v1",
          resourceVersion: "15921746"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-6c527549-ebf7-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-6c527549-ebf7-11e9-9910-42010a92000c",
        uid: "776831f7-ebf7-11e9-9910-42010a92000c",
        resourceVersion: "262127",
        creationTimestamp: "2019-10-11T07:19:30Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "1Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-6c527549-ebf7-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "kube-system",
          name: "datadir-etcd-2",
          uid: "6c527549-ebf7-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "235509"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-7bca13df-fa1d-11e9-bb4c-42010a920018",
        selfLink:
          "/api/v1/persistentvolumes/pvc-7bca13df-fa1d-11e9-bb4c-42010a920018",
        uid: "813f0c2e-fa1d-11e9-bb4c-42010a920018",
        resourceVersion: "4642611",
        creationTimestamp: "2019-10-29T07:27:04Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "10Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-7bca13df-fa1d-11e9-bb4c-42010a920018",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "example-ropsten-59c1702d",
          name: "postgres-data-disk",
          uid: "7bca13df-fa1d-11e9-bb4c-42010a920018",
          apiVersion: "v1",
          resourceVersion: "4642539"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-7bd06182-fa1d-11e9-bb4c-42010a920018",
        selfLink:
          "/api/v1/persistentvolumes/pvc-7bd06182-fa1d-11e9-bb4c-42010a920018",
        uid: "81477264-fa1d-11e9-bb4c-42010a920018",
        resourceVersion: "4642616",
        creationTimestamp: "2019-10-29T07:27:04Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "1Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-7bd06182-fa1d-11e9-bb4c-42010a920018",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "example-ropsten-59c1702d",
          name: "redis-data-disk",
          uid: "7bd06182-fa1d-11e9-bb4c-42010a920018",
          apiVersion: "v1",
          resourceVersion: "4642540"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-7ed977ca-fad6-11e9-bb4c-42010a920018",
        selfLink:
          "/api/v1/persistentvolumes/pvc-7ed977ca-fad6-11e9-bb4c-42010a920018",
        uid: "8af212eb-fad6-11e9-bb4c-42010a920018",
        resourceVersion: "4869178",
        creationTimestamp: "2019-10-30T05:31:37Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "10Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-7ed977ca-fad6-11e9-bb4c-42010a920018",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "loanbalance-1adebaec",
          name: "postgres-data-disk",
          uid: "7ed977ca-fad6-11e9-bb4c-42010a920018",
          apiVersion: "v1",
          resourceVersion: "4869151"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-7edd74a5-fad6-11e9-bb4c-42010a920018",
        selfLink:
          "/api/v1/persistentvolumes/pvc-7edd74a5-fad6-11e9-bb4c-42010a920018",
        uid: "8a0fdfba-fad6-11e9-bb4c-42010a920018",
        resourceVersion: "4869169",
        creationTimestamp: "2019-10-30T05:31:35Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "1Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-7edd74a5-fad6-11e9-bb4c-42010a920018",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "loanbalance-1adebaec",
          name: "redis-data-disk",
          uid: "7edd74a5-fad6-11e9-bb4c-42010a920018",
          apiVersion: "v1",
          resourceVersion: "4869152"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-8c70de5c-ec21-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-8c70de5c-ec21-11e9-9910-42010a92000c",
        uid: "9699b855-ec21-11e9-9910-42010a92000c",
        resourceVersion: "276317",
        creationTimestamp: "2019-10-11T12:21:01Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "1Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-8c70de5c-ec21-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "kafka",
          name: "data-pzoo-1",
          uid: "8c70de5c-ec21-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "276302"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-902a38eb-ec18-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-902a38eb-ec18-11e9-9910-42010a92000c",
        uid: "93d589f2-ec18-11e9-9910-42010a92000c",
        resourceVersion: "267043",
        creationTimestamp: "2019-10-11T11:16:31Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "1863Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-902a38eb-ec18-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "monitoring",
          name: "log-node-disk",
          uid: "902a38eb-ec18-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "267020"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-95df6a12-1bef-11ea-bb4c-42010a920018",
        selfLink:
          "/api/v1/persistentvolumes/pvc-95df6a12-1bef-11ea-bb4c-42010a920018",
        uid: "9bf2a6ff-1bef-11ea-bb4c-42010a920018",
        resourceVersion: "15921418",
        creationTimestamp: "2019-12-11T08:24:11Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "10Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-95df6a12-1bef-11ea-bb4c-42010a920018",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "example-staging-33437cd2",
          name: "postgres-data-disk",
          uid: "95df6a12-1bef-11ea-bb4c-42010a920018",
          apiVersion: "v1",
          resourceVersion: "15722494"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Released"
      }
    },
    {
      metadata: {
        name: "pvc-95ea8266-1bef-11ea-bb4c-42010a920018",
        selfLink:
          "/api/v1/persistentvolumes/pvc-95ea8266-1bef-11ea-bb4c-42010a920018",
        uid: "99ae02e6-1bef-11ea-bb4c-42010a920018",
        resourceVersion: "15921378",
        creationTimestamp: "2019-12-11T08:24:07Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "1Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-95ea8266-1bef-11ea-bb4c-42010a920018",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "example-staging-33437cd2",
          name: "redis-data-disk",
          uid: "95ea8266-1bef-11ea-bb4c-42010a920018",
          apiVersion: "v1",
          resourceVersion: "15722414"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Released"
      }
    },
    {
      metadata: {
        name: "pvc-95eff4c4-1bef-11ea-bb4c-42010a920018",
        selfLink:
          "/api/v1/persistentvolumes/pvc-95eff4c4-1bef-11ea-bb4c-42010a920018",
        uid: "99adeb6d-1bef-11ea-bb4c-42010a920018",
        resourceVersion: "15921427",
        creationTimestamp: "2019-12-11T08:24:07Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "1Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-95eff4c4-1bef-11ea-bb4c-42010a920018",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "example-staging-33437cd2",
          name: "etcd-data-disk",
          uid: "95eff4c4-1bef-11ea-bb4c-42010a920018",
          apiVersion: "v1",
          resourceVersion: "15722418"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Released"
      }
    },
    {
      metadata: {
        name: "pvc-95f12f3a-ebf3-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-95f12f3a-ebf3-11e9-9910-42010a92000c",
        uid: "a01d1425-ebf3-11e9-9910-42010a92000c",
        resourceVersion: "262128",
        creationTimestamp: "2019-10-11T06:52:00Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "600Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-95f12f3a-ebf3-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "ethereum",
          name: "geth-mainnet-storage-2",
          uid: "95f12f3a-ebf3-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "232005"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-9f5dd2ee-ec12-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-9f5dd2ee-ec12-11e9-9910-42010a92000c",
        uid: "a35c9a30-ec12-11e9-9910-42010a92000c",
        resourceVersion: "262130",
        creationTimestamp: "2019-10-11T10:34:00Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "19Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-9f5dd2ee-ec12-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "monitoring",
          name: "alertmanager",
          uid: "9f5dd2ee-ec12-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "260892"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-a002e410-ec12-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-a002e410-ec12-11e9-9910-42010a92000c",
        uid: "a4e122a9-ec12-11e9-9910-42010a92000c",
        resourceVersion: "262131",
        creationTimestamp: "2019-10-11T10:34:03Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "466Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-a002e410-ec12-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "monitoring",
          name: "prometheus-tsdb",
          uid: "a002e410-ec12-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "260891"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-a5c0a640-ec21-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-a5c0a640-ec21-11e9-9910-42010a92000c",
        uid: "b0fb11dc-ec21-11e9-9910-42010a92000c",
        resourceVersion: "276448",
        creationTimestamp: "2019-10-11T12:21:45Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "1Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-a5c0a640-ec21-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "kafka",
          name: "data-pzoo-2",
          uid: "a5c0a640-ec21-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "276437"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-a60c10b3-ec20-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-a60c10b3-ec20-11e9-9910-42010a92000c",
        uid: "ae08f542-ec20-11e9-9910-42010a92000c",
        resourceVersion: "275284",
        creationTimestamp: "2019-10-11T12:14:31Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "1Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-a60c10b3-ec20-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "kafka",
          name: "data-pzoo-0",
          uid: "a60c10b3-ec20-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "275270"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-ae283ea9-eb27-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-ae283ea9-eb27-11e9-9910-42010a92000c",
        uid: "b264af90-eb27-11e9-9910-42010a92000c",
        resourceVersion: "262133",
        creationTimestamp: "2019-10-10T06:32:14Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "19Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-ae283ea9-eb27-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "kube-system",
          name: "postgres-disk",
          uid: "ae283ea9-eb27-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "101033"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-c17224ed-ebcf-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-c17224ed-ebcf-11e9-9910-42010a92000c",
        uid: "ca964c5e-ebcf-11e9-9910-42010a92000c",
        resourceVersion: "262134",
        creationTimestamp: "2019-10-11T02:35:30Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "38Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-c17224ed-ebcf-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "kube-system",
          name: "pg-disk",
          uid: "c17224ed-ebcf-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "207041"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-cfc60bfb-ebf0-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-cfc60bfb-ebf0-11e9-9910-42010a92000c",
        uid: "d4eb0f49-ebf0-11e9-9910-42010a92000c",
        resourceVersion: "262136",
        creationTimestamp: "2019-10-11T06:32:00Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "400Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-cfc60bfb-ebf0-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "ethereum",
          name: "geth-ropsten-storage",
          uid: "cfc60bfb-ebf0-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "229444"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-d699ef5d-ebf6-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-d699ef5d-ebf6-11e9-9910-42010a92000c",
        uid: "df67effb-ebf6-11e9-9910-42010a92000c",
        resourceVersion: "2614913",
        creationTimestamp: "2019-10-11T07:15:15Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "932Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-d699ef5d-ebf6-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "sandbox",
          name: "pg-disk",
          uid: "d699ef5d-ebf6-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "234919"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-d9ec9070-ec05-11e9-9910-42010a92000c",
        selfLink:
          "/api/v1/persistentvolumes/pvc-d9ec9070-ec05-11e9-9910-42010a92000c",
        uid: "e459af36-ec05-11e9-9910-42010a92000c",
        resourceVersion: "262141",
        creationTimestamp: "2019-10-11T09:02:46Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "10Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-d9ec9070-ec05-11e9-9910-42010a92000c",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "sandbox",
          name: "redis-disk",
          uid: "d9ec9070-ec05-11e9-9910-42010a92000c",
          apiVersion: "v1",
          resourceVersion: "248268"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-dc2cf372-127a-11ea-bb4c-42010a920018",
        selfLink:
          "/api/v1/persistentvolumes/pvc-dc2cf372-127a-11ea-bb4c-42010a920018",
        uid: "e20b9b05-127a-11ea-bb4c-42010a920018",
        resourceVersion: "15722200",
        creationTimestamp: "2019-11-29T07:35:57Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "10Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-dc2cf372-127a-11ea-bb4c-42010a920018",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "example-staging-33437cd2",
          name: "postgres-data-disk",
          uid: "dc2cf372-127a-11ea-bb4c-42010a920018",
          apiVersion: "v1",
          resourceVersion: "12583288"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Released"
      }
    },
    {
      metadata: {
        name: "pvc-dc422f82-127a-11ea-bb4c-42010a920018",
        selfLink:
          "/api/v1/persistentvolumes/pvc-dc422f82-127a-11ea-bb4c-42010a920018",
        uid: "e1fab001-127a-11ea-bb4c-42010a920018",
        resourceVersion: "15722198",
        creationTimestamp: "2019-11-29T07:35:57Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "1Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-dc422f82-127a-11ea-bb4c-42010a920018",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "example-staging-33437cd2",
          name: "redis-data-disk",
          uid: "dc422f82-127a-11ea-bb4c-42010a920018",
          apiVersion: "v1",
          resourceVersion: "12583287"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Released"
      }
    },
    {
      metadata: {
        name: "pvc-dc472cf8-127a-11ea-bb4c-42010a920018",
        selfLink:
          "/api/v1/persistentvolumes/pvc-dc472cf8-127a-11ea-bb4c-42010a920018",
        uid: "e1f3c079-127a-11ea-bb4c-42010a920018",
        resourceVersion: "15722206",
        creationTimestamp: "2019-11-29T07:35:57Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "1Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-dc472cf8-127a-11ea-bb4c-42010a920018",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "example-staging-33437cd2",
          name: "etcd-data-disk",
          uid: "dc472cf8-127a-11ea-bb4c-42010a920018",
          apiVersion: "v1",
          resourceVersion: "12583289"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Released"
      }
    },
    {
      metadata: {
        name: "pvc-dd18634a-eff3-11e9-bb4c-42010a920018",
        selfLink:
          "/api/v1/persistentvolumes/pvc-dd18634a-eff3-11e9-bb4c-42010a920018",
        uid: "e535ee50-eff3-11e9-bb4c-42010a920018",
        resourceVersion: "1310688",
        creationTimestamp: "2019-10-16T09:04:01Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "38Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-dd18634a-eff3-11e9-bb4c-42010a920018",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "loanbalance",
          name: "pg-disk",
          uid: "dd18634a-eff3-11e9-bb4c-42010a920018",
          apiVersion: "v1",
          resourceVersion: "1310671"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    },
    {
      metadata: {
        name: "pvc-e33e3055-fa1d-11e9-bb4c-42010a920018",
        selfLink:
          "/api/v1/persistentvolumes/pvc-e33e3055-fa1d-11e9-bb4c-42010a920018",
        uid: "ec185c23-fa1d-11e9-bb4c-42010a920018",
        resourceVersion: "4643470",
        creationTimestamp: "2019-10-29T07:30:03Z",
        labels: {
          "failure-domain.beta.kubernetes.io/region": "asia-northeast1",
          "failure-domain.beta.kubernetes.io/zone": "asia-northeast1-a"
        },
        annotations: {
          "kubernetes.io/createdby": "gce-pd-dynamic-provisioner",
          "pv.kubernetes.io/bound-by-controller": "yes",
          "pv.kubernetes.io/provisioned-by": "kubernetes.io/gce-pd"
        },
        finalizers: ["kubernetes.io/pv-protection"]
      },
      spec: {
        capacity: {
          storage: "1Gi"
        },
        gcePersistentDisk: {
          pdName:
            "example-k8s-local-dynamic-pvc-e33e3055-fa1d-11e9-bb4c-42010a920018",
          fsType: "ext4"
        },
        accessModes: ["ReadWriteOnce"],
        claimRef: {
          kind: "PersistentVolumeClaim",
          namespace: "example-ropsten-59c1702d",
          name: "etcd-data-disk",
          uid: "e33e3055-fa1d-11e9-bb4c-42010a920018",
          apiVersion: "v1",
          resourceVersion: "4643437"
        },
        persistentVolumeReclaimPolicy: "Retain",
        storageClassName: "ssd",
        volumeMode: "Filesystem",
        nodeAffinity: {
          required: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "failure-domain.beta.kubernetes.io/zone",
                    operator: "In",
                    values: ["asia-northeast1-a"]
                  },
                  {
                    key: "failure-domain.beta.kubernetes.io/region",
                    operator: "In",
                    values: ["asia-northeast1"]
                  }
                ]
              }
            ]
          }
        }
      },
      status: {
        phase: "Bound"
      }
    }
  ]
};

const apiV1Alpha1ComponentListBody = {
  apiVersion: "core.kapp.dev/v1alpha1",
  items: [
    {
      apiVersion: "core.kapp.dev/v1alpha1",
      kind: "ComponentTemplate",
      metadata: {
        annotations: {
          "kubectl.kubernetes.io/last-applied-configuration":
            '{"apiVersion":"core.kapp.dev/v1alpha1","kind":"ComponentTemplate","metadata":{"annotations":{},"name":"componenttemplate-sample","namespace":"default"},"spec":{"afterStart":["ls -alh /tmp/"],"beforeDestroy":["echo \\"ByeBye\\""],"beforeStart":["ls -alh /","echo \\"test\\" \\u003e /tmp/bbq","ls -alh /tmp"],"env":[{"componentPort":"api/http","name":"API_URL","prefix":"http://","suffix":"/v4"},{"name":"SOME_COMMON_ENV","sharedEnv":"SOME_COMMON_ENV"},{"name":"SOME_ENV","value":"SOME_VALUE"}],"image":"nginx:alpine","name":"web","ports":[{"containerPort":80,"name":"http","servicePort":80}],"resources":{"cpu":{"max":"100m","min":"10m"},"memory":{"max":"2G","min":"500M"}},"volumeMounts":[{"mountPath":"/tmp/","name":"nginx-config"}]}}\n'
        },
        creationTimestamp: "2020-02-17T03:26:53Z",
        generation: 1,
        name: "componenttemplate-sample",
        namespace: "default",
        resourceVersion: "3048",
        selfLink:
          "/apis/core.kapp.dev/v1alpha1/namespaces/default/componenttemplates/componenttemplate-sample",
        uid: "35df64ba-c35d-4a3b-a377-deebeeb6bf0e"
      },
      spec: {
        afterStart: ["ls -alh /tmp/"],
        beforeDestroy: ['echo "Bye Bye"'],
        beforeStart: ["ls -alh /", 'echo "test" > /tmp/bbq', "ls -alh /tmp"],
        env: [
          {
            componentPort: "api/http",
            name: "API_URL",
            prefix: "http://",
            suffix: "/v4"
          },
          {
            name: "SOME_COMMON_ENV",
            sharedEnv: "SOME_COMMON_ENV"
          },
          {
            name: "SOME_ENV",
            value: "SOME_VALUE"
          }
        ],
        image: "nginx:alpine",
        name: "web",
        ports: [
          {
            containerPort: 80,
            name: "http",
            servicePort: 80
          }
        ],
        resources: {
          cpu: {
            max: "100m",
            min: "10m"
          },
          memory: {
            max: "2G",
            min: "500M"
          }
        },
        volumeMounts: [
          {
            mountPath: "/tmp/",
            name: "nginx-config"
          }
        ]
      }
    }
  ],
  kind: "ComponentTemplateList",
  metadata: {
    continue: "",
    resourceVersion: "3304",
    selfLink: "/apis/core.kapp.dev/v1alpha1/componenttemplates"
  }
};

export const apiV1Nodes: V1NodeList = ObjectSerializer.deserialize(
  apiV1NodesBody,
  "V1NodeList"
);

export const apiV1PersistentVolumns: V1PersistentVolumeList = ObjectSerializer.deserialize(
  apiV1PersistentVolumnBody,
  "V1PersistentVolumeList"
);

export const apiV1Alpha1ComponentList: V1Alpha1ComponentList = ObjectSerializer.deserialize(
  apiV1Alpha1ComponentListBody,
  "V1Alpha1ComponentList"
);
