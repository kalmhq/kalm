package rbac

import (
	"github.com/casbin/casbin/v2"
	"github.com/casbin/casbin/v2/model"
	"github.com/casbin/casbin/v2/persist"
)

type Enforcer interface {
	// performs the most fine-grained permission check
	Can(subject, action, scope, resource string) bool

	CanView(subject, scope, resource string) bool
	CanEdit(subject, scope, resource string) bool
	CanManage(subject, scope, resource string) bool

	// Because the permissions of kalm are organized by application,
	// the following functions should be more convenience to use.
	// Scope should be a application(namespace) or "cluster"
	CanViewNamespace(subject, scope string) bool
	CanEditNamespace(subject, scope string) bool
	CanManageNamespace(subject, scope string) bool

	CanViewCluster(subject string) bool
	CanEditCluster(subject string) bool
	CanManageCluster(subject string) bool

	LoadPolicy() error
	GetPolicy() [][]string
	GetGroupingPolicy() [][]string
}

var _ Enforcer = &KalmRBACEnforcer{}

type KalmRBACEnforcer struct {
	*casbin.SyncedEnforcer
}

func (e *KalmRBACEnforcer) Enforce(rvals ...interface{}) bool {
	res, err := e.Enforcer.Enforce(rvals...)

	if err != nil {
		return false
	}

	return res
}

func (e *KalmRBACEnforcer) Can(subject, action, scope, resource string) bool {
	return e.Enforce(subject, action, scope, resource)
}

func (e *KalmRBACEnforcer) CanView(subject, scope, resource string) bool {
	return e.Enforce(subject, ActionView, scope, resource)
}

func (e *KalmRBACEnforcer) CanEdit(subject, scope, resource string) bool {
	return e.Enforce(subject, ActionEdit, scope, resource)
}

func (e *KalmRBACEnforcer) CanManage(subject, scope, resource string) bool {
	return e.Enforce(subject, ActionManage, scope, resource)
}

func (e *KalmRBACEnforcer) CanViewNamespace(subject, scope string) bool {
	return e.Enforce(subject, ActionView, scope, ResourceAll)
}

func (e *KalmRBACEnforcer) CanEditNamespace(subject, scope string) bool {
	return e.Enforce(subject, ActionEdit, scope, ResourceAll)
}

func (e *KalmRBACEnforcer) CanManageNamespace(subject, scope string) bool {
	return e.Enforce(subject, ActionManage, scope, ResourceAll)
}

func (e *KalmRBACEnforcer) CanViewCluster(subject string) bool {
	return e.Enforce(subject, ActionView, AllScope, ResourceAll)
}

func (e *KalmRBACEnforcer) CanEditCluster(subject string) bool {
	return e.Enforce(subject, ActionEdit, AllScope, ResourceAll)
}

func (e *KalmRBACEnforcer) CanManageCluster(subject string) bool {
	return e.Enforce(subject, ActionManage, AllScope, ResourceAll)
}

func NewEnforcer(adapter persist.Adapter) (Enforcer, error) {
	mod, err := model.NewModelFromString(rbacWithAdminModel)

	if err != nil {
		return nil, err
	}

	e, err := casbin.NewSyncedEnforcer(mod, adapter)

	if err != nil {
		return nil, err
	}

	e.AddFunction("objMatchFunc", objMatchFunc)

	return &KalmRBACEnforcer{e}, nil
}
