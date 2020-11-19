package v1alpha1

import (
	"fmt"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"reflect"
	"testing"
)

func TestA(t *testing.T) {
	obj := DockerRegistry{ObjectMeta: v1.ObjectMeta{
		Name: "thisisname",
	}}

	bType := reflect.TypeOf(obj)
	getNameMeth, has1 := bType.FieldByName("Name")
	getNameMeth2, has2 := bType.FieldByName("FOOBAR")
	fmt.Printf("%t, %+v\n", has1, getNameMeth)
	fmt.Printf("%t, %+v\n", has2, getNameMeth2)

	val := reflect.ValueOf(&obj).Elem()

	name := val.Field(getNameMeth.Index[0])
	fmt.Println(name.Interface())

	name = val.FieldByName("Name")
	fmt.Printf("--------%+v\n", name)
}
