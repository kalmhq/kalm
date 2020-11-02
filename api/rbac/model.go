package rbac

import (
	"fmt"
	"strings"
)

const (
	ActionView   = "view"
	ActionEdit   = "edit"
	ActionManage = "manage"
)

const (
	AnyResource = "*/*"
)

type Scope struct {
	Tenant    string
	Namespace string
}

func (s *Scope) String() string {
	if s.Tenant == "" || s.Namespace == "" {
		panic("tenant or namespace can't be blank")
	}

	return s.Tenant + "/" + s.Namespace
}

const AnyScope = "*/*"

func IsValidScopeString(scope string) bool {
	i := strings.Index(scope, "/")
	return i != 0 && i != len(scope)-1
}

func objectMatch(key1 string, key2 string) bool {
	i := strings.Index(key2, "*")

	if i == -1 {
		return key1 == key2
	}

	if len(key1) > i {
		return key1[:i] == key2[:i]
	}

	return key1 == key2[:i]
}

func objectMatchFunc(args ...interface{}) (interface{}, error) {
	obj1 := args[0].(string)
	obj2 := args[1].(string)

	obj1Parts := strings.Split(obj1, "/")
	obj2Parts := strings.Split(obj2, "/")

	if len(obj1Parts) != 2 {
		panic(fmt.Errorf("wrong object in objectMatch: \"%s\"", obj1))
	}

	if len(obj2Parts) != 2 {
		panic(fmt.Errorf("wrong object in objectMatch: \"%s\"", obj2))
	}

	return objectMatch(obj1Parts[0], obj2Parts[0]) && objectMatch(obj1Parts[1], obj2Parts[1]), nil
}

// Casbin RBAC model definition
var RBACModelString = `
[request_definition]
r = subject, action, scope, object

[policy_definition]
p = subject, action, scope, object

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.subject, p.subject) && objectMatchFunc(r.scope, p.scope) && objectMatchFunc(r.object, p.object) && r.action == p.action
`
