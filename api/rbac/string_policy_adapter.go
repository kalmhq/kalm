package rbac

import (
	"errors"
	"github.com/casbin/casbin/v2/model"
	"github.com/casbin/casbin/v2/persist"
	"strings"
)

type StringPolicyAdapter struct {
	line string
}

func NewStringPolicyAdapter(line string) *StringPolicyAdapter {
	return &StringPolicyAdapter{
		line: line,
	}
}

func (p *StringPolicyAdapter) SetPoliciesString(policies string) {
	p.line = policies
}

func (p *StringPolicyAdapter) LoadPolicy(model model.Model) error {
	strs := strings.Split(p.line, "\n")

	for _, str := range strs {
		if str == "" {
			continue
		}
		persist.LoadPolicyLine(str, model)
	}

	return nil
}

func (p *StringPolicyAdapter) SavePolicy(model model.Model) error {
	return errors.New("not implemented")
}

func (p *StringPolicyAdapter) AddPolicy(sec string, ptype string, rule []string) error {
	return errors.New("not implemented")
}

func (p *StringPolicyAdapter) RemovePolicy(sec string, ptype string, rule []string) error {
	return errors.New("not implemented")
}

func (p *StringPolicyAdapter) RemoveFilteredPolicy(sec string, ptype string, fieldIndex int, fieldValues ...string) error {
	return errors.New("not implemented")
}
