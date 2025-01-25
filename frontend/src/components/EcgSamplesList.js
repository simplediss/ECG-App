import React, { useEffect, useState } from "react";
import { getAllSamples } from "../api/ecgSamples";

const EcgSamplesList = () => {
    const [samples, setSamples] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSamples = async () => {
            try {
                const data = await getAllSamples();
                setSamples(data);
            } catch (error) {
                console.error("Failed to fetch ECG samples:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSamples();
    }, []);

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <h1>ECG Samples</h1>
            <table border="1" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th>Sample ID</th>
                        <th>Sample Path</th>
                        <th>Gender</th>
                        <th>Age</th>
                    </tr>
                </thead>
                <tbody>
                    {samples.map((sample) => (
                        <tr key={sample.sample_id}>
                            <td>{sample.sample_id}</td>
                            <td>{sample.sample_path}</td>
                            <td>{sample.gender || "N/A"}</td>
                            <td>{sample.age || "N/A"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default EcgSamplesList;
