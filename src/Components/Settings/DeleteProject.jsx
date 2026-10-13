import { useState } from "react";
import styles from "./SettingsController.module.css";

const DeleteProject = (props) => {
  const [confirming, setConfirming] = useState(false);
  const items = props.itemCount === 1 ? "1 item" : `${props.itemCount} items`;

  if (confirming) {
    return (
      <>
        <p>
          This can’t be undone. Permanently delete “{props.projectName}”
          {props.itemCount > 0 ? ` and its ${items}` : ""}?
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.danger}
            onClick={props.onDeleteProject}
          >
            Yes, delete permanently
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
        </div>
      </>
    );
  }

  const message =
    props.itemCount === 0
      ? `Delete “${props.projectName}”? It has no items.`
      : `Deleting “${props.projectName}” also deletes its ${items}.`;

  return (
    <>
      <p>{message}</p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.danger}
          onClick={() => setConfirming(true)}
        >
          Delete list
        </button>
        <button
          type="button"
          className={styles.secondary}
          onClick={props.onClose}
        >
          Keep list
        </button>
      </div>
    </>
  );
};

export default DeleteProject;
