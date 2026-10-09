import styles from "./Header.module.css";

const Header = (props) => {
  return (
    <header className={styles.title}>
      <h1>{props.children}</h1>
      {props.onToggleOptions && (
        <button
          type="button"
          className={styles.options}
          aria-label="List options"
          aria-pressed={props.optionsActive}
          onClick={props.onToggleOptions}
        >
          {"\u22EF"}
        </button>
      )}
    </header>
  );
};

export default Header;
