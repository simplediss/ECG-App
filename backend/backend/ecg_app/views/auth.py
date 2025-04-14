from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.models import User
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings

from ..models import User
from ..serializers import LoginSerializer, RegistrationSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def api_login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        login_identifier = serializer.validated_data['login_identifier']
        password = serializer.validated_data['password']
        
        # Check if login_identifier is an email
        if '@' in login_identifier:
            try:
                # Try to get user by email
                user_obj = User.objects.get(email=login_identifier)
                # Authenticate with the username
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None
        else:
            # Authenticate with username
            user = authenticate(username=login_identifier, password=password)
        
        if user is not None:
            login(request, user)
            profile = getattr(user, 'profile', None)
            return Response({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_staff': user.is_staff,
                    'profile': {
                        'role': profile.role if profile else 'student'
                    } if profile else None
                }
            })
        else:
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ensure_csrf_cookie
def api_logout(request):
    logout(request)
    return Response({'message': 'Logout successful'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_user_status(request):
    user = request.user
    profile = getattr(user, 'profile', None)
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'profile': {
                'role': profile.role if profile else 'student'
            } if profile else None
        }
    })

@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def api_csrf(request):
    return Response({'csrfToken': get_token(request)})

@api_view(['POST'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def api_register(request):
    print("Received registration data:", request.data)  # Debug print
    serializer = RegistrationSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save()
            return Response({
                'message': 'Registration successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            print("Registration error:", str(e))  # Debug print
            return Response({
                'message': 'Registration failed',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    print("Validation errors:", serializer.errors)  # Debug print
    return Response({
        'message': 'Invalid data',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def api_password_reset_request(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        
        # Generate password reset token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Create reset link
        reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
        
        # Send email
        subject = 'Password Reset Request'
        message = f'Click the following link to reset your password: {reset_link}'
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [email]
        
        try:
            send_mail(subject, message, from_email, recipient_list)
            return Response({
                'message': 'Password reset email has been sent.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Failed to send password reset email.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def api_password_reset_confirm(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if serializer.is_valid():
        try:
            uid = force_str(urlsafe_base64_decode(request.data.get('uid')))
            user = User.objects.get(pk=uid)
            token = request.data.get('token')
            
            if default_token_generator.check_token(user, token):
                user.set_password(serializer.validated_data['password'])
                user.save()
                return Response({
                    'message': 'Password has been reset successfully.'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Invalid or expired token.'
                }, status=status.HTTP_400_BAD_REQUEST)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({
                'error': 'Invalid user ID.'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
