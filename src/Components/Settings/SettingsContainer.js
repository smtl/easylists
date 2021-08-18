import styles from "./SettingsController.module.css";
import DeleteProject from "./DeleteProject";

const SettingsContainer = (props) => {
  return (
    <div className={styles.content}>
      <DeleteProject
        project={props.project}
        onDeleteProject={props.onDeleteProject}
      />
    </div>
  );
};

export default SettingsContainer;
