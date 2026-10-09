import { useState } from "react";
import styles from "./NewProject.module.css";

const NewProject = (props) => {
  const [editingActive, setEditingActive] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const finish = (save) => {
    const name = newProjectName.trim();
    if (save && name.length > 0) {
      props.addNewProject(name);
    }
    setEditingActive(false);
    setNewProjectName("");
  };

  const keyDownHandler = (event) => {
    if (event.key === "Enter") {
      finish(true);
    }
    if (event.key === "Escape") {
      finish(false);
    }
  };

  return (
    <li className={styles.newproject}>
      {editingActive ? (
        <input
          aria-label="New list name"
          placeholder="List name"
          maxLength="30"
          type="text"
          enterKeyHint="done"
          autoFocus
          value={newProjectName}
          onChange={(event) => setNewProjectName(event.target.value)}
          onKeyDown={keyDownHandler}
          onBlur={() => finish(true)}
        />
      ) : (
        <button
          type="button"
          className={styles.add}
          aria-label="New list"
          onClick={() => setEditingActive(true)}
        >
          +
        </button>
      )}
    </li>
  );
};

export default NewProject;
