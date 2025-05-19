package service

import (
	"bytes"
	"fmt"
	"go-hinomontaj/models"
	"go-hinomontaj/pkg/logger"
	"strings"

	"github.com/xuri/excelize/v2"
)

type CarService struct {
	repo Repository
}

func NewCarService(repo Repository) *CarService {
	return &CarService{repo: repo}
}

// GenerateTemplate создает шаблон Excel файла для загрузки машин
func (s *CarService) GenerateTemplate() (*bytes.Buffer, error) {
	logger.Debug("Генерация шаблона Excel файла для загрузки машин")

	// Создаем новый Excel файл
	f := excelize.NewFile()
	defer f.Close()

	// Создаем лист
	sheetName := "Машины"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		logger.Error("Ошибка при создании листа: %v", err)
		return nil, fmt.Errorf("ошибка при создании листа: %w", err)
	}
	f.SetActiveSheet(index)

	// Удаляем дефолтный лист
	f.DeleteSheet("Sheet1")

	// Устанавливаем заголовки
	headers := []string{"Номер", "Модель", "Год"}
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheetName, cell, header)
	}

	// Устанавливаем стили для заголовков
	style, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold: true,
		},
		Fill: excelize.Fill{
			Type:    "pattern",
			Color:   []string{"#CCCCCC"},
			Pattern: 1,
		},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
	})
	if err != nil {
		logger.Error("Ошибка при создании стиля: %v", err)
		return nil, fmt.Errorf("ошибка при создании стиля: %w", err)
	}

	// Применяем стиль к заголовкам
	for i := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellStyle(sheetName, cell, cell, style)
	}

	// Устанавливаем ширину колонок
	f.SetColWidth(sheetName, "A", "A", 20)
	f.SetColWidth(sheetName, "B", "B", 30)
	f.SetColWidth(sheetName, "C", "C", 10)

	
	// Сохраняем файл в буфер
	buffer := new(bytes.Buffer)
	if err := f.Write(buffer); err != nil {
		logger.Error("Ошибка при сохранении файла: %v", err)
		return nil, fmt.Errorf("ошибка при сохранении файла: %w", err)
	}

	logger.Info("Шаблон Excel файла успешно сгенерирован")
	return buffer, nil
}

func (s *CarService) UploadCarsFromExcel(clientId int, fileData []byte) error {
	logger.Debug("Начало обработки Excel файла для клиента ID:%d", clientId)

	// Открываем Excel файл из байтов
	f, err := excelize.OpenReader(bytes.NewReader(fileData))
	if err != nil {
		logger.Error("Ошибка при открытии Excel файла: %v", err)
		return fmt.Errorf("ошибка при открытии Excel файла: %w", err)
	}
	defer f.Close()

	// Получаем первый лист
	sheetName := f.GetSheetName(0)
	rows, err := f.GetRows(sheetName)
	if err != nil {
		logger.Error("Ошибка при чтении листа Excel: %v", err)
		return fmt.Errorf("ошибка при чтении листа Excel: %w", err)
	}

	// Проверяем наличие заголовков
	if len(rows) < 2 {
		logger.Error("Файл не содержит данных")
		return fmt.Errorf("файл не содержит данных")
	}

	// Получаем индексы колонок
	headers := rows[0]
	numberIdx := -1
	modelIdx := -1
	yearIdx := -1

	for i, header := range headers {
		switch header {
		case "number", "номер", "Номер":
			numberIdx = i
		case "model", "модель", "Модель":
			modelIdx = i
		case "year", "год", "Год":
			yearIdx = i
		}
	}

	if numberIdx == -1 {
		logger.Error("Не найдена колонка с номером автомобиля")
		return fmt.Errorf("не найдена колонка с номером автомобиля")
	}

	// Счетчики для статистики
	var (
		added    int
		skipped  int
		errors   int
		errorMsg strings.Builder
	)

	// Обрабатываем каждую строку
	for i, row := range rows[1:] {
		if len(row) <= numberIdx {
			logger.Warning("Пропуск строки %d: недостаточно колонок", i+2)
			errors++
			errorMsg.WriteString(fmt.Sprintf("Строка %d: недостаточно колонок\n", i+2))
			continue
		}

		car := models.Car{
			Number: strings.ToUpper(row[numberIdx]),
		}

		// Добавляем модель, если есть
		if modelIdx != -1 && len(row) > modelIdx {
			car.Model = row[modelIdx]
		}

		// Добавляем год, если есть
		if yearIdx != -1 && len(row) > yearIdx {
			year := 0
			fmt.Sscanf(row[yearIdx], "%d", &year)
			car.Year = year
		}

		// Добавляем машину клиенту
		err := s.repo.AddCarToClient(clientId, car)
		if err != nil {
			if strings.Contains(err.Error(), "уже существует") {
				logger.Warning("Пропуск строки %d: машина %s уже существует", i+2, car.Number)
				skipped++
				continue
			}
			logger.Error("Ошибка при добавлении машины в строке %d: %v", i+2, err)
			errors++
			errorMsg.WriteString(fmt.Sprintf("Строка %d: ошибка добавления машины %s\n", i+2, car.Number))
			continue
		}

		added++
		logger.Debug("Успешно добавлена машина %s для клиента ID:%d", car.Number, clientId)
	}

	// Формируем итоговое сообщение
	var result strings.Builder
	result.WriteString(fmt.Sprintf("Обработка завершена:\n"))
	result.WriteString(fmt.Sprintf("- Добавлено: %d\n", added))
	result.WriteString(fmt.Sprintf("- Пропущено (дубликаты): %d\n", skipped))
	if errors > 0 {
		result.WriteString(fmt.Sprintf("- Ошибок: %d\n", errors))
		result.WriteString("\nДетали ошибок:\n")
		result.WriteString(errorMsg.String())
	}

	logger.Info("Результат обработки Excel файла для клиента ID:%d:\n%s", clientId, result.String())

	// Если были ошибки, возвращаем их
	if errors > 0 {
		return fmt.Errorf(result.String())
	}

	return nil
}
