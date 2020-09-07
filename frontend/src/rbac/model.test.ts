import { RBACEnforcer } from "rbac/model";

test("enforecer", async () => {
  const enforcer = new RBACEnforcer(`p, role_ns1Viewer, view, ns1, *
p, role_ns1Editor, edit, ns1, *
g, role_ns1Editor, role_ns1Viewer
g, role_ns1Owner, role_ns1Editor
p, role_ns1Owner, manage, ns1, *

p, role_ns2Viewer, view, ns2, *
p, role_ns2Editor, edit, ns2, *
p, role_ns2Owner, manage, ns2, *
g, role_ns2Editor, role_ns2Viewer
g, role_ns2Owner, role_ns2Editor

p, role_clusterViewer, view, *, *
p, role_clusterEditor, edit, *, *
g, role_clusterEditor, role_clusterViewer
g, role_clusterOwner, role_clusterEditor
p, role_clusterOwner, manage, *, *

g, ns1Viewer, role_ns1Viewer
g, ns1Editor, role_ns1Editor
g, ns1Owner, role_ns1Owner

g, clusterViewer, role_clusterViewer
g, clusterEditor, role_clusterEditor
g, clusterOwner, role_clusterOwner

# Nio can edit any component under ns2
p, Nio, edit, ns2, components/*`);

  await enforcer.init();

  await expect(enforcer.canViewNamespace("ns1Viewer", "ns1")).resolves.toBe(true);
  await expect(enforcer.canEditNamespace("ns1Viewer", "ns1")).resolves.toBe(false);
  await expect(enforcer.canManageNamespace("ns1Viewer", "ns1")).resolves.toBe(false);
  await expect(enforcer.canViewNamespace("ns1Viewer", "ns2")).resolves.toBe(false);
  await expect(enforcer.canEditNamespace("ns1Viewer", "ns2")).resolves.toBe(false);
  await expect(enforcer.canManageNamespace("ns1Viewer", "ns2")).resolves.toBe(false);

  await expect(enforcer.canViewNamespace("ns1Editor", "ns1")).resolves.toBe(true);
  await expect(enforcer.canEditNamespace("ns1Editor", "ns1")).resolves.toBe(true);
  await expect(enforcer.canManageNamespace("ns1Editor", "ns1")).resolves.toBe(false);
  await expect(enforcer.canViewNamespace("ns1Editor", "ns2")).resolves.toBe(false);
  await expect(enforcer.canEditNamespace("ns1Editor", "ns2")).resolves.toBe(false);
  await expect(enforcer.canManageNamespace("ns1Editor", "ns2")).resolves.toBe(false);

  await expect(enforcer.canViewNamespace("ns1Owner", "ns1")).resolves.toBe(true);
  await expect(enforcer.canEditNamespace("ns1Owner", "ns1")).resolves.toBe(true);
  await expect(enforcer.canManageNamespace("ns1Owner", "ns1")).resolves.toBe(true);
  await expect(enforcer.canViewNamespace("ns1Owner", "ns2")).resolves.toBe(false);
  await expect(enforcer.canEditNamespace("ns1Owner", "ns2")).resolves.toBe(false);
  await expect(enforcer.canManageNamespace("ns1Owner", "ns2")).resolves.toBe(false);

  await expect(enforcer.canViewNamespace("clusterViewer", "ns1")).resolves.toBe(true);
  await expect(enforcer.canEditNamespace("clusterViewer", "ns1")).resolves.toBe(false);
  await expect(enforcer.canManageNamespace("clusterViewer", "ns1")).resolves.toBe(false);
  await expect(enforcer.canViewNamespace("clusterViewer", "ns2")).resolves.toBe(true);
  await expect(enforcer.canEditNamespace("clusterViewer", "ns2")).resolves.toBe(false);
  await expect(enforcer.canManageNamespace("clusterViewer", "ns2")).resolves.toBe(false);

  await expect(enforcer.canViewNamespace("clusterEditor", "ns1")).resolves.toBe(true);
  await expect(enforcer.canEditNamespace("clusterEditor", "ns1")).resolves.toBe(true);
  await expect(enforcer.canManageNamespace("clusterEditor", "ns1")).resolves.toBe(false);
  await expect(enforcer.canViewNamespace("clusterEditor", "ns2")).resolves.toBe(true);
  await expect(enforcer.canEditNamespace("clusterEditor", "ns2")).resolves.toBe(true);
  await expect(enforcer.canManageNamespace("clusterEditor", "ns2")).resolves.toBe(false);

  await expect(enforcer.canViewNamespace("clusterOwner", "ns1")).resolves.toBe(true);
  await expect(enforcer.canEditNamespace("clusterOwner", "ns1")).resolves.toBe(true);
  await expect(enforcer.canManageNamespace("clusterOwner", "ns1")).resolves.toBe(true);
  await expect(enforcer.canViewNamespace("clusterOwner", "ns2")).resolves.toBe(true);
  await expect(enforcer.canEditNamespace("clusterOwner", "ns2")).resolves.toBe(true);
  await expect(enforcer.canManageNamespace("clusterOwner", "ns2")).resolves.toBe(true);

  await expect(enforcer.can("Nio", "edit", "ns2", "components/abc")).resolves.toBe(true);
  await expect(enforcer.can("Nio", "edit", "ns2", "pod/abc")).resolves.toBe(false);
});
