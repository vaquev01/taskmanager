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
     * Get today's tasks for a user
     */
    async getTasksForToday(userId: string): Promise<Task[]> {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        return prisma.task.findMany({
            where: {
                responsavel_id: userId,
                prazo: {
                    gte: startOfDay,
                    lte: endOfDay,
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
