import os
from django.conf import settings
from django.http import FileResponse, Http404, HttpResponseRedirect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def serve_ecg_image(request, image_path):
    """
    Serve ECG images - directly in development, redirect to Nginx in production.
    """
    # Normalize the path to prevent directory traversal attacks
    normalized_path = os.path.normpath(image_path)
    
    # Remove any leading slashes to make the path relative
    normalized_path = normalized_path.lstrip('/')
    
    # Add .png extension if not present
    if not normalized_path.lower().endswith('.png'):
        normalized_path += '.png'
    
    # Construct the full path for validation
    full_path = os.path.join(settings.DATASET_SAMPLES_PATH, normalized_path)
    
    # Security check: ensure the path is within the dataset directory
    if not os.path.abspath(full_path).startswith(os.path.abspath(settings.DATASET_SAMPLES_PATH)):
        raise Http404("Invalid image path")
    
    # Check if file exists
    if not os.path.exists(full_path):
        raise Http404("Image not found")
    
    # Check if it's an image file
    if not any(full_path.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.gif', '.bmp']):
        raise Http404("Invalid file type")
    
    if settings.DEBUG:
        # In development, serve the file directly through Django
        return FileResponse(open(full_path, 'rb'), content_type='image/png')
    else:
        # In production, redirect to Nginx
        return HttpResponseRedirect(f'/ecg-images/{normalized_path}')

