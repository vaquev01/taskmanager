import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Subtask Debug ---');

    // 1. Find a test task
    const task = await prisma.task.findFirst();
    if (!task) {
        console.log('No task found to test.');
        return;
    }
    console.log(`Testing with Task ID: ${task.id}, Title: ${task.titulo}`);

    // 2. Clear existing subtasks
    await prisma.subtask.deleteMany({ where: { task_id: task.id } });
    console.log('Cleared existing subtasks.');

    // 3. Attempt update with subtasks using nested write
    const subtaskData = [{ texto: 'Debug Subtask 1', concluida: false }, { texto: 'Debug Subtask 2', concluida: true }];

    try {
        const updatedTask = await prisma.task.update({
            where: { id: task.id },
            data: {
                subtasks: {
                    deleteMany: {},
                    create: subtaskData
                }
            },
            include: { subtasks: true }
        });

        console.log('Update Successful!');
        console.log('Updated Subtasks:', updatedTask.subtasks);

        if (updatedTask.subtasks.length === 2) {
            console.log('VERIFICATION: PASSED ✅');
        } else {
            console.log('VERIFICATION: FAILED ❌ - Count mismatch');
        }

    } catch (error) {
        console.error('Update Failed:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
