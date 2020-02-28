import { SidenavGroupProps } from "../../widgets/Sidenav";

export const drawerWidth = 280;

export const sidenavGroups: SidenavGroupProps[] = [
  {
    text: "Application",
    items: [
      {
        text: "Application",
        to: "/applications",
        icon: "apps",
        type: "normal"
      },
      {
        text: "Component Template",
        to: "/componenttemplates",
        icon: "extension",
        type: "normal"
      },
      {
        text: "Configs",
        to: "/configs",
        icon: "insert_drive_file",
        type: "normal"
      },
      {
        text: "Routes",
        to: "/routes",
        icon: "call_split",
        type: "normal"
      }
    ]
  },
  {
    text: "Cluster",
    items: [
      {
        text: "Nodes",
        to: "/cluster/nodes",
        type: "normal",
        icon: "computer"
      },
      {
        text: "Disks",
        to: "/cluster/disks",
        type: "normal",
        icon: "storage"
      },
      {
        text: "K8s Resources",
        to: "/cluster/k8s",
        type: "normal",
        icon: "settings"
      }
    ]
  },
  {
    text: "Monitoring",
    items: [
      {
        text: "Metrics",
        to: "/monitoring/metrics",
        type: "normal",
        icon: "multiline_chart"
      },
      {
        text: "Alerts",
        to: "/monitoring/alerts",
        type: "normal",
        icon: "report_problem"
      },
      {
        text: "DebugPage",
        to: "/monitoring/metrics",
        type: "normal",
        icon: "settings"
      }
    ]
  },
  {
    text: "Settings",
    items: [
      // {
      //   text: "Install",
      //   to: "/install",
      //   type: "normal",
      //   icon: "settings"
      // },
      {
        text: "Dependencies",
        to: "/settings/dependencies",
        type: "normal",
        icon: "view_comfy"
      }
    ]
  }
];
