
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a test todo first
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing deletion'
      })
      .returning()
      .execute();

    const createdTodo = insertResult[0];
    const input: DeleteTodoInput = { id: createdTodo.id };

    // Delete the todo
    const result = await deleteTodo(input);

    expect(result.success).toBe(true);

    // Verify the todo was actually deleted from the database
    const remainingTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(remainingTodos).toHaveLength(0);
  });

  it('should return success false when deleting non-existent todo', async () => {
    const input: DeleteTodoInput = { id: 999 };

    const result = await deleteTodo(input);

    expect(result.success).toBe(false);
  });

  it('should only delete the specified todo', async () => {
    // Create multiple test todos
    const insertResults = await db.insert(todosTable)
      .values([
        { title: 'Todo 1', description: 'First todo' },
        { title: 'Todo 2', description: 'Second todo' },
        { title: 'Todo 3', description: 'Third todo' }
      ])
      .returning()
      .execute();

    const todoToDelete = insertResults[1]; // Delete the second todo
    const input: DeleteTodoInput = { id: todoToDelete.id };

    // Delete one specific todo
    const result = await deleteTodo(input);

    expect(result.success).toBe(true);

    // Verify only the specified todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    expect(remainingTodos.find(todo => todo.id === todoToDelete.id)).toBeUndefined();
    expect(remainingTodos.find(todo => todo.id === insertResults[0].id)).toBeDefined();
    expect(remainingTodos.find(todo => todo.id === insertResults[2].id)).toBeDefined();
  });
});
