import React from "react";

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
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        gap: "10px",
        padding: "15px",
        borderRadius: "10px",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(10px)",
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px" }}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Entrez une URL"
          style={{
            padding: "8px 12px",
            borderRadius: "5px",
            border: "1px solid #ffffff40",
            background: "rgba(255,255,255,0.1)",
            color: "white",
            width: "300px",
            fontSize: "16px",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "8px 16px",
            borderRadius: "5px",
            border: "none",
            background: "#00ffff",
            color: "#000",
            fontSize: "16px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Charger
        </button>
      </form>
    </div>
  );
}
