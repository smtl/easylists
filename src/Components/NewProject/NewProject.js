import { useState } from "react";
import styles from "./NewProject.module.css";

const NewProject = (props) => {
  const [editingActive, setEditingActive] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const newProjectHandler = () => {
    setEditingActive(true);
  };

  const NewProjectNameHandler = (event) => {
    setNewProjectName(event.target.value);
  };

  const AddNewProjectHandler = (event) => {
    if (event.key === "Enter") {
      if (newProjectName.length > 0) {
        props.addNewProject(newProjectName);
        setEditingActive(false);
        setNewProjectName("");
      }
    }

    if (event.key === "Escape") {
      setEditingActive(false);
    }
  };

  if (!editingActive) {
    return (
      <div className={styles.newproject}>
        <ul>
          <li onClick={newProjectHandler}>+</li>
        </ul>
      </div>
    );
  } else {
    return (
      <div className={styles.newproject}>
        <input
          maxlength="17"
          type="text"
          autoFocus
          onChange={NewProjectNameHandler}
          onKeyDown={AddNewProjectHandler}
        ></input>
      </div>
    );
  }
};

export default NewProject;
