from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import EcgSampleValidation, EcgSamples, EcgDocLabels, EcgSamplesDocLabels
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
        if user.is_staff:
            return EcgSampleValidation.objects.all()
        return EcgSampleValidation.objects.filter(teacher=user)

    @action(detail=False, methods=['get'])
    def all_labels(self, request):
        """Get all possible label ids and descriptions."""
        try:
            labels = list(EcgDocLabels.objects.values('label_id', 'label_desc'))
            return Response({'labels': labels})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def perform_create(self, serializer):
        # This line actually writes the new EcgSampleValidation(record):
        new_validation = serializer.save(teacher=self.request.user)

        # If the teacher marked is_valid=False, we must update the join table:
        if not new_validation.is_valid and new_validation.new_tag:
            sample_obj = new_validation.sample  # The EcgSamples instance
            new_label  = new_validation.new_tag # The EcgDocLabels instance

            EcgSamplesDocLabels.objects.update_or_create(
                sample_id=sample_obj,
                defaults={'label_id': new_label}
            )


    def perform_update(self, serializer):
        updated_validation = serializer.save()

        # Again, if is_valid==False, swap the join table’s label to new_tag
        if not updated_validation.is_valid and updated_validation.new_tag:
            sample_obj = updated_validation.sample
            new_label  = updated_validation.new_tag

            EcgSamplesDocLabels.objects.update_or_create(
                sample_id=sample_obj,
                defaults={'label_id': new_label}
            )
                

    @action(detail=False, methods=['get'])
    def pending_samples(self, request):
        """Get all ECG samples that haven't been validated by any teacher."""
        # Debug: Log total number of samples
        total_samples = EcgSamples.objects.count()
        logger.info(f"Total samples in database: {total_samples}")

        # Get all samples that have been validated by any teacher
        validated_samples = EcgSampleValidation.objects.values_list('sample_id', flat=True).distinct()
        logger.info(f"Number of validated samples: {validated_samples.count()}")
        
        # Get all samples that haven't been validated
        pending_samples = EcgSamples.objects.exclude(sample_id__in=validated_samples)
        logger.info(f"Number of pending samples: {pending_samples.count()}")
        
        # Debug: Log a few sample IDs to verify
        if pending_samples.exists():
            sample_ids = list(pending_samples.values_list('sample_id', flat=True)[:5])
            logger.info(f"First 5 pending sample IDs: {sample_ids}")
        
        response_data = {
            'count': pending_samples.count(),
            'samples': [
                {
                    'id': sample.sample_id, 
                    'path': sample.sample_path, 
                    'label_id': sample.doc_labels.first().label_id.label_id,
                    'label_desc': sample.doc_labels.first().label_id.label_desc
                } 
                for sample in pending_samples
            ]
        }
        logger.info(f"Response data: {response_data}")
        
        return Response(response_data)
    
    @action(detail=False, methods=['get'])
    def validated_samples(self, request):
        """Get all ECG samples that have been validated by any teacher."""
        # validated_samples = EcgSampleValidation.objects.all()
        user = self.request.user
        if not (user.is_staff or (hasattr(user, 'profile') and user.profile.role == 'teacher')):
            return Response({'error': 'You are not authorized to view this page'}, status=status.HTTP_403_FORBIDDEN)
        validated_samples = EcgSampleValidation.objects.all().order_by('-validated_at')
        response_data = {
            'count': validated_samples.count(),
            'samples': [
                    {
                        'validation_id': validation.id,
                        'sample_id': validation.sample.sample_id,
                        'sample_path': validation.sample.sample_path,
                        'curr_label': {
                            'label_id': validation.curr_tag.label_id,
                            'label_desc': validation.curr_tag.label_desc,
                        },
                        'new_label': {
                            'label_id': validation.new_tag.label_id,
                            'label_desc': validation.new_tag.label_desc,
                        } 
                        if validation.new_tag else validation.curr_tag,
                        'comments': validation.comments,
                        'teacher': {
                            'teacher_id': validation.teacher.id,
                            'first_name': validation.teacher.first_name,
                            'last_name': validation.teacher.last_name,
                            'email': validation.teacher.email,
                            'username': validation.teacher.username,
                        },
                        'is_valid': validation.is_valid,
                        'is_validated': True,
                        'validated_at': validation.validated_at,
                        'history': [
                            {
                                'changed_at': hist.history_date,
                                'changed_by': hist.history_user.username if hist.history_user else None,
                                'is_valid': hist.is_valid,
                                'comments': hist.comments,
                                'curr_tag_id': hist.curr_tag_id,
                                'new_tag_id': hist.new_tag_id,
                                'curr_tag_desc': hist.curr_tag.label_desc if hist.curr_tag else None,
                                'new_tag_desc': hist.new_tag.label_desc if hist.new_tag else None,
                            }
                            for hist in validation.history.all().order_by('-history_date')
                        ]
                    }
                    for validation in validated_samples
                ]
            }
        return Response(response_data)
        
        

    @action(detail=True, methods=['get'])
    def validate(self, request, pk=None):
        """Validate or invalidate an ECG sample."""
        validation = self.get_object()
        is_valid = request.data.get('is_valid')
        new_tag = request.data.get('new_tag')
        comments = request.data.get('comments', '')

        if is_valid is None:
            return Response(
                {'error': 'is_valid field is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_tag is None:
            return Response(
                {'error': 'new_tag field is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        validation.is_valid = is_valid
        validation.comments = comments
        validation.new_tag = new_tag
        validation.save()

        return Response(self.get_serializer(validation).data) 