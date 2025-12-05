import { useEffect, useState, type FormEvent } from "react";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  onSubmit: (url: string) => void;
}

export function SearchBar({ onSubmit }: SearchBarProps) {
  const [url, setUrl] = useState("https://google.com");
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(url);
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("url");
    if (urlParam) {
      setUrl(decodeURIComponent(urlParam));
      onSubmit(decodeURIComponent(urlParam));
    }
  }, []);

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
