/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const todo = require("../todo");
const db = require("../models");

const {
  all,
  add,
  markAsComplete,
  overdue,
  dueToday,
  dueLater,
} = todo();

const formattedDate = (d) => {
  return d.toISOString().split("T")[0];
};

var dateToday = new Date();
const today = formattedDate(dateToday);
const yesterday = formattedDate(
  new Date(new Date().setDate(dateToday.getDate() - 1))
);
const tomorrow = formattedDate(
  new Date(new Date().setDate(dateToday.getDate() + 1))
);

describe("TodoList Database Test Suite", () => {
  beforeAll(async () => {
    // Clear the database before running tests
    await db.sequelize.sync({ force: true });
  });

  test("Should add a new todo to the database", async () => {
    const todoItemsCount = await db.Todo.count();
    await db.Todo.addTask({
      title: "Test todo",
      completed: false,
      dueDate: new Date(),
    });
    const newTodoItemsCount = await db.Todo.count();
    expect(newTodoItemsCount).toBe(todoItemsCount + 1);
  });
});

describe("TodoList Core Functionality Test Suite", () => {
  beforeAll(() => {
    // Initialize the to-do list before running tests
    add({ title: "Submit assignment", dueDate: yesterday, completed: false });
    add({ title: "Pay rent", dueDate: today, completed: true });
    add({ title: "Service Vehicle", dueDate: today, completed: false });
    add({ title: "File taxes", dueDate: tomorrow, completed: false });
  });

  test("Should add a new todo to the list", () => {
    const len = all.length;
    add({ title: "Pay electric bill", dueDate: tomorrow, completed: false });
    expect(all.length).toBe(len + 1);
  });

  test("Should mark a todo as complete", () => {
    markAsComplete(0);
    expect(all[0]['completed']).toBe(true);
  });

  test("Should retrieve overdue items", () => {
    const list = overdue();
    expect(list.length).toBe(1);
  });

  test("Should retrieve due today items", () => {
    const list = dueToday();
    expect(list.length).toBe(2);
  });

  test("Should retrieve due later items", () => {
    const list = dueLater();
    expect(list.length).toBe(2);
  });
});
