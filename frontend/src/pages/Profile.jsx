import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentDetails, updateUserProfile } from '../api/userApi';
import { checkUserStatus } from '../api/authApi';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    gender: '',
    date_of_birth: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userStatus = await checkUserStatus();
        if (!userStatus.user) {
          navigate('/login');
          return;
        }
        const profileData = await getStudentDetails(userStatus.user.username);
        setProfile(profileData);
        setFormData({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          email: profileData.email || '',
          gender: profileData.gender || '',
          date_of_birth: profileData.date_of_birth || ''
        });
      } catch (err) {
        setError('Failed to load profile data');
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate date_of_birth is not after 2015-12-31
    if (formData.date_of_birth && formData.date_of_birth > '2015-12-31') {
      setError('Date of birth cannot be after 2015.');
      return;
    }
    try {
      await updateUserProfile(profile.id, formData);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      // Refresh profile data
      const updatedProfile = await getStudentDetails(profile.username);
      setProfile(updatedProfile);
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  if (!profile) {
    return <Box sx={{ textAlign: 'center', py: 6, color: 'var(--text-primary)' }}>Loading...</Box>;
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper elevation={3} sx={{ p: 4, background: 'var(--bg-white)', color: 'var(--text-primary)' }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ color: 'var(--text-primary)' }}>
          Profile
        </Typography>

        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
        </Stack>

        <Box sx={{ mt: 3 }}>
          {!isEditing ? (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2">Name:</Typography>
                <Typography variant="body1">{profile.first_name} {profile.last_name}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Email:</Typography>
                <Typography variant="body1">{profile.email}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Date of Birth:</Typography>
                <Typography variant="body1">{profile.date_of_birth ? profile.date_of_birth : 'Not set'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Gender:</Typography>
                <Typography variant="body1">{profile.gender}</Typography>
              </Box>
              <Button
                variant="contained"
                sx={{ mt: 2, alignSelf: 'flex-start', background: 'var(--text-primary)', color: 'var(--bg-main)', '&:hover': { background: '#357abd' } }}
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            </Stack>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                fullWidth
                InputLabelProps={{ style: { color: 'var(--text-primary)' } }}
                sx={{ input: { color: 'var(--text-primary)', background: 'var(--bg-main)' } }}
              />
              <TextField
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                fullWidth
                InputLabelProps={{ style: { color: 'var(--text-primary)' } }}
                sx={{ input: { color: 'var(--text-primary)', background: 'var(--bg-main)' } }}
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                InputProps={{ readOnly: true }}
                required
                fullWidth
                InputLabelProps={{ style: { color: 'var(--text-primary)' } }}
                sx={{ input: { color: 'var(--text-primary)', background: 'var(--bg-main)' } }}
              />
              <TextField
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                fullWidth
                InputLabelProps={{ shrink: true, style: { color: 'var(--text-primary)' } }}
                sx={{ input: { color: 'var(--text-primary)', background: 'var(--bg-main)' } }}
                inputProps={{ max: '2015-12-31' }}
              />
              <TextField
                label="Gender"
                name="gender"
                select
                SelectProps={{ native: true }}
                value={formData.gender}
                onChange={handleInputChange}
                fullWidth
                InputLabelProps={{ style: { color: 'var(--text-primary)' } }}
                sx={{ select: { color: 'var(--text-primary)', background: 'var(--bg-main)' } }}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </TextField>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button type="submit" variant="contained" sx={{ background: 'var(--text-primary)', color: 'var(--bg-main)', '&:hover': { background: '#218838' } }}>
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  sx={{ color: 'var(--text-primary)', borderColor: 'var(--text-primary)' }}
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      first_name: profile.first_name || '',
                      last_name: profile.last_name || '',
                      email: profile.email || '',
                      gender: profile.gender || '',
                      date_of_birth: profile.date_of_birth || ''
                    });
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile; 