package auth_proxy

import "github.com/kalmhq/kalm/api/utils"

var stateEncryptKey [32]byte

func InitEncrypteKey(key [32]byte) {
	stateEncryptKey = key
}

func AesEncrypt(data []byte) ([]byte, error) {
	return utils.AesEncrypt(data, stateEncryptKey[:])
}

func AesDecrypt(data []byte) ([]byte, error) {
	return utils.AesDecrypt(data, stateEncryptKey[:])
}
