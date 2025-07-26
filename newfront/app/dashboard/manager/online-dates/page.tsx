"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { onlineDatesApi, OnlineDate } from "@/lib/api"
import { format, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import { Edit, Phone, Car, User, MessageSquare, Calendar, Plus } from "lucide-react"

export default function OnlineDatesPage() {
  const [onlineDates, setOnlineDates] = useState<OnlineDate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<OnlineDate | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [managerNote, setManagerNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  
  // Состояние формы создания встречи
  const [newMeeting, setNewMeeting] = useState({
    date: "",
    name: "",
    phone: "",
    car_number: "",
    client_desc: "",
    manager_desc: ""
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchOnlineDates()
  }, [])

  const fetchOnlineDates = async () => {
    try {
      setLoading(true)
      const data = await onlineDatesApi.getAll()
      setOnlineDates(data)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось загрузить онлайн встречи",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditNote = (onlineDate: OnlineDate) => {
    setSelectedDate(onlineDate)
    setManagerNote(onlineDate.manager_desc || "")
    setIsEditDialogOpen(true)
  }

  const handleSaveNote = async () => {
    if (!selectedDate) return

    try {
      setSubmitting(true)
      await onlineDatesApi.update({
        id: selectedDate.id,
        name: selectedDate.name,
        phone: selectedDate.phone,
        car_number: selectedDate.car_number,
        client_desc: selectedDate.client_desc,
        manager_desc: managerNote,
      })

      // Обновляем локальные данные
      setOnlineDates(prev => 
        prev.map(date => 
          date.id === selectedDate.id 
            ? { ...date, manager_desc: managerNote }
            : date
        )
      )

      toast({
        title: "Успешно",
        description: "Заметка сохранена",
      })

      setIsEditDialogOpen(false)
      setSelectedDate(null)
      setManagerNote("")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось сохранить заметку",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateMeeting = async () => {
    if (!newMeeting.name || !newMeeting.phone || !newMeeting.car_number || !newMeeting.date) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Заполните все обязательные поля",
      })
      return
    }

    try {
      setSubmitting(true)
      const createdMeeting = await onlineDatesApi.create({
        date: newMeeting.date,
        name: newMeeting.name,
        phone: newMeeting.phone,
        car_number: newMeeting.car_number,
        client_desc: newMeeting.client_desc,
        manager_desc: newMeeting.manager_desc,
      })

      // Обновляем локальные данные
      setOnlineDates(prev => [createdMeeting, ...prev])

      toast({
        title: "Успешно",
        description: "Встреча создана",
      })

      setIsCreateDialogOpen(false)
      setNewMeeting({
        date: "",
        name: "",
        phone: "",
        car_number: "",
        client_desc: "",
        manager_desc: ""
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось создать встречу",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd MMM yyyy, HH:mm", { locale: ru })
    } catch {
      return dateString
    }
  }

  const getStatusBadge = (onlineDate: OnlineDate) => {
    const now = new Date()
    const appointmentDate = parseISO(onlineDate.date)
    
    if (appointmentDate < now) {
      return <Badge variant="secondary">Завершена</Badge>
    } else {
      return <Badge variant="default">Запланирована</Badge>
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Загрузка...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Онлайн встречи</h2>
            <p className="text-muted-foreground">
              Управление записями клиентов на онлайн встречи
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Создать встречу
          </Button>
        </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Список встреч
          </CardTitle>
          <CardDescription>
            Просмотр всех онлайн записей и возможность добавления заметок менеджера
          </CardDescription>
        </CardHeader>
        <CardContent>
          {onlineDates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Онлайн встреч пока нет</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата и время</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Автомобиль</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {onlineDates.map((onlineDate) => (
                  <TableRow key={onlineDate.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(onlineDate.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {onlineDate.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {onlineDate.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        {onlineDate.car_number}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="space-y-1">
                        {onlineDate.client_desc && (
                          <p className="text-sm">{onlineDate.client_desc}</p>
                        )}
                        {onlineDate.manager_desc && (
                          <div className="p-2 bg-blue-50 rounded text-sm">
                            <div className="flex items-center gap-1 mb-1">
                              <MessageSquare className="h-3 w-3" />
                              <span className="font-medium text-blue-700">Заметка менеджера:</span>
                            </div>
                            <p className="text-blue-600">{onlineDate.manager_desc}</p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(onlineDate)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditNote(onlineDate)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Заметка
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Диалог редактирования заметки */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Заметка менеджера</DialogTitle>
            <DialogDescription>
              Добавьте или отредактируйте заметку к встрече с клиентом {selectedDate?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDate && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div><strong>Клиент:</strong> {selectedDate.name}</div>
                <div><strong>Телефон:</strong> {selectedDate.phone}</div>
                <div><strong>Автомобиль:</strong> {selectedDate.car_number}</div>
                <div><strong>Дата:</strong> {formatDate(selectedDate.date)}</div>
                {selectedDate.client_desc && (
                  <div><strong>Описание клиента:</strong> {selectedDate.client_desc}</div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manager-note">Заметка менеджера</Label>
                <Textarea
                  id="manager-note"
                  value={managerNote}
                  onChange={(e) => setManagerNote(e.target.value)}
                  placeholder="Введите заметку для этой встречи..."
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={submitting}
                >
                  Отмена
                </Button>
                <Button onClick={handleSaveNote} disabled={submitting}>
                  {submitting ? "Сохранение..." : "Сохранить"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог создания встречи */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать онлайн встречу</DialogTitle>
            <DialogDescription>
              Заполните информацию для создания новой встречи
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meeting-name">Имя клиента *</Label>
                <Input
                  id="meeting-name"
                  value={newMeeting.name}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Введите имя клиента"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting-phone">Телефон *</Label>
                <Input
                  id="meeting-phone"
                  value={newMeeting.phone}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meeting-car">Номер автомобиля *</Label>
                <Input
                  id="meeting-car"
                  value={newMeeting.car_number}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, car_number: e.target.value.toUpperCase() }))}
                  placeholder="А123БВ77"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting-date">Дата и время *</Label>
                <Input
                  id="meeting-date"
                  type="datetime-local"
                  value={newMeeting.date}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="meeting-client-desc">Описание от клиента</Label>
              <Textarea
                id="meeting-client-desc"
                value={newMeeting.client_desc}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, client_desc: e.target.value }))}
                placeholder="Что просит клиент..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="meeting-manager-desc">Заметка менеджера</Label>
              <Textarea
                id="meeting-manager-desc"
                value={newMeeting.manager_desc}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, manager_desc: e.target.value }))}
                placeholder="Дополнительная информация..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={submitting}
              >
                Отмена
              </Button>
              <Button onClick={handleCreateMeeting} disabled={submitting}>
                {submitting ? "Создание..." : "Создать встречу"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  )
} 