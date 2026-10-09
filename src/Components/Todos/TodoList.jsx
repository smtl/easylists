import NewTodo from "../NewTodo/NewTodo";
import UndoneTodos from "./UndoneTodos";
import DoneTodos from "./DoneTodos";

const TodoList = (props) => {
  return (
    <>
      <UndoneTodos
        activeProject={props.activeProject}
        todos={props.todos}
        completeTodo={props.completeTodo}
      />
      <NewTodo addNewTodo={props.addNewTodo} />
      <DoneTodos
        activeProject={props.activeProject}
        todos={props.todos}
        completeTodo={props.completeTodo}
        deleteTodo={props.deleteTodo}
      />
    </>
  );
};

export default TodoList;
