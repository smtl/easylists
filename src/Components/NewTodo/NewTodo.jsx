import { useState } from "react";
import styles from "./NewTodo.module.css";

const NewTodo = (props) => {
  const [newTodo, setNewTodo] = useState("");
  const hasText = newTodo.trim().length > 0;

  const addNewTodoHandler = () => {
    if (hasText) {
      props.addNewTodo(newTodo.trim());
      setNewTodo("");
    }
  };

  const keyDownHandler = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addNewTodoHandler();
    }
  };

  return (
    <div className={styles.newTodo}>
      <span className={styles.plus} aria-hidden="true">
        +
      </span>
      <input
        aria-label="Add an item"
        placeholder="Add an item"
        enterKeyHint="enter"
        value={newTodo}
        onChange={(event) => setNewTodo(event.target.value)}
        onKeyDown={keyDownHandler}
      />
      {hasText && (
        <button
          type="button"
          className={styles.save}
          // Keep the keyboard open on phones so the next item can follow
          onMouseDown={(event) => event.preventDefault()}
          onClick={addNewTodoHandler}
        >
          Add
        </button>
      )}
    </div>
  );
};

export default NewTodo;
