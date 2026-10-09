import { useEffect, useRef } from "react";
import styles from "./Project.module.css";

const Project = (props) => {
  const tabRef = useRef(null);

  // Keep the selected tab visible when the tab row scrolls sideways
  useEffect(() => {
    if (props.active && tabRef.current && tabRef.current.scrollIntoView) {
      tabRef.current.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [props.active]);

  return (
    <li
      ref={tabRef}
      className={`${styles.tab} ${props.active ? styles.active : ""}`}
    >
      <button
        type="button"
        aria-current={props.active ? "page" : undefined}
        onClick={() => props.onSelect(props.name)}
      >
        {props.name}
      </button>
    </li>
  );
};

export default Project;
