import React from "react";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  onSubmit: (url: string) => void;
}

export function SearchBar({ onSubmit }: SearchBarProps) {
  const [url, setUrl] = React.useState("https://google.com");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(url);
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Entrez une URL"
          className={styles.input}
        />
        <button type="submit" className={styles.button}>
          Load
        </button>
      </form>
    </div>
  );
}
