import NewTodo from "../NewTodo/NewTodo";
import UndoneTodos from "./UndoneTodos";
import DoneTodos from "./DoneTodos";

const TodoList = (props) => {
  return (
    <>
      <UndoneTodos
        activeListId={props.activeListId}
        todos={props.todos}
        completeTodo={props.completeTodo}
      />
      <NewTodo addNewTodo={props.addNewTodo} />
      <DoneTodos
        activeListId={props.activeListId}
        todos={props.todos}
        completeTodo={props.completeTodo}
        deleteTodo={props.deleteTodo}
      />
    </>
  );
};

export default TodoList;
