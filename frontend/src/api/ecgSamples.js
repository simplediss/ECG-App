import axiosInstance from "./axiosInstance";

export const getAllSamples = async () => {
    const response = await axiosInstance.get("ecg-samples/");
    return response.data;
};

export const getSampleById = async (id) => {
    const response = await axiosInstance.get(`ecg-samples/${id}/`);
    return response.data;
};

export const createSample = async (sample) => {
    const response = await axiosInstance.post("ecg-samples/", sample);
    return response.data;
};

export const updateSample = async (id, sample) => {
    const response = await axiosInstance.put(`ecg-samples/${id}/`, sample);
    return response.data;
};

export const deleteSample = async (id) => {
    const response = await axiosInstance.delete(`ecg-samples/${id}/`);
    return response.data;
};
