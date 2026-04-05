
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const todos = await prisma.toDo.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(todos);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { text, date, category } = await req.json();
        const todo = await prisma.toDo.create({
            data: {
                text,
                date: new Date(date),
                category: category || 'RAPAT'
            }
        });
        return NextResponse.json(todo);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { id, isDone, text, category } = await req.json();
        const data: any = {};
        if (isDone !== undefined) data.isDone = isDone;
        if (text !== undefined) data.text = text;
        if (category !== undefined) data.category = category;

        const todo = await prisma.toDo.update({
            where: { id },
            data
        });
        return NextResponse.json(todo);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.toDo.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
    }
}
