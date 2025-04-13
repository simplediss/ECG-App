from django.db.models import Q
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response


from ..models import Group, GroupMembership
from ..serializers import (
    GroupSerializer, GroupDetailSerializer, GroupMembershipSerializer, GroupMembershipRequestSerializer
)
from ..permissions import CanManageGroupMembers


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return GroupDetailSerializer
        return GroupSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Group.objects.all()
        elif hasattr(user, 'profile') and user.profile.role == 'student':
            # Students can see all groups
            return Group.objects.all()
        else:
            # Teachers see their own groups and groups they're members of
            return Group.objects.filter(
                Q(teacher=user) |  # Groups owned by the user
                Q(memberships__student=user, memberships__status='approved')  # Groups where user is a member
            ).distinct()

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['join_request']:
            # Allow any authenticated user to request to join
            return [permissions.IsAuthenticated()]
        elif self.action in ['approve_request', 'reject_request', 'remove_user']:
            # Only group teachers can manage members
            return [permissions.IsAuthenticated(), CanManageGroupMembers()]
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def join_request(self, request, pk=None):
        group = self.get_object()
        user = request.user

        # Check if user already has a pending request or is already a member
        existing_membership = GroupMembership.objects.filter(
            group=group,
            student=user
        ).first()

        if existing_membership:
            if existing_membership.status == 'approved':
                return Response(
                    {'error': 'You are already a member of this group'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif existing_membership.status == 'pending':
                return Response(
                    {'error': 'You already have a pending request for this group'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Create a new membership request
        GroupMembership.objects.create(
            group=group,
            student=user,
            status='pending'
        )

        return Response({'message': 'Join request sent successfully'})

    @action(detail=True, methods=['post'])
    def approve_request(self, request, pk=None):
        group = self.get_object()
        request_id = request.data.get('request_id')

        if not request_id:
            return Response(
                {'error': 'request_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Convert request_id to integer if it's a string
        try:
            request_id = int(request_id)
        except (TypeError, ValueError) as e:
            return Response(
                {'error': f'Invalid request_id format: {e}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if the current user is the group teacher
        if request.user != group.teacher and not request.user.is_staff:
            return Response(
                {'error': 'Only the group teacher can approve requests'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            # First try to find the membership without any filters to see if it exists at all
            try:
                membership = GroupMembership.objects.get(id=request_id)
            except GroupMembership.DoesNotExist:
                return Response(
                    {'error': 'Membership request not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Now check if it matches our criteria
            if membership.group.id != group.id:
                return Response(
                    {'error': 'Membership request does not belong to this group'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if membership.status != 'pending':
                print(f"[DEBUG] Invalid membership status: {membership.status}")
                return Response(
                    {'error': f'Membership request is not pending (current status: {membership.status})'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            membership.status = 'approved'
            membership.save()
            print(f"[DEBUG] Successfully approved membership")
            return Response({'message': 'Request approved successfully'})

        except Exception as e:
            print(f"[DEBUG] Error approving request: {str(e)}")
            return Response(
                {'error': f'Error approving request: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def reject_request(self, request, pk=None):
        group = self.get_object()
        request_id = request.data.get('request_id')

        if not request_id:
            return Response(
                {'error': 'request_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if the current user is the group teacher
        if request.user != group.teacher and not request.user.is_staff:
            return Response(
                {'error': 'Only the group teacher can reject requests'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            membership = GroupMembership.objects.get(
                id=request_id,
                group=group,
                status='pending'
            )
            membership.delete()
            return Response({'message': 'Request rejected successfully'})
        except GroupMembership.DoesNotExist:
            return Response(
                {'error': 'Membership request not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def remove_user(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get('user_id')

        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if the current user is the group teacher
        if request.user != group.teacher and not request.user.is_staff:
            return Response(
                {'error': 'Only the group teacher can remove users'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            membership = GroupMembership.objects.get(
                group=group,
                student_id=user_id,
                status='approved'
            )
            membership.delete()
            return Response({'message': 'User removed successfully'})
        except GroupMembership.DoesNotExist:
            return Response(
                {'error': 'Group membership not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def my_groups(self, request):
        user = request.user
        if user.is_staff:
            groups = Group.objects.all()
        elif hasattr(user, 'profile') and user.profile.role == 'teacher':
            # For teachers, return groups they own
            groups = Group.objects.filter(teacher=user)
        else:
            # For students, return groups they are approved members of
            groups = Group.objects.filter(
                memberships__student=user,
                memberships__status='approved'
            )
        
        # Optimize the query by prefetching related data
        groups = groups.prefetch_related(
            'memberships',
            'memberships__student'
        ).select_related('teacher')
        
        serializer = self.get_serializer(groups, many=True)
        return Response(serializer.data)


class GroupMembershipViewSet(viewsets.ModelViewSet):
    queryset = GroupMembership.objects.all()
    serializer_class = GroupMembershipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return GroupMembership.objects.all()
        return GroupMembership.objects.filter(
            Q(group__teacher=user) |  # Memberships in groups owned by the user
            Q(student=user)  # User's own memberships
        ).distinct()

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [permissions.IsAuthenticated(), CanManageGroupMembers()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


class GroupMembershipRequestViewSet(viewsets.ModelViewSet):
    queryset = GroupMembership.objects.filter(status='pending')
    serializer_class = GroupMembershipRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return GroupMembership.objects.filter(status='pending')
        return GroupMembership.objects.filter(
            Q(group__teacher=user) |  # Pending requests for groups owned by the user
            Q(student=user)  # User's own pending requests
        ).filter(status='pending').distinct()

    def get_permissions(self):
        if self.action in ['update', 'partial_update']:
            return [permissions.IsAuthenticated(), CanManageGroupMembers()]
        return [permissions.IsAuthenticated()]
    