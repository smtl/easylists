import styles from "./SettingsController.module.css";
import DeleteProject from "./DeleteProject";
import ShareNotepad from "./ShareNotepad";

const SettingsContainer = (props) => {
  return (
    <div className={styles.content}>
      <ShareNotepad url={props.shareUrl} />
      <DeleteProject
        projectName={props.projectName}
        itemCount={props.itemCount}
        onDeleteProject={props.onDeleteProject}
        onClose={props.onClose}
      />
    </div>
  );
};

export default SettingsContainer;
