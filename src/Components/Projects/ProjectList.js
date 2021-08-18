import styles from "./ProjectList.module.css";
import Project from "./Project";
import NewProject from "../NewProject/NewProject";

const ProjectList = (props) => {
  return (
    <div className={styles.sidebar}>
      <ul>
        {props.projects.map((project) => {
          return (
            <Project
              key={project.key}
              name={project.name}
              onSelect={props.onSelect}
              onSettingsSelection={props.onSettingsSelection}
            />
          );
        })}
      </ul>
      <NewProject addNewProject={props.addNewProject} />
    </div>
  );
};

export default ProjectList;
