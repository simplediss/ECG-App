import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import * as userApi from '../api/userApi';

const StudentOverview = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [student, setStudent] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const data = await userApi.getStudentDetails(username);
        setStudent(data);
        setError('');
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError('Failed to fetch student data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchStudentData();
    }
  }, [username]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              color: darkMode ? 'var(--text-primary)' : undefined,
              mb: 2
            }}
          >
            Back to Groups
          </Button>
        </Box>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      </Container>
    );
  }

  if (!student) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              color: darkMode ? 'var(--text-primary)' : undefined,
              mb: 2
            }}
          >
            Back to Groups
          </Button>
        </Box>
        <Alert severity="warning">Student not found.</Alert>
      </Container>
    );
  }

  const studentInfo = [
    { label: 'Username', value: student?.username || 'N/A' },
    { 
      label: 'Full Name', 
      value: student?.first_name && student?.last_name 
        ? `${student.first_name} ${student.last_name}` 
        : 'N/A' 
    },
    { label: 'Email', value: student?.email || 'N/A' },
    { label: 'Gender', value: student?.gender || 'Not specified' },
    { label: 'Role', value: student?.role?.toUpperCase() || 'N/A' },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{
            color: darkMode ? 'var(--text-primary)' : undefined,
            mb: 2
          }}
        >
          Back to Groups
        </Button>
      </Box>

      <Card 
        sx={{ 
          mb: 3,
          backgroundColor: darkMode ? 'var(--bg-white)' : undefined,
          color: darkMode ? 'var(--text-primary)' : undefined,
          border: darkMode ? '1px solid var(--border-color)' : undefined,
          boxShadow: darkMode ? 'var(--box-shadow)' : undefined,
        }}
      >
        <CardContent>
          <Typography variant="h4" gutterBottom sx={{ color: darkMode ? 'var(--text-primary)' : undefined }}>
            Student Overview
          </Typography>
          
          <TableContainer 
            component={Paper} 
            sx={{ 
              mt: 2,
              backgroundColor: darkMode ? 'var(--bg-main)' : undefined,
              color: darkMode ? 'var(--text-primary)' : undefined,
              border: darkMode ? '1px solid var(--border-color)' : undefined,
              boxShadow: darkMode ? 'var(--box-shadow-sm)' : undefined,
            }}
          >
            <Table>
              <TableHead sx={{ backgroundColor: darkMode ? 'var(--bg-main)' : undefined }}>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      color: darkMode ? 'var(--text-primary)' : undefined, 
                      fontWeight: '600', 
                      borderBottom: darkMode ? '1px solid var(--border-color)' : undefined,
                      width: '30%'
                    }}
                  >
                    Field
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      color: darkMode ? 'var(--text-primary)' : undefined, 
                      fontWeight: '600', 
                      borderBottom: darkMode ? '1px solid var(--border-color)' : undefined 
                    }}
                  >
                    Value
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentInfo.map((info) => (
                  <TableRow 
                    key={info.label}
                    sx={{ 
                      '&:hover': { backgroundColor: darkMode ? 'var(--bg-white)' : undefined },
                      borderBottom: darkMode ? '1px solid var(--border-color)' : undefined
                    }}
                  >
                    <TableCell 
                      component="th" 
                      scope="row"
                      sx={{ 
                        color: darkMode ? 'var(--text-primary)' : undefined,
                        borderBottom: darkMode ? '1px solid var(--border-color)' : undefined,
                        fontWeight: '500'
                      }}
                    >
                      {info.label}
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: darkMode ? 'var(--text-primary)' : undefined,
                        borderBottom: darkMode ? '1px solid var(--border-color)' : undefined
                      }}
                    >
                      {info.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  );
};

export default StudentOverview; 