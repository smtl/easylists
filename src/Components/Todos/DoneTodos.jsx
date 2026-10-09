import Todo from "./Todo";
import styles from "./TodoList.module.css";

const DoneTodos = (props) => {
  const filteredDoneTodos = props.todos
    .filter((todo) => todo.project === props.activeProject && todo.done)
    .sort((a, b) => {
      return (
        new Date(b.completedDate).getTime() -
        new Date(a.completedDate).getTime()
      );
    });

  if (filteredDoneTodos.length < 1) {
    return null;
  }

  return (
    <ul className={styles.doneItems} aria-label="Done">
      {filteredDoneTodos.map((todo) => {
        return (
          <Todo
            key={todo.key}
            completeTodo={props.completeTodo}
            todo={todo}
            deleteTodo={props.deleteTodo}
          />
        );
      })}
    </ul>
  );
};

export default DoneTodos;
