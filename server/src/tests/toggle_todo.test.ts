
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type ToggleTodoInput } from '../schema';
import { toggleTodo } from '../handlers/toggle_todo';
import { eq } from 'drizzle-orm';

// Helper function to create a test todo
const createTestTodo = async (completed: boolean = false) => {
  const result = await db.insert(todosTable)
    .values({
      title: 'Test Todo',
      description: 'A todo for testing',
      completed
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('toggleTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should toggle completed status from false to true', async () => {
    // Create a todo that is not completed
    const testTodo = await createTestTodo(false);
    
    const input: ToggleTodoInput = {
      id: testTodo.id
    };

    const result = await toggleTodo(input);

    // Verify the todo is now completed
    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('Test Todo');
    expect(result.completed).toBe(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testTodo.updated_at).toBe(true);
  });

  it('should toggle completed status from true to false', async () => {
    // Create a todo that is completed
    const testTodo = await createTestTodo(true);
    
    const input: ToggleTodoInput = {
      id: testTodo.id
    };

    const result = await toggleTodo(input);

    // Verify the todo is now not completed
    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('Test Todo');
    expect(result.completed).toBe(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testTodo.updated_at).toBe(true);
  });

  it('should save changes to database', async () => {
    // Create a todo that is not completed
    const testTodo = await createTestTodo(false);
    
    const input: ToggleTodoInput = {
      id: testTodo.id
    };

    const result = await toggleTodo(input);

    // Query the database to verify the change was persisted
    const updatedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(updatedTodos).toHaveLength(1);
    expect(updatedTodos[0].completed).toBe(true);
    expect(updatedTodos[0].updated_at).toBeInstanceOf(Date);
    expect(updatedTodos[0].updated_at > testTodo.updated_at).toBe(true);
  });

  it('should throw error for non-existent todo', async () => {
    const input: ToggleTodoInput = {
      id: 999 // Non-existent ID
    };

    await expect(toggleTodo(input)).rejects.toThrow(/not found/i);
  });

  it('should handle multiple toggles correctly', async () => {
    // Create a todo that is not completed
    const testTodo = await createTestTodo(false);
    
    const input: ToggleTodoInput = {
      id: testTodo.id
    };

    // First toggle: false -> true
    const firstResult = await toggleTodo(input);
    expect(firstResult.completed).toBe(true);

    // Second toggle: true -> false
    const secondResult = await toggleTodo(input);
    expect(secondResult.completed).toBe(false);
    expect(secondResult.updated_at > firstResult.updated_at).toBe(true);

    // Third toggle: false -> true
    const thirdResult = await toggleTodo(input);
    expect(thirdResult.completed).toBe(true);
    expect(thirdResult.updated_at > secondResult.updated_at).toBe(true);
  });
});
