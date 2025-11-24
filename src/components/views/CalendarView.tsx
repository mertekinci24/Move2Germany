import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getTasksWithStatus, type TaskWithStatus } from '../../lib/tasks';
import { getEvents, type Event } from '../../lib/events';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { useI18n } from '../../contexts/I18nContext';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function CalendarView() {
    const { user } = useAuth();
    const { t, locale } = useI18n();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState<TaskWithStatus[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    useEffect(() => {
        async function loadData() {
            if (!user) return;
            try {
                const [tasksData, eventsData] = await Promise.all([
                    getTasksWithStatus(user.id, { locale }),
                    getEvents(user.primaryCityId || 'berlin')
                ]);
                setTasks(tasksData);
                setEvents(eventsData);
            } catch (error) {
                console.error('Failed to load calendar data:', error);
                toast.error(t('calendar.error'));
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [user, t, locale]);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const getDayContent = (day: Date) => {
        const dayTasks = tasks.filter(t => {
            const date = t.userTask?.customDueDate ? parseISO(t.userTask.customDueDate) : null;
            return date && isSameDay(date, day);
        });

        const dayEvents = events.filter(e => {
            const date = parseISO(e.start_time);
            return isSameDay(date, day);
        });

        return { tasks: dayTasks, events: dayEvents };
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const selectedDayContent = selectedDate ? getDayContent(selectedDate) : null;

    if (loading) {
        return (
            <div className="p-8 space-y-4">
                <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-[500px] bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                    <div className="h-[500px] bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <PageHeader
                title={t('calendar.title')}
                action={
                    <div className="flex items-center space-x-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 p-1">
                        <Button variant="ghost" size="sm" onClick={prevMonth} className="h-8 w-8 p-0">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium min-w-[120px] text-center">
                            {format(currentDate, 'MMMM yyyy')}
                        </span>
                        <Button variant="ghost" size="sm" onClick={nextMonth} className="h-8 w-8 p-0">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                        <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="h-8 px-2 text-xs">
                            {t('calendar.today')}
                        </Button>
                    </div>
                }
            />

            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                {/* Calendar Grid */}
                <Card className="flex-1 flex flex-col p-0 overflow-hidden border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                    <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-white dark:bg-slate-950">
                        {calendarDays.map((day, idx) => {
                            const { tasks, events } = getDayContent(day);
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <div
                                    key={day.toISOString()}
                                    onClick={() => setSelectedDate(day)}
                                    className={cn(
                                        "min-h-[100px] p-2 border-b border-r border-slate-100 dark:border-slate-800/50 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 relative group",
                                        !isCurrentMonth && "bg-slate-50/30 dark:bg-slate-900/20 text-slate-400",
                                        isSelected && "bg-indigo-50/50 dark:bg-indigo-900/10 ring-2 ring-inset ring-indigo-500 z-10",
                                        idx % 7 === 6 && "border-r-0"
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className={cn(
                                            "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                                            isToday
                                                ? "bg-indigo-600 text-white shadow-sm"
                                                : "text-slate-700 dark:text-slate-300 group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:shadow-sm"
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                        {(tasks.length > 0 || events.length > 0) && (
                                            <div className="flex space-x-1">
                                                {tasks.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                                {events.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        {tasks.slice(0, 2).map(task => (
                                            <div key={task.id} className="text-[10px] truncate px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                                                {task.title}
                                            </div>
                                        ))}
                                        {events.slice(0, 2).map(event => (
                                            <div key={event.id} className="text-[10px] truncate px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30">
                                                {event.title}
                                            </div>
                                        ))}
                                        {(tasks.length + events.length) > 4 && (
                                            <div className="text-[10px] text-slate-400 pl-1">
                                                +{(tasks.length + events.length) - 4} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Side Panel for Selected Date */}
                <Card className="w-full lg:w-80 flex flex-col overflow-hidden p-0 h-auto lg:h-auto border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-slate-500" />
                            {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : t('calendar.selectDate')}
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white dark:bg-slate-950">
                        {!selectedDate ? (
                            <div className="text-center text-slate-500 py-12 flex flex-col items-center">
                                <CalendarIcon className="w-12 h-12 text-slate-200 dark:text-slate-800 mb-3" />
                                <p>{t('calendar.selectDatePrompt')}</p>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                                        {t('calendar.tasksDue')}
                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-500">
                                            {selectedDayContent?.tasks.length || 0}
                                        </span>
                                    </h3>
                                    {selectedDayContent?.tasks.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic pl-2 border-l-2 border-slate-100 dark:border-slate-800">
                                            {t('calendar.noTasks')}
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {selectedDayContent?.tasks.map(task => (
                                                <div key={task.id} className="flex items-start p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                                                    <CheckCircle2 className={cn(
                                                        "w-4 h-4 mt-0.5 mr-2.5 flex-shrink-0",
                                                        task.userTask?.status === 'done' ? "text-emerald-500" : "text-slate-300 group-hover:text-slate-400"
                                                    )} />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
                                                            {task.title}
                                                        </p>
                                                        <div className="mt-1.5">
                                                            <Badge variant={task.importance === 'critical' ? 'danger' : 'secondary'} size="sm">
                                                                {t(`tasks.${task.importance}`)}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                                        {t('calendar.events')}
                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-500">
                                            {selectedDayContent?.events.length || 0}
                                        </span>
                                    </h3>
                                    {selectedDayContent?.events.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic pl-2 border-l-2 border-slate-100 dark:border-slate-800">
                                            {t('calendar.noEvents')}
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {selectedDayContent?.events.map(event => (
                                                <div key={event.id} className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/30 hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
                                                    <p className="text-sm font-medium text-violet-900 dark:text-violet-300">
                                                        {event.title}
                                                    </p>
                                                    <div className="flex items-center mt-2 text-xs text-violet-700 dark:text-violet-400">
                                                        <MapPin className="w-3 h-3 mr-1 opacity-70" />
                                                        {event.venue_name || t('events.online')}
                                                    </div>
                                                    <div className="mt-1 text-xs text-violet-600 dark:text-violet-500 font-medium">
                                                        {format(parseISO(event.start_time), 'h:mm a')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
