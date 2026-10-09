import { useEffect, useRef, useState } from "react";
import styles from "./Todo.module.css";
import { useSwipeAction } from "../../Hooks/SwipeActionHook";
import { openTimeBlock } from "../../Utils/calendar";

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

  // Open items swipe right to complete; done items swipe left to delete
  const swipeDirection = todo.done ? -1 : 1;
  const swipeCommit = todo.done ? () => props.deleteTodo(todo) : toggleHandler;
  // Long-press an open item to time-block it on Google Calendar
  const longPressCommit = todo.done
    ? undefined
    : () => openTimeBlock(todo.text);
  const { drag, progress, swiping, pressing, handlers } = useSwipeAction(
    swipeDirection,
    swipeCommit,
    longPressCommit
  );

  const classes = [
    styles.todo,
    todo.done ? styles.done : "",
    striking ? styles.striking : "",
  ].join(" ");

  return (
    <li className={classes}>
      <div className={styles.swipeTrack} aria-hidden="true">
        <span
          className={styles.swipeIcon}
          style={{
            opacity: 0.35 + progress * 0.65,
            transform: `scale(${0.85 + progress * 0.15})`,
          }}
        >
          {todo.done ? "×" : "✓"}
        </span>
      </div>
      <div
        className={[styles.swipeContent, pressing ? styles.pressing : ""].join(
          " "
        )}
        style={{
          transform: drag ? `translateX(${drag}px)` : undefined,
          transition: swiping ? "none" : undefined,
        }}
        {...handlers}
      >
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
        {!todo.done && (
          <span className={styles.pressBadge} aria-hidden="true">
            {"\u{1F4C5}"}
          </span>
        )}
        {todo.done && (
          <button
            type="button"
            className={styles.delete}
            aria-label={`Delete ${todo.text}`}
            onClick={() => props.deleteTodo(todo)}
          >
            {"×"}
          </button>
        )}
      </div>
    </li>
  );
};

export default Todo;
