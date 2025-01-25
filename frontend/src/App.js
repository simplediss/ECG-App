import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import EcgSamplesList from "./components/EcgSamplesList";

const App = () => {
    return (
        <div>
            <header>
                <h1>My App</h1>
            </header>
            <main>
                {/* Render ECG Samples */}
                <EcgSamplesList />
            </main>
        </div>
    );
};

export default App;
