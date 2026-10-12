import { useState } from "react";
import styles from "./SettingsController.module.css";

// Sharing is just sending the URL — the id in it is the only access
// credential there is, so handing someone this link is the entire "invite".
const ShareNotepad = (props) => {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "EasyLists", url: props.url });
        return;
      } catch {
        return; // cancelled or unsupported mid-flight — don't also copy
      }
    }
    try {
      await navigator.clipboard.writeText(props.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing more to do without user interaction
    }
  };

  return (
    <div className={`${styles.actions} ${styles.shareActions}`}>
      <button type="button" className={styles.secondary} onClick={share}>
        {copied ? "Link copied" : "Share this notepad"}
      </button>
    </div>
  );
};

export default ShareNotepad;
