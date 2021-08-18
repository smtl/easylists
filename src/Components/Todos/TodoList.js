import styles from "./TodoList.module.css";
import Todo from "./Todo.js";
import NewTodo from "../NewTodo/NewTodo";

const TodoList = (props) => {
  const filteredUndoneTodos = props.todos
    .filter((todo) => todo.project === props.activeProject && !todo.done)
    .sort((a, b) => {
      return (
        new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
      );
    });

  const filteredDoneTodos = props.todos
    .filter((todo) => todo.project === props.activeProject && todo.done)
    .sort((a, b) => {
      return (
        new Date(a.completedDate).getTime() -
        new Date(b.completedDate).getTime()
      );
    })
    .reverse();

  return (
    <div className={styles.content}>
      {filteredUndoneTodos.length < 1 && <p>Nothing left to do!</p>}
      <ul>
        {filteredUndoneTodos.map((todo) => {
          return (
            <Todo
              completeTodo={props.completeTodo}
              key={todo.key}
              todo={todo}
            />
          );
        })}
      </ul>
      <NewTodo addNewTodo={props.addNewTodo} />
      <ul>
        {filteredDoneTodos.map((todo) => {
          return (
            <div>
              <Todo
                className={styles.todo}
                completeTodo={props.completeTodo}
                key={todo.key}
                todo={todo}
                deleteTodo={props.deleteTodo}
              />
            </div>
          );
        })}
      </ul>
    </div>
  );
};

export default TodoList;
