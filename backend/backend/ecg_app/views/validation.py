from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import EcgSampleValidation, ValidationHistory, EcgSamples, EcgDocLabels, EcgSamplesDocLabels
from ..serializers import EcgSampleValidationSerializer
from ..permissions import IsTeacherOrAdmin
from rest_framework.permissions import IsAuthenticated
import logging
from rest_framework import serializers

logger = logging.getLogger(__name__)

# ---------------------------------------- [ECG Sample Validation API views] ----------------------------------------

@method_decorator(ensure_csrf_cookie, name='dispatch')
class EcgSampleValidationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling ECG sample validations by teachers.
    """
    serializer_class = EcgSampleValidationSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get_permissions(self):
        if self.action in ['validated_samples', 'validate']:
            return [IsAuthenticated(), IsTeacherOrAdmin()]
        return super().get_permissions()
    
    def get_queryset(self):
        """Return validations for the current teacher or all if admin."""
        user = self.request.user
        if user.is_staff or (hasattr(user, 'profile') and getattr(user.profile, 'role', None) == 'teacher'):
            return EcgSampleValidation.objects.all()
        return EcgSampleValidation.objects.filter(history__validated_by=user).distinct()

    @action(detail=False, methods=['get'])
    def all_labels(self, request):
        """Get all possible label ids and descriptions."""
        try:
            labels = list(EcgDocLabels.objects.values('label_id', 'label_desc'))
            return Response({'labels': labels})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        validation = serializer.save()
        # Create validation history entry
        ValidationHistory.objects.create(
            validation=validation,
            validated_by=self.request.user,
            sample=validation.sample,
            prev_tag=validation.prev_tag,
            new_tag=validation.new_tag
        )
        # Update the validation status
        validation.have_been_validated = True
        validation.save()

    def perform_update(self, serializer):
        # Save the updated validation object
        validation = serializer.save()

        # Get the new values from the serializer's validated data
        prev_tag = serializer.validated_data.get('prev_tag', validation.prev_tag)
        new_tag = serializer.validated_data.get('new_tag', validation.new_tag)

        if new_tag is None:
            raise serializers.ValidationError("new_tag must not be null")

        print(f'Creating ValidationHistory: prev_tag={prev_tag}, new_tag={new_tag}')

        # Create validation history entry for the update
        ValidationHistory.objects.create(
            validation=validation,
            validated_by=self.request.user,
            sample=validation.sample,
            prev_tag=prev_tag,
            new_tag=new_tag,  # <-- This will never be None if sent from frontend
            comment=self.request.data.get('comment', '')
        )

    @action(detail=False, methods=['get'])
    def pending_samples(self, request):
        """Get all ECG samples that haven't been validated."""
        # Get all samples that haven't been validated
        pending_samples = EcgSampleValidation.objects.filter(have_been_validated=False)
        
        response_data = {
            'count': pending_samples.count(),
            'samples': [
                {
                    'id': validation.id,  # Use validation's own ID
                    'sample_id': validation.sample.sample_id,
                    'path': validation.sample.sample_path,
                    'prev_tag': {
                        'label_id': validation.prev_tag.label_id,
                        'label_desc': validation.prev_tag.label_desc
                    } if validation.prev_tag else None,
                    'new_tag': {
                        'label_id': validation.new_tag.label_id,
                        'label_desc': validation.new_tag.label_desc
                    } if validation.new_tag else None
                }
                for validation in pending_samples
            ]
        }
        
        return Response(response_data)
    
    @action(detail=False, methods=['get'])
    def validated_samples(self, request):
        """Get all ECG samples that have been validated."""
        validated_samples = EcgSampleValidation.objects.filter(have_been_validated=True)
        logger.info(f'Found {validated_samples.count()} validated samples')
        
        response_data = {
            'count': validated_samples.count(),
            'samples': [
                {
                    'id': validation.id,  # Use validation's own ID
                    'sample_id': validation.sample.sample_id,
                    'path': validation.sample.sample_path,
                    'prev_tag': {
                        'label_id': validation.prev_tag.label_id,
                        'label_desc': validation.prev_tag.label_desc
                    } if validation.prev_tag else None,
                    'new_tag': {
                        'label_id': validation.new_tag.label_id,
                        'label_desc': validation.new_tag.label_desc
                    } if validation.new_tag else None,
                    'history': [
                        {
                            'validated_by': hist.validated_by.username,
                            'prev_tag': {
                                'label_id': hist.prev_tag.label_id,
                                'label_desc': hist.prev_tag.label_desc
                            } if hist.prev_tag else None,
                            'new_tag': {
                                'label_id': hist.new_tag.label_id,
                                'label_desc': hist.new_tag.label_desc
                            } if hist.new_tag else None,
                            'comment': hist.comment,
                            'created_at': hist.created_at
                        }
                        for hist in validation.history.all().order_by('-created_at')
                    ]
                }
                for validation in validated_samples
            ]
        }
        logger.info(f'Returning response with {len(response_data["samples"])} samples')
        return Response(response_data)

    @action(detail=True, methods=['patch'])
    def validate(self, request, pk=None):
        """Validate an ECG sample."""
        validation = self.get_object()
        prev_tag = request.data.get('prev_tag_id')
        new_tag = request.data.get('new_tag_id')
        comment = request.data.get('comment', '')
        if not prev_tag or not new_tag:
            logger.error(f'Invalid validation request: prev_tag={prev_tag}, new_tag={new_tag}')
            return Response(
                {'error': 'prev_tag and new_tag fields are required got prev_tag={prev_tag}, new_tag={new_tag}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        validation.prev_tag_id = prev_tag
        validation.new_tag_id = new_tag
        validation.have_been_validated = True
        validation.save()

        # Create validation history entry
        ValidationHistory.objects.create(
            validation=validation,
            validated_by=request.user,
            sample=validation.sample,
            prev_tag_id=prev_tag,
            new_tag_id=new_tag,
            comment=comment
        )

        logger.info(f'Sample {validation.sample.sample_id} validated by {request.user.username}')
        return Response(self.get_serializer(validation).data) 