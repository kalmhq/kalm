package utils

import (
	"bytes"
	"math/rand"
	"testing"
)

func TestAesEncrypt(t *testing.T) {
	key := make([]byte, 16)
	rand.Read(key)

	data := []byte("hello world!")
	encrypted, _ := AesEncrypt(data, key)
	data2, _ := AesDecrypt(encrypted, key)

	if !bytes.Equal(data2, data) {
		t.Errorf("can't get original data after encrypt and decrypt")
	}
}
