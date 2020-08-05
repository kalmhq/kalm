package main

import (
	"github.com/kalmhq/kalm/api/log"
	"testing"
)

func Test_main(t *testing.T) {
	//ctrl.SetLogger(zap.Logger(true))
	//logger := ctrl.Log.WithName("api")
	log.Info("wrote response", "UID", "res.UID", "allowed", "res.Allowed", "result", "res.Result")
	//logger.V(1).Info("wrote response", "UID", "res.UID", "allowed", "res.Allowed", "result", "res.Result")
	log.Debug("wrote response", "UID", "res.UID", "allowed", "res.Allowed", "result", "res.Result")
	//logger.V(3).Info("wrote response", "UID", "res.UID", "allowed", "res.Allowed", "result", "res.Result")
	//logger.V(4).Info("wrote response", "UID", "res.UID", "allowed", "res.Allowed", "result", "res.Result")
	//logger.V(5).Info("wrote response", "UID", "res.UID", "allowed", "res.Allowed", "result", "res.Result")
	//logger.V(6).Info("wrote response", "UID", "res.UID", "allowed", "res.Allowed", "result", "res.Result")
}
