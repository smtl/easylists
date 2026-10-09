import Todo from "./Todo";
import styles from "./TodoList.module.css";

const UndoneTodos = (props) => {
  const filteredUndoneTodos = props.todos
    .filter((todo) => todo.project === props.activeProject && !todo.done)
    .sort((a, b) => {
      return (
        new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
      );
    });

  if (filteredUndoneTodos.length < 1) {
    return null;
  }

  return (
    <ul className={styles.items}>
      {filteredUndoneTodos.map((todo) => {
        return (
          <Todo key={todo.key} completeTodo={props.completeTodo} todo={todo} />
        );
      })}
    </ul>
  );
};

export default UndoneTodos;
