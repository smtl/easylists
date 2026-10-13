import styles from "./SettingsController.module.css";
import DeleteProject from "./DeleteProject";
import ShareNotepad from "./ShareNotepad";
import ResetList from "./ResetList";

const SettingsContainer = (props) => {
  return (
    <div className={styles.content}>
      <ShareNotepad url={props.shareUrl} />
      <ResetList
        projectName={props.projectName}
        doneCount={props.doneCount}
        onResetProject={props.onResetProject}
      />
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
