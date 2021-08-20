import Todo from "./Todo";

const DoneTodos = (props) => {
  const filteredDoneTodos = props.todos
    .filter((todo) => todo.project === props.activeProject && todo.done)
    .sort((a, b) => {
      return (
        new Date(a.completedDate).getTime() -
        new Date(b.completedDate).getTime()
      );
    })
    .reverse();

  return (
    <ul>
      {filteredDoneTodos.map((todo) => {
        return (
          <Todo
            key={todo.key}
            completeTodo={props.completeTodo}
            todo={todo}
            deleteTodo={props.deleteTodo}
          />
        );
      })}
    </ul>
  );
};

export default DoneTodos;
