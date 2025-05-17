import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface WheelPositionSelectorProps {
  value: string | null
  onChange: (position: string | null) => void
  truckType: "type1" | "type2" | null
  onTruckTypeChange: (type: "type1" | "type2") => void
}

export function WheelPositionSelector({ value, onChange, truckType, onTruckTypeChange }: WheelPositionSelectorProps) {
  const truckTypes = [
    { value: "type1", label: "Фура/Евро" },
    { value: "type2", label: "Трал/Американец" }
  ]

  // Конфигурация осей для каждого типа тягача
  const axleConfig = {
    type1: {
      axles: 3,
      wheels: {
        1: { type: "single", count: 2 }, // Рулевая ось
        2: { type: "dual", count: 4 },   // Средняя ось
        3: { type: "dual", count: 4 }    // Задняя ось
      }
    },
    type2: {
      axles: 4,
      wheels: {
        1: { type: "single", count: 2 }, // Рулевая ось
        2: { type: "dual", count: 4 },   // Вторая ось
        3: { type: "dual", count: 4 },   // Третья ось
        4: { type: "dual", count: 4 }    // Задняя ось
      }
    }
  }

  // Преобразование позиции в текстовое описание
  const getPositionText = (position: string): string => {
    if (position === "spare") return "Запасное колесо"
    
    const parts = position.split("_")
    const side = parts[0] === "left" ? "Левое" : "Правое"
    const axle = parts[1]
    const dualPosition = parts[2] || ""
    
    let axleText = ""
    if (axle === "1") {
      axleText = "рулевое"
    } else {
      axleText = `${axle}-я ось`
    }

    let positionText = ""
    if (dualPosition === "inner") {
      positionText = "внутреннее"
    } else if (dualPosition === "outer") {
      positionText = "внешнее"
    }

    return `${side} ${axleText}${positionText ? ` ${positionText}` : ""}`
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Тип тягача</Label>
        <Select
          value={truckType || ""}
          onValueChange={(value: "type1" | "type2") => onTruckTypeChange(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите тип тягача" />
          </SelectTrigger>
          <SelectContent>
            {truckTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {truckType && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            {/* Схема тягача */}
            <div className="space-y-6">
              {/* Рулевая ось */}
              <div className="flex justify-center gap-20">
                <Button
                  variant={value === `left_1` ? "default" : "outline"}
                  onClick={() => onChange(`left_1`)}
                  className="w-12 h-12 rounded-full"
                  title="Левое рулевое"
                >
                  ЛР
                </Button>
                <Button
                  variant={value === `right_1` ? "default" : "outline"}
                  onClick={() => onChange(`right_1`)}
                  className="w-12 h-12 rounded-full"
                  title="Правое рулевое"
                >
                  ПР
                </Button>
              </div>

              {/* Остальные оси */}
              {Array.from({ length: axleConfig[truckType].axles - 1 }).map((_, index) => (
                <div key={index + 2} className="flex justify-center gap-20">
                  <div className="flex gap-2">
                    <Button
                      variant={value === `left_${index + 2}_inner` ? "default" : "outline"}
                      onClick={() => onChange(`left_${index + 2}_inner`)}
                      className="w-12 h-12 rounded-full"
                      title={`Левое внутреннее, ${index + 2}-я ось`}
                    >
                      Л{index + 2}В
                    </Button>
                    <Button
                      variant={value === `left_${index + 2}_outer` ? "default" : "outline"}
                      onClick={() => onChange(`left_${index + 2}_outer`)}
                      className="w-12 h-12 rounded-full"
                      title={`Левое внешнее, ${index + 2}-я ось`}
                    >
                      Л{index + 2}Н
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={value === `right_${index + 2}_inner` ? "default" : "outline"}
                      onClick={() => onChange(`right_${index + 2}_inner`)}
                      className="w-12 h-12 rounded-full"
                      title={`Правое внутреннее, ${index + 2}-я ось`}
                    >
                      П{index + 2}В
                    </Button>
                    <Button
                      variant={value === `right_${index + 2}_outer` ? "default" : "outline"}
                      onClick={() => onChange(`right_${index + 2}_outer`)}
                      className="w-12 h-12 rounded-full"
                      title={`Правое внешнее, ${index + 2}-я ось`}
                    >
                      П{index + 2}Н
                    </Button>
                  </div>
                </div>
              ))}

              {/* Запаска */}
              <div className="flex justify-center">
                <Button
                  variant={value === "spare" ? "default" : "outline"}
                  onClick={() => onChange("spare")}
                  className="w-12 h-12 rounded-full"
                  title="Запасное колесо"
                >
                  ЗАП
                </Button>
              </div>
            </div>
          </div>

          {/* Текущий выбор */}
          {value && (
            <div className="text-sm text-muted-foreground">
              Выбрано: {getPositionText(value)}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 