import TodoList from "./Components/Todos/TodoList";
import ProjectList from "./Components/Projects/ProjectList";
import Header from "./UI/Header";
import { useState } from "react";
import styles from "./Base.module.css";
import useStickyState from "./Hooks/StickyStateHook";
import SettingsContainer from "./Components/Settings/SettingsContainer";

const projects_static = [
  {
    key: Math.random().toString(36).replace("0.", "id"),
    name: "Shopping",
  },
  {
    key: Math.random().toString(36).replace("0.", "id"),
    name: "Wedding",
  },
  {
    key: Math.random().toString(36).replace("0.", "id"),
    name: "Holiday",
  },
];

const todos_static = [
  {
    key: Math.random().toString(36).replace("0.", "id"),
    text: "Buy milk",
    project: "Shopping",
    done: false,
    createdDate: new Date(),
    completedDate: null,
  },
  {
    key: Math.random().toString(36).replace("0.", "id"),
    text: "Buy eggs",
    project: "Shopping",
    done: false,
    createdDate: new Date(),
    completedDate: null,
  },
  {
    key: Math.random().toString(36).replace("0.", "id"),
    text: "Buy butter",
    project: "Shopping",
    done: false,
    createdDate: new Date(),
    completedDate: null,
  },
  {
    key: Math.random().toString(36).replace("0.", "id"),
    text: "Arrange suits",
    project: "Wedding",
    done: false,
    createdDate: new Date(),
    completedDate: null,
  },
  {
    key: Math.random().toString(36).replace("0.", "id"),
    text: "Book honeymoon",
    project: "Wedding",
    done: false,
    createdDate: new Date(),
    completedDate: null,
  },
  {
    key: Math.random().toString(36).replace("0.", "id"),
    text: "Book flight",
    project: "Holiday",
    done: false,
    createdDate: new Date(),
    completedDate: null,
  },
  {
    key: Math.random().toString(36).replace("0.", "id"),
    text: "Buy suncream",
    project: "Holiday",
    done: false,
    createdDate: new Date(),
    completedDate: null,
  },
  {
    key: Math.random().toString(36).replace("0.", "id"),
    text: "Create packing list",
    project: "Holiday",
    done: false,
    createdDate: new Date(),
    completedDate: null,
  },
];

function App() {
  const [todos, setTodos] = useStickyState(todos_static, "todos_sticky");
  const [projects, setProjects] = useStickyState(
    projects_static,
    "projects_sticky"
  );
  const [activeProject, setActiveProject] = useState(projects_static[0].name);
  const [settingsActive, setSettingsActive] = useState(false);

  const projectSelectHandler = (projectName) => {
    setSettingsActive(false);
    setActiveProject(projectName);
  };

  const addNewTodo = (todoText) => {
    setTodos((prevState) => {
      return [
        {
          key: Math.random().toString(36).replace("0.", "id"),
          text: todoText,
          project: activeProject,
        },
        ...prevState,
      ];
    });
  };

  const completeTodo = (todo) => {
    setTodos((prevState) => {
      const updatedTodos = prevState.filter(
        (todoItem) => todoItem.key !== todo.key
      );

      const updatedTodoList = [
        {
          ...todo,
          key: Math.random().toString(36).replace("0.", "id"),
          createdDate: new Date(),
          done: todo.done ? false : true,
          completedDate: todo.done ? null : new Date(),
        },
        ...updatedTodos,
      ];

      return updatedTodoList;
    });
  };

  const deleteTodo = (todo) => {
    setTodos((prevState) => {
      const updatedTodos = prevState.filter(
        (todoItem) => todoItem.key !== todo.key
      );

      return updatedTodos;
    });
  };

  const addNewProject = (projectName) => {
    const existingProject = projects.find((p) => p.name === projectName);
    if (existingProject) {
      return;
    }

    setProjects((prevState) => {
      return [
        ...prevState,
        {
          key: Math.random().toString(36).replace("0.", "id"),
          name: projectName,
        },
      ];
    });
  };

  const onSettingsSelection = (projectName) => {
    setSettingsActive(true);
    setActiveProject(projectName);
  };

  const getProject = () => {
    return projects.find((p) => p.name === activeProject);
  };

  const onDeleteProject = () => {
    const project = getProject();

    setProjects((prevState) => {
      const updatedProjects = prevState.filter((p) => p.key !== project.key);
      return [...updatedProjects];
    });

    setTodos((prevState) => {
      const updatedTodos = prevState.filter(
        (todoItem) => todoItem.project !== project.name
      );
      return [...updatedTodos];
    });
  };

  return (
    <div className={styles.wrapper}>
      <Header>
        {activeProject} {settingsActive ? "Settings" : "List"}
      </Header>
      <ProjectList
        projects={projects}
        onSelect={projectSelectHandler}
        addNewProject={addNewProject}
        onSettingsSelection={onSettingsSelection}
      />
      {settingsActive ? (
        <SettingsContainer
          projectName={activeProject}
          project={() => getProject()}
          onDeleteProject={onDeleteProject}
        />
      ) : (
        <TodoList
          addNewTodo={addNewTodo}
          completeTodo={completeTodo}
          deleteTodo={deleteTodo}
          todos={todos}
          activeProject={activeProject}
        />
      )}
    </div>
  );
}

export default App;
