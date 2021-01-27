package rbac

import (
	"strings"
)

const (
	ActionView   = "view"
	ActionEdit   = "edit"
	ActionManage = "manage"
)

const (
	AnyResource = "*"
)

const AnyNamespace = "*"

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
	return objectMatch(obj1, obj2), nil
}

// Casbin RBAC model definition
var RBACModelString = `
[request_definition]
r = subject, action, namespace, object

[policy_definition]
p = subject, action, namespace, object

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.subject, p.subject) && (r.namespace == p.namespace || p.namespace == "*") && objectMatchFunc(r.object, p.object) && r.action == p.action
`
