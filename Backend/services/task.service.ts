import { prisma } from '../lib/prisma';
import { Task, TaskPriority, TaskStatus } from '@prisma/client';

interface CreateTaskDTO {
    titulo: string;
    descricao?: string;
    prazo?: Date;
    prioridade?: TaskPriority;
    responsavel_id?: string;
    criador_id: string;
    project_id?: string;
    isRecurring?: boolean;
    recurrenceInterval?: string;
}

export class TaskService {
    /**
     * Create a new task
     */
    async createTask(data: CreateTaskDTO): Promise<Task> {
        return prisma.task.create({
            data: {
                titulo: data.titulo,
                descricao: data.descricao,
                prazo: data.prazo,
                prioridade: data.prioridade || TaskPriority.MEDIA,
                responsavel_id: data.responsavel_id || data.criador_id, // Default to creator if not assigned
                criador_id: data.criador_id,
                project_id: data.project_id,
                status: TaskStatus.PENDENTE,
                isRecurring: data.isRecurring || false,
                recurrenceInterval: data.recurrenceInterval,
            },
        });
    }

    /**
     * List tasks for a specific user (assigned or created by them)
     */
    async listUserTasks(userId: string): Promise<Task[]> {
        return prisma.task.findMany({
            where: {
                OR: [
                    { responsavel_id: userId },
                    { criador_id: userId },
                ],
            },
            orderBy: {
                prazo: 'asc', // Soonest deadline first
            },
            include: {
                project: true,
            }
        });
    }

    /**
     * Get today's tasks for a user (timezone-aware)
     */
    async getTasksForToday(userId: string, timezone: string = 'America/Sao_Paulo'): Promise<Task[]> {
        // Calculate "today" boundaries in the user's timezone
        const now = new Date();
        const userDateStr = now.toLocaleDateString('en-CA', { timeZone: timezone }); // 'YYYY-MM-DD'
        const startOfDay = new Date(`${userDateStr}T00:00:00`);
        const endOfDay = new Date(`${userDateStr}T23:59:59.999`);

        // Convert to UTC offsets for Prisma query
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            timeZoneName: 'longOffset'
        });
        const parts = formatter.formatToParts(now);
        const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT-03:00';
        // Parse offset like "GMT-03:00" → "-03:00"
        const offset = offsetPart.replace('GMT', '') || '+00:00';

        const startUTC = new Date(`${userDateStr}T00:00:00${offset}`);
        const endUTC = new Date(`${userDateStr}T23:59:59.999${offset}`);

        return prisma.task.findMany({
            where: {
                responsavel_id: userId,
                prazo: {
                    gte: startUTC,
                    lte: endUTC,
                },
                status: {
                    not: TaskStatus.CONCLUIDA
                }
            },
        });
    }

    async updateStatus(taskId: string, status: TaskStatus): Promise<Task> {
        return prisma.task.update({
            where: { id: taskId },
            data: { status }
        });
    }

    /**
     * Update a task (including subtasks)
     */
    async updateTask(taskId: string, data: Partial<CreateTaskDTO> & { status?: TaskStatus; subtasks?: { texto: string; concluida: boolean }[] }): Promise<Task> {
        return prisma.task.update({
            where: { id: taskId },
            data: {
                titulo: data.titulo,
                descricao: data.descricao,
                prazo: data.prazo,
                prioridade: data.prioridade,
                responsavel_id: data.responsavel_id,
                project_id: data.project_id,
                status: data.status,
                isRecurring: data.isRecurring,
                recurrenceInterval: data.recurrenceInterval,
                // Subtasks handling: Delete all and recreate (simple reconciliation)
                subtasks: data.subtasks ? {
                    deleteMany: {},
                    create: data.subtasks.map(s => ({
                        texto: s.texto,
                        concluida: s.concluida
                    }))
                } : undefined
            },
            include: {
                subtasks: true // Return updated subtasks
            }
        });
    }

    async deleteTask(taskId: string): Promise<Task> {
        return prisma.task.delete({
            where: { id: taskId }
        });
    }

    /**
     * Bulk update tasks
     */
    async bulkUpdateTasks(taskIds: string[], data: Partial<CreateTaskDTO> & { status?: TaskStatus }): Promise<void> {
        await prisma.task.updateMany({
            where: {
                id: { in: taskIds }
            },
            data: {
                ...(data.prioridade && { prioridade: data.prioridade }),
                ...(data.status && { status: data.status }),
                ...(data.prazo && { prazo: data.prazo }),
                ...(data.project_id && { project_id: data.project_id }),
                ...(data.responsavel_id && { responsavel_id: data.responsavel_id }),
            }
        });
    }
}
