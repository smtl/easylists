import { useState } from "react";

const DeleteProject = (props) => {
  const [isDeleted, setIsDeleted] = useState(false);

  const onDeleteProjectHandler = () => {
    setIsDeleted(true);
    props.onDeleteProject();
  };

  if (isDeleted) {
    return <p>List deleted - select another list to continue</p>;
  } else {
    return (
      <button onClick={onDeleteProjectHandler}>
        Delete List and all List items
      </button>
    );
  }
};

export default DeleteProject;
