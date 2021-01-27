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
	Can(subject, action, namespace, resource string) bool

	CanView(subject, namespace, resource string) bool
	CanEdit(subject, namespace, resource string) bool
	CanManage(subject, namespace, resource string) bool

	// Because the permissions of kalm are organized by application,
	// the following functions should be more convenience to use.
	CanViewNamespace(subject, namespace string) bool
	CanEditNamespace(subject, namespace string) bool
	CanManageNamespace(subject, namespace string) bool

	CanViewCluster(subject string) bool
	CanEditCluster(subject string) bool
	CanManageCluster(subject string) bool

	LoadPolicy() error
	GetPolicy() [][]string
	GetGroupingPolicy() [][]string
	GetCompletePoliciesFor(subjects ...string) string
	GetImplicitPermissionsForUser(subject string) ([][]string, error)
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

func (e *KalmRBACEnforcer) Can(subject, action, namespace, resource string) bool {
	return e.Enforce(subject, action, namespace, resource)
}

func (e *KalmRBACEnforcer) CanView(subject, namespace, resource string) bool {
	return e.Enforce(subject, ActionView, namespace, resource)
}

func (e *KalmRBACEnforcer) CanEdit(subject, namespace, resource string) bool {
	return e.Enforce(subject, ActionEdit, namespace, resource)
}

func (e *KalmRBACEnforcer) CanManage(subject, namespace, resource string) bool {
	return e.Enforce(subject, ActionManage, namespace, resource)
}

func (e *KalmRBACEnforcer) CanViewNamespace(subject, namespace string) bool {
	return e.Enforce(subject, ActionView, namespace, AnyResource)
}

func (e *KalmRBACEnforcer) CanEditNamespace(subject, namespace string) bool {
	return e.Enforce(subject, ActionEdit, namespace, AnyResource)
}

func (e *KalmRBACEnforcer) CanManageNamespace(subject, namespace string) bool {
	return e.Enforce(subject, ActionManage, namespace, AnyResource)
}

func (e *KalmRBACEnforcer) CanViewCluster(subject string) bool {
	return e.Enforce(subject, ActionView, AnyNamespace, AnyResource)
}

func (e *KalmRBACEnforcer) CanEditCluster(subject string) bool {
	return e.Enforce(subject, ActionEdit, AnyNamespace, AnyResource)
}

func (e *KalmRBACEnforcer) CanManageCluster(subject string) bool {
	return e.Enforce(subject, ActionManage, AnyNamespace, AnyResource)
}

func (e *KalmRBACEnforcer) GetImplicitPermissionsForUser(subject string) ([][]string, error) {
	return e.SyncedEnforcer.GetImplicitPermissionsForUser(subject)
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
