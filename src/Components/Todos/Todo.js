import { useState } from "react";
import styles from "./Todo.module.css";

const Todo = (props) => {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className={`${styles.todo} ${props.todo.done && styles.done}`}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className={styles.todo_container}>
        <li onClick={() => props.completeTodo(props.todo)}>
          {props.todo.text}
        </li>
        {props.todo.done && (
          <span
            onClick={() => props.deleteTodo(props.todo)}
            className={`${styles.delete} ${showDelete && styles.show}`}
          >
            {"\u274C"}
          </span>
        )}
      </div>
    </div>
  );
};

export default Todo;
