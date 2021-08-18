import styles from "./Header.module.css";

const Header = (props) => {
  return (
    <div className={`${styles.box} ${styles.header}`}>{props.children}</div>
  );
};

export default Header;
