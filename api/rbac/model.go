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
	ResourceAll = "*"
)

const AllScope = "*"

func objMatch(key1 string, key2 string) bool {
	i := strings.Index(key2, "*")

	if i == -1 {
		return key1 == key2
	}

	if len(key1) > i {
		return key1[:i] == key2[:i]
	}

	return key1 == key2[:i]
}

func objMatchFunc(args ...interface{}) (interface{}, error) {
	obj1 := args[0].(string)
	obj2 := args[1].(string)

	return (bool)(objMatch(obj1, obj2)), nil
}

// Casbin RBAC model definition
var rbacWithAdminModel = fmt.Sprintf(`
[request_definition]
r = sub, act, scope, obj

[policy_definition]
p = sub, act, scope, obj

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && (r.scope == p.scope || p.scope == "%s") && objMatchFunc(r.obj, p.obj) && r.act == p.act
`, AllScope)
