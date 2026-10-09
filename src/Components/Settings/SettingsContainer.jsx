import styles from "./SettingsController.module.css";
import DeleteProject from "./DeleteProject";

const SettingsContainer = (props) => {
  return (
    <div className={styles.content}>
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
