package log

import (
	"go.uber.org/zap"
)

var defaultLogger *zap.Logger

func init() {
	zapLogger, err := zap.NewProduction()

	if err != nil {
		panic(err)
	}

	defaultLogger = zapLogger
}

func InitDefaultLogger(isDev bool) {
	defaultLogger = NewLogger(isDev)
}

func NewLogger(isDev bool) *zap.Logger {
	var zapLog *zap.Logger
	var err error

	if isDev {
		zapLog, err = zap.NewDevelopment()
	} else {
		zapLog, err = zap.NewProduction()
	}

	if err != nil {
		panic(err)
	}

	return zapLog
}

func DefaultLogger() *zap.Logger {
	return defaultLogger
}

func Debug(msg string, fields ...zap.Field) {
	defaultLogger.Debug(msg, fields...)
}

func Info(msg string, fields ...zap.Field) {
	defaultLogger.Info(msg, fields...)
}

func Error(msg string, fields ...zap.Field) {
	defaultLogger.Error(msg, fields...)
}

func Named(s string) *zap.Logger {
	return defaultLogger.Named(s)
}

func With(fields ...zap.Field) *zap.Logger {
	return defaultLogger.With(fields...)
}
