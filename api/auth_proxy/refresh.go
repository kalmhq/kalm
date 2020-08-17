package auth_proxy

import (
	"github.com/coreos/go-oidc"
	"sync"
	"time"
)

type RefreshContext struct {
	Cond *sync.Cond

	// After broadcast, Either the error is nil or the tokens are nil
	Error         error
	IDToken       *oidc.IDToken
	IDTokenString string
	RefreshToken  string
}

// A lock to protected getRefreshTokenCond
var refreshLock *sync.Mutex
var refreshCondMap map[string]*RefreshContext

func init() {
	refreshLock = &sync.Mutex{}
	refreshCondMap = make(map[string]*RefreshContext)
}

func GetRefreshTokenCond(token string) (*RefreshContext, bool) {
	refreshLock.Lock()
	defer refreshLock.Unlock()

	if cond, ok := refreshCondMap[token]; ok {
		return cond, false
	}

	m := sync.Mutex{}
	refreshCondMap[token] = &RefreshContext{Cond: sync.NewCond(&m)}
	return refreshCondMap[token], true
}

func RemoveRefreshTokenCond(token string, delaySeconds int) {
	go func() {
		time.Sleep(time.Duration(delaySeconds) * time.Second)
		refreshLock.Lock()
		defer refreshLock.Unlock()

		if refreshCondMap == nil {
			return
		}

		delete(refreshCondMap, token)
	}()
}
