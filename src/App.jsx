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

const newKey = () => Math.random().toString(36).replace("0.", "id");

function App() {
  const [todos, setTodos] = useStickyState(todos_static, "todos_sticky");
  const [projects, setProjects] = useStickyState(
    projects_static,
    "projects_sticky"
  );
  const [savedActiveProject, setActiveProject] = useStickyState(
    projects_static[0].name,
    "active_project_sticky"
  );
  const [settingsActive, setSettingsActive] = useState(false);

  // Fall back to the first list if the saved one no longer exists
  const activeProject = projects.some((p) => p.name === savedActiveProject)
    ? savedActiveProject
    : projects.length > 0
    ? projects[0].name
    : null;

  const projectSelectHandler = (projectName) => {
    setSettingsActive(false);
    setActiveProject(projectName);
  };

  const addNewTodo = (todoText) => {
    setTodos((prevState) => {
      return [
        ...prevState,
        {
          key: newKey(),
          text: todoText,
          project: activeProject,
          done: false,
          createdDate: new Date(),
          completedDate: null,
        },
      ];
    });
  };

  const completeTodo = (todo) => {
    setTodos((prevState) => {
      const updatedTodos = prevState.filter(
        (todoItem) => todoItem.key !== todo.key
      );

      return [
        {
          ...todo,
          key: newKey(),
          createdDate: new Date(),
          done: !todo.done,
          completedDate: todo.done ? null : new Date(),
        },
        ...updatedTodos,
      ];
    });
  };

  const deleteTodo = (todo) => {
    setTodos((prevState) =>
      prevState.filter((todoItem) => todoItem.key !== todo.key)
    );
  };

  const addNewProject = (projectName) => {
    const existingProject = projects.find((p) => p.name === projectName);
    if (!existingProject) {
      setProjects((prevState) => [
        ...prevState,
        { key: newKey(), name: projectName },
      ]);
    }
    // Open the list straight away, whether it's new or already exists
    setSettingsActive(false);
    setActiveProject(projectName);
  };

  const onDeleteProject = () => {
    const remaining = projects.filter((p) => p.name !== activeProject);
    setProjects(remaining);
    setTodos((prevState) =>
      prevState.filter((todoItem) => todoItem.project !== activeProject)
    );
    setSettingsActive(false);
    setActiveProject(remaining.length > 0 ? remaining[0].name : null);
  };

  const itemCount = todos.filter((t) => t.project === activeProject).length;

  return (
    <div className={styles.desk}>
      <main className={styles.pad}>
        <ProjectList
          projects={projects}
          activeProject={activeProject}
          onSelect={projectSelectHandler}
          addNewProject={addNewProject}
        />
        <div className={styles.sheet}>
          {activeProject ? (
            <>
              <Header
                optionsActive={settingsActive}
                onToggleOptions={() => setSettingsActive((s) => !s)}
              >
                {activeProject}
              </Header>
              {settingsActive ? (
                <SettingsContainer
                  projectName={activeProject}
                  itemCount={itemCount}
                  onDeleteProject={onDeleteProject}
                  onClose={() => setSettingsActive(false)}
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
            </>
          ) : (
            <>
              <Header>No lists yet</Header>
              <p className={styles.empty}>Tap + above to start a list.</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
