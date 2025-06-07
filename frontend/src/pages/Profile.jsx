import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentDetails, updateUserProfile } from '../api/userApi';
import { checkUserStatus } from '../api/authApi';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Achievements from '../components/Achievements';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();

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
    <Container maxWidth="md" sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', mb: 3 }}>
        <Card sx={{
          backgroundColor: 'var(--bg-white)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--box-shadow-sm)',
          p: { xs: 2, sm: 3 },
          transition: 'all 0.3s ease',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <Typography variant="h5" gutterBottom sx={{ color: 'var(--text-primary)' }}>
            Profile Info
          </Typography>

          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
          </Stack>

          <Box sx={{ mt: 3 }}>
            {!isEditing ? (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)' }}>Name:</Typography>
                  <Typography variant="body1" sx={{ color: 'var(--text-primary)' }}>
                    {profile.first_name} {profile.last_name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)' }}>Email:</Typography>
                  <Typography variant="body1" sx={{ color: 'var(--text-primary)' }}>{profile.email}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)' }}>Date of Birth:</Typography>
                  <Typography variant="body1" sx={{ color: 'var(--text-primary)' }}>
                    {profile.date_of_birth ? profile.date_of_birth : 'Not set'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)' }}>Gender:</Typography>
                  <Typography variant="body1" sx={{ color: 'var(--text-primary)' }}>{profile.gender}</Typography>
                </Box>
                <Button
                  variant="contained"
                  sx={{ 
                    mt: 2, 
                    alignSelf: 'flex-start', 
                    background: 'var(--primary)',
                    color: 'var(--bg-main)',
                    '&:hover': { 
                      background: 'var(--primary-dark)',
                    }
                  }}
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
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      color: 'var(--text-primary)',
                      '& fieldset': {
                        borderColor: 'var(--border-color)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'var(--primary)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'var(--text-secondary)',
                    },
                  }}
                />
                <TextField
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  fullWidth
                  InputLabelProps={{ style: { color: 'var(--text-primary)' } }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      color: 'var(--text-primary)',
                      '& fieldset': {
                        borderColor: 'var(--border-color)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'var(--primary)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'var(--text-secondary)',
                    },
                  }}
                />
                
                <TextField
                  label="Date of Birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  fullWidth
                  InputLabelProps={{ shrink: true, style: { color: 'var(--text-primary)' } }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      color: 'var(--text-primary)',
                      '& fieldset': {
                        borderColor: 'var(--border-color)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'var(--primary)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'var(--text-secondary)',
                    },
                  }}
                  inputProps={{ max: '2015-12-31' }}
                />
                <TextField
                  label="Gender"
                  placeholder=""
                  name="gender"
                  select
                  SelectProps={{ native: true }}
                  value={formData.gender}
                  onChange={handleInputChange}
                  fullWidth
                  InputLabelProps={{ style: { color: 'var(--text-primary)' } }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      color: 'var(--text-primary)',
                      '& fieldset': {
                        borderColor: 'var(--border-color)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'var(--primary)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'var(--text-secondary)',
                    },
                  }}
                >
                  <option value=""></option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </TextField>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    sx={{ 
                      background: 'var(--primary)',
                      color: 'var(--bg-main)',
                      '&:hover': { 
                        background: 'var(--primary-dark)',
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    sx={{ 
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-color)',
                      '&:hover': {
                        borderColor: 'var(--primary)',
                        color: 'var(--primary)',
                      }
                    }}
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
        </Card>
      </Box>

      {/* Achievements Section - full width, only for students */}
      {user?.profile?.role === 'student' && (
        <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', mb: 3 }}>
          <Achievements />
        </Box>
      )}
    </Container>
  );
};

export default Profile; 