import { RBACEnforcer } from "rbac/model";

test("enforecer", async () => {
  const enforcer = new RBACEnforcer(`
p, role_ns1Viewer, view, t1/ns1, */*
p, role_ns1Editor, edit, t1/ns1, */*
g, role_ns1Editor, role_ns1Viewer
g, role_ns1Owner, role_ns1Editor
p, role_ns1Owner, manage, t1/ns1, */*

p, role_ns2Viewer, view, t1/ns2, */*
p, role_ns2Editor, edit, t1/ns2, */*
p, role_ns2Owner, manage, t1/ns2, */*
g, role_ns2Editor, role_ns2Viewer
g, role_ns2Owner, role_ns2Editor

p, role_clusterViewer, view, */*, */*
p, role_clusterEditor, edit, */*, */*
g, role_clusterEditor, role_clusterViewer
g, role_clusterOwner, role_clusterEditor
p, role_clusterOwner, manage, */*, */*

g, ns1Viewer, role_ns1Viewer
g, ns1Editor, role_ns1Editor
g, ns1Owner, role_ns1Owner

g, clusterViewer, role_clusterViewer
g, clusterEditor, role_clusterEditor
g, clusterOwner, role_clusterOwner

p, Nio, edit, t1/ns2, components/*
`);

  await expect(enforcer.canViewNamespace("ns1Viewer", "t1/ns1")).toBe(true);
  await expect(enforcer.canEditNamespace("ns1Viewer", "t1/ns1")).toBe(false);
  await expect(enforcer.canManageNamespace("ns1Viewer", "t1/ns1")).toBe(false);
  await expect(enforcer.canViewNamespace("ns1Viewer", "t1/ns2")).toBe(false);
  await expect(enforcer.canEditNamespace("ns1Viewer", "t1/ns2")).toBe(false);
  await expect(enforcer.canManageNamespace("ns1Viewer", "t1/ns2")).toBe(false);

  await expect(enforcer.canViewNamespace("ns1Editor", "t1/ns1")).toBe(true);
  await expect(enforcer.canEditNamespace("ns1Editor", "t1/ns1")).toBe(true);
  await expect(enforcer.canManageNamespace("ns1Editor", "t1/ns1")).toBe(false);
  await expect(enforcer.canViewNamespace("ns1Editor", "t1/ns2")).toBe(false);
  await expect(enforcer.canEditNamespace("ns1Editor", "t1/ns2")).toBe(false);
  await expect(enforcer.canManageNamespace("ns1Editor", "t1/ns2")).toBe(false);

  await expect(enforcer.canViewNamespace("ns1Owner", "t1/ns1")).toBe(true);
  await expect(enforcer.canEditNamespace("ns1Owner", "t1/ns1")).toBe(true);
  await expect(enforcer.canManageNamespace("ns1Owner", "t1/ns1")).toBe(true);
  await expect(enforcer.canViewNamespace("ns1Owner", "t1/ns2")).toBe(false);
  await expect(enforcer.canEditNamespace("ns1Owner", "t1/ns2")).toBe(false);
  await expect(enforcer.canManageNamespace("ns1Owner", "t1/ns2")).toBe(false);

  await expect(enforcer.canViewNamespace("clusterViewer", "t1/ns1")).toBe(true);
  await expect(enforcer.canEditNamespace("clusterViewer", "t1/ns1")).toBe(false);
  await expect(enforcer.canManageNamespace("clusterViewer", "t1/ns1")).toBe(false);
  await expect(enforcer.canViewNamespace("clusterViewer", "t1/ns2")).toBe(true);
  await expect(enforcer.canEditNamespace("clusterViewer", "t1/ns2")).toBe(false);
  await expect(enforcer.canManageNamespace("clusterViewer", "t1/ns2")).toBe(false);

  await expect(enforcer.canViewNamespace("clusterEditor", "t1/ns1")).toBe(true);
  await expect(enforcer.canEditNamespace("clusterEditor", "t1/ns1")).toBe(true);
  await expect(enforcer.canManageNamespace("clusterEditor", "t1/ns1")).toBe(false);
  await expect(enforcer.canViewNamespace("clusterEditor", "t1/ns2")).toBe(true);
  await expect(enforcer.canEditNamespace("clusterEditor", "t1/ns2")).toBe(true);
  await expect(enforcer.canManageNamespace("clusterEditor", "t1/ns2")).toBe(false);

  await expect(enforcer.canViewNamespace("clusterOwner", "t1/ns1")).toBe(true);
  await expect(enforcer.canEditNamespace("clusterOwner", "t1/ns1")).toBe(true);
  await expect(enforcer.canManageNamespace("clusterOwner", "t1/ns1")).toBe(true);
  await expect(enforcer.canViewNamespace("clusterOwner", "t1/ns2")).toBe(true);
  await expect(enforcer.canEditNamespace("clusterOwner", "t1/ns2")).toBe(true);
  await expect(enforcer.canManageNamespace("clusterOwner", "t1/ns2")).toBe(true);

  await expect(enforcer.can("Nio", "edit", "t1/ns2", "components/abc")).toBe(true);
  await expect(enforcer.can("Nio", "edit", "t1/ns2", "pod/abc")).toBe(false);
});
