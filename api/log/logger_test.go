package log

import (
	"testing"

	"go.uber.org/zap"
)

func TestDevLogger(t *testing.T) {
	log := NewLogger(true)
	log.Info("bar")
	log.Debug("bar")
	log.Named("foo").Info("bar", zap.String("abc", "123"))
	log.Named("foo").Debug("bar")
	log.Error("error")
}

func TestProdLogger(t *testing.T) {
	log := NewLogger(false)
	log.Info("bar")
	log.Debug("bar")
	log.Named("foo").Info("bar")
	log.Named("foo").Debug("bar")
	log.Error("error")
}
