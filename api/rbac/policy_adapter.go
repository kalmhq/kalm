package rbac

import (
	"bytes"
	"errors"
	"github.com/casbin/casbin/v2/model"
	"github.com/casbin/casbin/v2/persist"
	"github.com/casbin/casbin/v2/util"
	"strings"
)

type PolicyAdapter struct {
	line string
}

func NewStringPolicyAdapter(line string) *PolicyAdapter {
	return &PolicyAdapter{
		line: line,
	}
}

func (sa *PolicyAdapter) LoadPolicy(model model.Model) error {
	strs := strings.Split(sa.line, "\n")

	for _, str := range strs {
		if str == "" {
			continue
		}
		persist.LoadPolicyLine(str, model)
	}

	return nil
}

func (sa *PolicyAdapter) SavePolicy(model model.Model) error {
	var tmp bytes.Buffer
	for ptype, ast := range model["p"] {
		for _, rule := range ast.Policy {
			tmp.WriteString(ptype + ", ")
			tmp.WriteString(util.ArrayToString(rule))
			tmp.WriteString("\n")
		}
	}

	for ptype, ast := range model["g"] {
		for _, rule := range ast.Policy {
			tmp.WriteString(ptype + ", ")
			tmp.WriteString(util.ArrayToString(rule))
			tmp.WriteString("\n")
		}
	}

	sa.line = strings.TrimRight(tmp.String(), "\n")

	return nil
}

func (sa *PolicyAdapter) AddPolicy(sec string, ptype string, rule []string) error {
	return errors.New("not implemented")
}

func (sa *PolicyAdapter) RemovePolicy(sec string, ptype string, rule []string) error {
	sa.line = ""
	return nil
}

func (sa *PolicyAdapter) RemoveFilteredPolicy(sec string, ptype string, fieldIndex int, fieldValues ...string) error {
	return errors.New("not implemented")
}
