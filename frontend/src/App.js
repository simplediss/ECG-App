import "./App.css";
import { Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useState } from "react";

function App() {
  const [item, setItem] = useState(null); // State to store item data
  const [error, setError] = useState(null); // State to store error message

  const fetchItem = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/item1/"); 
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setItem(data); 
      setError(null); // Clear any previous errors
    } catch (err) {
      setError(err.message); // Handle any fetch or parsing errors
      setItem(null); 
    }
  };

  return (
    <div className="Page1">
      <h1>Hello world</h1>
      <Button variant="success" onClick={fetchItem}>
        Get User 1
      </Button>
      {item && (
        <div className="mt-3 alert alert-success">
          <h4>User Details:</h4>
          <p><strong>ID:</strong> {item.id}</p>
          <p><strong>Name:</strong> {item.name}</p>
          <p><strong>Email:</strong> {item.description}</p>
        </div>
      )}
      {error && (
        <div className="mt-3 alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}

export default App;
