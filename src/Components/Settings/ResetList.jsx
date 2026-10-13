import styles from "./SettingsController.module.css";

// Un-checks every done item without touching the items themselves — for a
// list reused as a recurring checklist (e.g. the same packing list every
// outing) rather than a one-shot todo list.
const ResetList = (props) => {
  if (props.doneCount === 0) {
    return null;
  }

  const items = props.doneCount === 1 ? "1 checked item" : `${props.doneCount} checked items`;

  return (
    <>
      <p>
        Uncheck {items} so you can reuse “{props.projectName}” again, without
        losing the list itself.
      </p>
      <div className={`${styles.actions} ${styles.sectionDivider}`}>
        <button type="button" className={styles.secondary} onClick={props.onResetProject}>
          Reset list
        </button>
      </div>
    </>
  );
};

export default ResetList;
