import { useState } from "react";
import styles from "./Project.module.css";

const Project = (props) => {
  const [showSettingsIcon, setShowSettingsIcon] = useState(false);

  return (
    <div
      className={styles.project}
      onMouseEnter={() => setShowSettingsIcon(true)}
      onMouseLeave={() => setShowSettingsIcon(false)}
    >
      <li onClick={() => props.onSelect(props.name)}>{props.name}</li>
      {showSettingsIcon && (
        <span
          onClick={() => props.onSettingsSelection(props.name)}
          className={styles.settings}
        >
          {"\u2699"}
        </span>
      )}
    </div>
  );
};

export default Project;
