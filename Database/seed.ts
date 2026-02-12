import { PrismaClient, TaskStatus, TaskPriority } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seeding...')

    // 1. Clean up existing data (optional, be careful in prod)
    await prisma.reminder.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.subtask.deleteMany()
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.teamMember.deleteMany()
    await prisma.team.deleteMany()
    await prisma.user.deleteMany()

    // 2. Create Users
    const superAdmin = await prisma.user.create({
        data: {
            nome: 'Wardogs',
            telefone_whatsapp: '5511999999999',
            email: 'admin@wardogs.com',
            avatar: 'https://i.pravatar.cc/150?u=master',
            role: 'SUPER_ADMIN'
        }
    })

    const user2 = await prisma.user.create({
        data: {
            nome: 'Bob Dev (User)',
            telefone_whatsapp: '5511888888888',
            email: 'bob@example.com',
            avatar: 'https://i.pravatar.cc/150?u=bob',
            role: 'USER'
        }
    })

    // 3. Create Team
    const team = await prisma.team.create({
        data: {
            nome: 'Alpha Squad',
            admin_id: superAdmin.id,
            members: {
                create: [
                    { user_id: superAdmin.id },
                    { user_id: user2.id }
                ]
            }
        }
    })

    // 4. Create Project
    const project = await prisma.project.create({
        data: {
            nome: 'Website Relaunch',
            team_id: team.id,
            cor: '#FF5733',
            creator_id: superAdmin.id
        }
    })

    // 5. Create Tasks
    await prisma.task.create({
        data: {
            titulo: 'Design System Update',
            descricao: 'Update the color palette and typography.',
            status: TaskStatus.EM_PROGRESSO,
            prioridade: TaskPriority.ALTA,
            prazo: new Date(new Date().setDate(new Date().getDate() + 2)), // 2 days from now
            criador_id: superAdmin.id,
            responsavel_id: user2.id,
            project_id: project.id,
            subtasks: {
                create: [
                    { texto: 'Choose primary colors', concluida: true },
                    { texto: 'Define typography scale', concluida: false }
                ]
            },
            comments: {
                create: [
                    { user_id: superAdmin.id, texto: 'Please prioritize accessibility.' }
                ]
            }
        }
    })

    await prisma.task.create({
        data: {
            titulo: 'Backend API Setup',
            descricao: 'Initialize Node.js and Prisma.',
            status: TaskStatus.PENDENTE,
            prioridade: TaskPriority.MEDIA,
            prazo: new Date(new Date().setDate(new Date().getDate() + 5)),
            criador_id: superAdmin.id,
            responsavel_id: superAdmin.id,
            project_id: project.id
        }
    })

    console.log('✅ Seeding finished.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
