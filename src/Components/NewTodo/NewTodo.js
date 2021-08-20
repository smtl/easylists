import { useState } from "react";
import styles from "./NewTodo.module.css";

const NewTodo = (props) => {
  const [newTodo, setNewTodo] = useState("");

  const onChangeHandler = (event) => {
    setNewTodo(event.target.value);
  };

  const addNewTodoHandler = () => {
    if (newTodo.length > 0) {
      props.addNewTodo(newTodo);
      setNewTodo("");
    }
  };

  const keyUpHandler = (event) => {
    if (event.key === "Enter") {
      addNewTodoHandler();
    }
  };

  return (
    <div className={styles.NewTodo}>
      <input
        value={newTodo}
        onChange={onChangeHandler}
        onKeyDown={keyUpHandler}
      />
      <button onClick={addNewTodoHandler}>Add to List</button>
    </div>
  );
};

export default NewTodo;
