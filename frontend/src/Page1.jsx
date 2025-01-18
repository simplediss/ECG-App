import React from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Component } from "react";

export default class Page1 extends Component() {
  render(){
    return (
        <div className="Page1">
          <h1>Hello world</h1>
          <Button variant="primary">Primary</Button>{" "}
          <Button variant="secondary">Secondary</Button>{" "}
          <Button variant="success">Success</Button>{" "}
        </div>
    )
  }
}
