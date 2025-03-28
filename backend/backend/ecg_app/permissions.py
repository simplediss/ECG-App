from rest_framework import permissions

class IsTeacher(permissions.BasePermission):
    """
    Custom permission to only allow teachers to access the view.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role == 'teacher'

class IsStudent(permissions.BasePermission):
    """
    Custom permission to only allow students to access the view.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role == 'student'

class IsTeacherOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow teachers or admins to access the view.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_staff or  # Admin
            (hasattr(request.user, 'profile') and request.user.profile.role == 'teacher')
        )

class IsOwnerOrTeacherOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object, teachers, or admins to access it.
    """
    def has_object_permission(self, request, view, obj):
        # Admin can do anything
        if request.user.is_staff:
            return True
        
        # Teachers can access anything
        if hasattr(request.user, 'profile') and request.user.profile.role == 'teacher':
            return True
        
        # Students can only access their own objects
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False

class IsGroupTeacher(permissions.BasePermission):
    """
    Custom permission to only allow teachers of a group to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Check if the user is a teacher and owns the group
        return request.user.is_authenticated and obj.teacher == request.user

class IsGroupMember(permissions.BasePermission):
    """
    Custom permission to only allow members of a group to view it.
    """
    def has_object_permission(self, request, view, obj):
        # Check if the user is a member of the group
        return request.user.is_authenticated and obj.memberships.filter(
            student=request.user,
            status='approved'
        ).exists()

class CanManageGroupMembers(permissions.BasePermission):
    """
    Custom permission to only allow teachers to manage group members.
    """
    def has_object_permission(self, request, view, obj):
        # Check if the user is the teacher of the group
        return request.user.is_authenticated and obj.group.teacher == request.user 