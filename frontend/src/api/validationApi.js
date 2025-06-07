import axiosInstance from './axiosInstance';

export const fetchSamples = async () => {
  try{
    const response = await axiosInstance.get('samples/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

  export const fetchValidations = async () => {
    try{
      const response = await axiosInstance.get('/validations/validated_samples/');
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Get pending samples that need validation
  export const fetchPendingSamples = async () => {
    try {
      console.log('Fetching pending samples...');
      const response = await axiosInstance.get('/validations/pending_samples/');
      
      console.log('Pending samples fetched successfully:', {
        count: response.data.count,
        timestamp: new Date().toISOString()
      });

      return response.data;
    } catch (error) {
      console.error('Failed to fetch pending samples:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  };

  export const fetchValidatedSamples = async () => {
    try {
      const response = await axiosInstance.get('/validations/validated_samples/');
      return response.data;
    } catch (error) {
      throw error;
    }
  };
       
  // Update an existing validation
  export const updateValidation = async (id, data) => {
    try{
      console.log('Updating validation with data:', {
        validationId: id,
        data: data
      });
      // Only send tag IDs, not full objects
      const payload = {
        prev_tag_id: data.prev_tag?.label_id || data.prev_tag_id,
        new_tag_id: data.new_tag?.label_id || data.new_tag_id,
        comment: data.comment || ''
      };
      const response = await axiosInstance.patch(`/validations/${id}/validate/`, payload);
      console.log('Validation updated successfully:', {
        validationId: response.data.id,
        sampleId: response.data.sample,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Validation update failed:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        validationId: id,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  };

  // Delete a validation
  export const deleteValidation = async (id) => {
    try{
      const response = await axiosInstance.delete(`/validations/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  };
 