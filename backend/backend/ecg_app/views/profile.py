from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied

from ..models import Profile
from ..serializers import ProfileSerializer
from ..permissions import IsTeacherOrAdmin


class ProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        user = self.request.user
        print(f"ProfileViewSet: User {user.username} requesting profiles")
        print(f"Is staff: {user.is_staff}")
        print(f"Has profile: {hasattr(user, 'profile')}")
        if hasattr(user, 'profile'):
            print(f"User role: {user.profile.role}")

        if user.is_staff:
            queryset = Profile.objects.all()
        elif hasattr(user, 'profile') and user.profile.role == 'teacher':
            queryset = Profile.objects.filter(role='student')
        else:
            queryset = Profile.objects.none()
        
        print(f"Returning {queryset.count()} profiles")
        return queryset.select_related('user')  # Add select_related to optimize query


class ProfileByUsernameView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer

    def get_object(self):
        username = self.kwargs['username']
        user = self.request.user
        # Allow staff, teachers, or the user themselves
        if user.is_staff or (hasattr(user, 'profile') and getattr(user.profile, 'role', None) == 'teacher') or user.username == username:
            return get_object_or_404(Profile, user__username=username)
        else:
            raise PermissionDenied('You do not have permission to view this profile.')


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user_profile(request, profile_id):
    """
    Custom endpoint to update both User and Profile models in a single request.
    Only admin users can update other users.
    """
    try:
        # Check if the profile exists
        profile = Profile.objects.select_related('user').get(id=profile_id)
        
        # Only admin users can update other users
        if not request.user.is_staff and request.user.id != profile.user.id:
            return Response(
                {'error': 'You do not have permission to update this user.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get data from request
        data = request.data
        user_data = data.get('user', {})
        profile_data = {
            'date_of_birth': data.get('date_of_birth'),
            'gender': data.get('gender'),
        }
        
        # If role is provided and user is admin, update role
        if request.user.is_staff and 'role' in data:
            profile_data['role'] = data['role']
        
        # Update User model fields
        user = profile.user
        if 'email' in user_data:
            user.email = user_data['email']
        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            user.last_name = user_data['last_name']
            
        # Update password if provided
        if 'password' in user_data and user_data['password']:
            user.set_password(user_data['password'])
            
        # Save user
        user.save()
        
        # Update Profile model fields
        for key, value in profile_data.items():
            if value is not None:  # Only update if provided
                setattr(profile, key, value)
        
        # Save profile
        profile.save()
        
        # Return updated profile with user data
        return Response({
            'id': profile.id,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'role': profile.get_role_display(),
            'date_of_birth': profile.date_of_birth,
            'gender': profile.gender,
        })
        
    except Profile.DoesNotExist:
        return Response(
            {'error': 'Profile not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
