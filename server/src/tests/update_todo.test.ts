
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo title', async () => {
    // Create a test todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();

    const testInput: UpdateTodoInput = {
      id: createResult[0].id,
      title: 'Updated Title'
    };

    const result = await updateTodo(testInput);

    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description');
    expect(result.completed).toEqual(false);
    expect(result.id).toEqual(createResult[0].id);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createResult[0].updated_at).toBe(true);
  });

  it('should update todo description', async () => {
    // Create a test todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Test Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();

    const testInput: UpdateTodoInput = {
      id: createResult[0].id,
      description: 'Updated description'
    };

    const result = await updateTodo(testInput);

    expect(result.title).toEqual('Test Title');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update todo completion status', async () => {
    // Create a test todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Test Title',
        description: 'Test description',
        completed: false
      })
      .returning()
      .execute();

    const testInput: UpdateTodoInput = {
      id: createResult[0].id,
      completed: true
    };

    const result = await updateTodo(testInput);

    expect(result.title).toEqual('Test Title');
    expect(result.description).toEqual('Test description');
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    // Create a test todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();

    const testInput: UpdateTodoInput = {
      id: createResult[0].id,
      title: 'Updated Title',
      description: 'Updated description',
      completed: true
    };

    const result = await updateTodo(testInput);

    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated todo to database', async () => {
    // Create a test todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();

    const testInput: UpdateTodoInput = {
      id: createResult[0].id,
      title: 'Updated Title',
      completed: true
    };

    const result = await updateTodo(testInput);

    // Verify changes were persisted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Updated Title');
    expect(todos[0].description).toEqual('Original description');
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    // Create a test todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Test Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();

    const testInput: UpdateTodoInput = {
      id: createResult[0].id,
      description: null
    };

    const result = await updateTodo(testInput);

    expect(result.title).toEqual('Test Title');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
  });

  it('should throw error when todo not found', async () => {
    const testInput: UpdateTodoInput = {
      id: 999999,
      title: 'Updated Title'
    };

    expect(updateTodo(testInput)).rejects.toThrow(/not found/i);
  });
});
