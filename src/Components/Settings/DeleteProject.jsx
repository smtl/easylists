import styles from "./SettingsController.module.css";

const DeleteProject = (props) => {
  const items =
    props.itemCount === 1 ? "1 item" : `${props.itemCount} items`;
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
          onClick={props.onDeleteProject}
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
