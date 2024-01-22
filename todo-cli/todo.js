/* eslint-disable no-undef */
const todoList = () => {
  const tasks = [];

  const add = (todoItem) => {
    tasks.push(todoItem);
  };

  const markAsComplete = (index) => {
    tasks[index].completed = true;
  };

  const overdue = () => {
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter((item) => {
      let givenDate = new Date(item.dueDate);
      givenDate.setHours(0, 0, 0, 0);
      return givenDate < today;
    });
  };

  const dueToday = () => {
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter((item) => item.dueDate === formattedDate(today));
  };

  const dueLater = () => {
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter((item) => {
      let givenDate = new Date(item.dueDate);
      givenDate.setHours(0, 0, 0, 0);
      return givenDate > today;
    });
  };

  const toDisplayableList = (list) => {
    return list
      .map((item) => {
        let status = item.completed ? '[x]' : '[ ]';
        let formattedDateStr = item.dueDate !== today ? ` ${item.dueDate}` : '';
        return `${status} ${item.title}${formattedDateStr}`;
      })
      .join('\n');
  };

  return {
    add,
    markAsComplete,
    overdue,
    dueToday,
    dueLater,
    toDisplayableList,
  };
};

const formattedDate = (d) => {
  return d.toISOString().split('T')[0];
};

module.exports = todoList;
