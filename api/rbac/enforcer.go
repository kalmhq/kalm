package rbac

import (
	"fmt"
	"strings"

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

	// Because the permissions of kalm are organized by tenant and application,
	// the following functions should be more convenience to use.
	// Scope should follow the format of "${tenantName}/${applicationName}"
	// TODO: rename these functions
	CanViewNamespace(subject, scope string) bool
	CanEditNamespace(subject, scope string) bool
	CanManageNamespace(subject, scope string) bool

	CanViewCluster(subject string) bool
	CanEditCluster(subject string) bool
	CanManageCluster(subject string) bool

	LoadPolicy() error
	GetPolicy() [][]string
	GetGroupingPolicy() [][]string
	GetCompletePoliciesFor(subjects ...string) string
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
	return e.Enforce(subject, ActionView, scope, AnyResource)
}

func (e *KalmRBACEnforcer) CanEditNamespace(subject, scope string) bool {
	return e.Enforce(subject, ActionEdit, scope, AnyResource)
}

func (e *KalmRBACEnforcer) CanManageNamespace(subject, scope string) bool {
	return e.Enforce(subject, ActionManage, scope, AnyResource)
}

func (e *KalmRBACEnforcer) CanViewCluster(subject string) bool {
	return e.Enforce(subject, ActionView, AnyScope, AnyResource)
}

func (e *KalmRBACEnforcer) CanEditCluster(subject string) bool {
	return e.Enforce(subject, ActionEdit, AnyScope, AnyResource)
}

func (e *KalmRBACEnforcer) CanManageCluster(subject string) bool {
	return e.Enforce(subject, ActionManage, AnyScope, AnyResource)
}

func (e *KalmRBACEnforcer) GetCompletePoliciesFor(subjects ...string) string {
	res := make([]string, 0)

	for _, subject := range subjects {
		implicitPermissions, _ := e.SyncedEnforcer.GetImplicitPermissionsForUser(subject)

		for _, permission := range implicitPermissions {
			res = append(res, fmt.Sprintf("p, %s, %s, %s, %s", permission[0], permission[1], permission[2], permission[3]))
		}

		implicitRoles, _ := e.SyncedEnforcer.GetImplicitRolesForUser(subject)

		for _, role := range implicitRoles {
			res = append(res, fmt.Sprintf("g, %s, %s", subject, role))
		}
	}

	return strings.Join(res, "\n")
}

func NewEnforcer(adapter persist.Adapter) (Enforcer, error) {
	mod, err := model.NewModelFromString(RBACModelString)

	if err != nil {
		return nil, err
	}

	e, err := casbin.NewSyncedEnforcer(mod, adapter)

	if err != nil {
		return nil, err
	}

	e.AddFunction("objectMatchFunc", objectMatchFunc)

	return &KalmRBACEnforcer{e}, nil
}
