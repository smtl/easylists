import styles from "./ProjectList.module.css";
import Project from "./Project";
import NewProject from "../NewProject/NewProject";

const ProjectList = (props) => {
  return (
    <nav className={styles.binding} aria-label="Lists">
      <ul className={styles.tabs}>
        {props.projects.map((project) => {
          return (
            <Project
              key={project.key}
              name={project.name}
              active={project.name === props.activeProject}
              onSelect={props.onSelect}
            />
          );
        })}
        <NewProject addNewProject={props.addNewProject} />
      </ul>
    </nav>
  );
};

export default ProjectList;
