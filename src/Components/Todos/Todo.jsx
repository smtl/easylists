import { useEffect, useRef, useState } from "react";
import styles from "./Todo.module.css";

const STRIKE_MS = 360;

const prefersReducedMotion = () =>
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const Todo = (props) => {
  const { todo } = props;
  const [striking, setStriking] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const toggleHandler = () => {
    if (striking) {
      return;
    }
    // Cross the item off where it is, then let it drop to the done pile
    if (!todo.done && !prefersReducedMotion()) {
      setStriking(true);
      timer.current = setTimeout(() => props.completeTodo(todo), STRIKE_MS);
    } else {
      props.completeTodo(todo);
    }
  };

  const classes = [
    styles.todo,
    todo.done ? styles.done : "",
    striking ? styles.striking : "",
  ].join(" ");

  return (
    <li className={classes}>
      <button
        type="button"
        className={styles.toggle}
        role="checkbox"
        aria-checked={todo.done || striking}
        onClick={toggleHandler}
      >
        <span className={styles.box} aria-hidden="true" />
        <span className={styles.text}>
          <span className={styles.stroke}>{todo.text}</span>
        </span>
      </button>
      {todo.done && (
        <button
          type="button"
          className={styles.delete}
          aria-label={`Delete ${todo.text}`}
          onClick={() => props.deleteTodo(todo)}
        >
          {"\u00D7"}
        </button>
      )}
    </li>
  );
};

export default Todo;
