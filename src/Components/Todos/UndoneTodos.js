import Todo from "./Todo";

const UndoneTodos = (props) => {
  const filteredUndoneTodos = props.todos
    .filter((todo) => todo.project === props.activeProject && !todo.done)
    .sort((a, b) => {
      return (
        new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
      );
    });

  if (filteredUndoneTodos.length < 1) {
    return <p>Nothing left to do!</p>;
  } else {
    return (
      <ul>
        {filteredUndoneTodos.map((todo) => {
          return (
            <Todo
              key={todo.key}
              completeTodo={props.completeTodo}
              todo={todo}
            />
          );
        })}
      </ul>
    );
  }
};

export default UndoneTodos;
