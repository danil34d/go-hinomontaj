package logger

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

var (
	debugLogger   *log.Logger
	infoLogger    *log.Logger
	warningLogger *log.Logger
	errorLogger   *log.Logger
)

func init() {
	debugLogger = log.New(os.Stdout, "DEBUG: ", log.LstdFlags)
	infoLogger = log.New(os.Stdout, "INFO: ", log.LstdFlags)
	warningLogger = log.New(os.Stdout, "WARNING: ", log.LstdFlags)
	errorLogger = log.New(os.Stderr, "ERROR: ", log.LstdFlags)
}

// getCallerInfo возвращает информацию о месте вызова логгера
func getCallerInfo() string {
	// Пропускаем 3 кадра стека:
	// 1. runtime.Callers
	// 2. getCallerInfo
	// 3. метод логгера (Debug, Info, Warning, Error)
	pc, file, line, ok := runtime.Caller(3)
	if !ok {
		return "unknown"
}

	// Получаем имя функции
	fn := runtime.FuncForPC(pc)
	funcName := "unknown"
	if fn != nil {
		// Извлекаем только имя функции без пути пакета
		parts := strings.Split(fn.Name(), ".")
		funcName = parts[len(parts)-1]
	}

	// Получаем только имя файла без пути
	fileName := filepath.Base(file)

	return fmt.Sprintf("%s:%d:%s", fileName, line, funcName)
}

// formatMessage форматирует сообщение с информацией о месте вызова
func formatMessage(format string, args ...interface{}) string {
	callerInfo := getCallerInfo()
	message := fmt.Sprintf(format, args...)
	return fmt.Sprintf("%s %s", callerInfo, message)
}

// Debug логирует отладочное сообщение
func Debug(format string, args ...interface{}) {
	debugLogger.Printf(formatMessage(format, args...))
}

// Info логирует информационное сообщение
func Info(format string, args ...interface{}) {
	infoLogger.Printf(formatMessage(format, args...))
}

// Warning логирует предупреждение
func Warning(format string, args ...interface{}) {
	warningLogger.Printf(formatMessage(format, args...))
}

// Error логирует ошибку
func Error(format string, args ...interface{}) {
	errorLogger.Printf(formatMessage(format, args...))
}

// Fatal логирует критическую ошибку и завершает программу
func Fatal(format string, args ...interface{}) {
	errorLogger.Printf(formatMessage(format, args...))
	os.Exit(1)
}
