package logger

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/sirupsen/logrus"
)

var log = logrus.New()

func init() {
	// Настраиваем формат вывода
	log.SetFormatter(&logrus.TextFormatter{
		FullTimestamp:    true,
		TimestampFormat:  "2006-01-02 15:04:05",
		CallerPrettyfier: callerPrettyfier,
	})

	// Включаем отображение места вызова
	log.SetReportCaller(true)

	// По умолчанию выводим в stdout
	log.SetOutput(os.Stdout)

	// Устанавливаем уровень логирования
	log.SetLevel(logrus.DebugLevel)
}

// callerPrettyfier форматирует информацию о месте вызова
func callerPrettyfier(f *runtime.Frame) (string, string) {
	// Получаем короткое имя файла (без полного пути)
	filename := filepath.Base(f.File)

	// Получаем имя функции без пути к пакету
	function := filepath.Base(f.Function)

	return function, fmt.Sprintf("%s:%d", filename, f.Line)
}

// Debug логирует отладочное сообщение
func Debug(format string, args ...interface{}) {
	log.Debugf(format, args...)
}

// Info логирует информационное сообщение
func Info(format string, args ...interface{}) {
	log.Infof(format, args...)
}

// Warning логирует предупреждение
func Warning(format string, args ...interface{}) {
	log.Warnf(format, args...)
}

// Error логирует ошибку
func Error(format string, args ...interface{}) {
	log.Errorf(format, args...)
}

// Fatal логирует критическую ошибку и завершает программу
func Fatal(format string, args ...interface{}) {
	log.Fatalf(format, args...)
}

// WithFields создает новую запись лога с дополнительными полями
func WithFields(fields map[string]interface{}) *logrus.Entry {
	return log.WithFields(fields)
}

// SetLevel устанавливает уровень логирования
func SetLevel(level string) {
	switch strings.ToLower(level) {
	case "debug":
		log.SetLevel(logrus.DebugLevel)
	case "info":
		log.SetLevel(logrus.InfoLevel)
	case "warn":
		log.SetLevel(logrus.WarnLevel)
	case "error":
		log.SetLevel(logrus.ErrorLevel)
	case "fatal":
		log.SetLevel(logrus.FatalLevel)
	default:
		log.SetLevel(logrus.InfoLevel)
	}
}

// GetLogger возвращает экземпляр логгера
func GetLogger() *logrus.Logger {
	return log
}
