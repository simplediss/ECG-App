import re
from rest_framework import serializers
from .models import EcgSamples, EcgDocLabels, EcgSnomed, EcgSamplesDocLabels, EcgSamplesSnomed, EcgSampleValidation, ValidationHistory
from .models import Profile, Quiz, Question, Choice, QuizAttempt, QuestionAttempt, Group, GroupMembership
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password

    
class EcgSamplesSerializer(serializers.ModelSerializer):
    class Meta:
        model = EcgSamples
        fields = '__all__'


class EcgDocLabelsSerializer(serializers.ModelSerializer):
    class Meta:
        model = EcgDocLabels
        fields = '__all__'


class EcgSnomedSerializer(serializers.ModelSerializer):
    class Meta:
        model = EcgSnomed
        fields = '__all__'


class EcgSamplesDocLabelsSerializer(serializers.ModelSerializer):
    class Meta:
        model = EcgSamplesDocLabels
        fields = '__all__'


class EcgSamplesSnomedSerializer(serializers.ModelSerializer):
    class Meta:
        model = EcgSamplesSnomed
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    role = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = Profile
        fields = ['id', 'user', 'role', 'date_of_birth', 'gender']


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text', 'is_correct']


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)
    ecg_sample = EcgSamplesSerializer(read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'choices', 'ecg_sample']


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'created_at', 'questions']


class QuestionAttemptSerializer(serializers.ModelSerializer):
    question = QuestionSerializer(read_only=True)
    selected_choice = ChoiceSerializer(read_only=True)
    
    class Meta:
        model = QuestionAttempt
        fields = ['id', 'question', 'selected_choice', 'is_correct']


class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz = QuizSerializer()  # Nested serializer for quiz details
    user = UserSerializer()  # Add user serializer
    question_attempts = QuestionAttemptSerializer(many=True, read_only=True)
    score = serializers.SerializerMethodField()
    correct_answers = serializers.SerializerMethodField()
    total_questions = serializers.SerializerMethodField()
    groups = serializers.SerializerMethodField()

    class Meta:
        model = QuizAttempt
        fields = ['id', 'quiz', 'user', 'started_at', 'completed_at', 'score', 'correct_answers', 'total_questions', 'question_attempts', 'groups']

    def get_score(self, obj):
        question_attempts = obj.question_attempts.all()
        total = question_attempts.count()
        if total == 0:
            return 0
        correct = question_attempts.filter(is_correct=True).count()
        return (correct / total) * 100

    def get_correct_answers(self, obj):
        return obj.question_attempts.filter(is_correct=True).count()

    def get_total_questions(self, obj):
        return obj.question_attempts.count()

    def get_groups(self, obj):
        # Get all approved group memberships for the user
        memberships = obj.user.group_memberships.filter(status='approved').select_related('group')
        return [{
            'id': membership.group.id,
            'name': membership.group.name,
            'teacher_id': membership.group.teacher_id
        } for membership in memberships]


class LoginSerializer(serializers.Serializer):
    login_identifier = serializers.CharField(help_text="Username or Email")
    password = serializers.CharField(write_only=True)


class RegistrationSerializer(serializers.Serializer):
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        error_messages={
            'required': 'Password is required.',
            'min_length': 'Password must be at least 8 characters long.',
        }
    )
    email = serializers.EmailField(
        error_messages={
            'required': 'Email is required.',
            'invalid': 'Please enter a valid email address.',
        }
    )
    first_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        error_messages={
            'max_length': 'First name cannot exceed 150 characters.',
        }
    )
    last_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        error_messages={
            'max_length': 'Last name cannot exceed 150 characters.',
        }
    )
    role = serializers.ChoiceField(
        choices=['student', 'teacher'],
        default='student',
        required=False,
        error_messages={
            'invalid_choice': 'Role must be either "student" or "teacher".',
        }
    )
    date_of_birth = serializers.DateField(
        required=False,
        allow_null=True,
        error_messages={
            'invalid': 'Please enter a valid date.',
        }
    )
    gender = serializers.ChoiceField(
        choices=['Male', 'Female', 'Other'],
        required=False,
        allow_blank=True,
        error_messages={
            'invalid_choice': 'Please select a valid gender option.',
        }
    )

    def validate(self, data):
        # Check if email already exists
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({
                'email': 'This email is already registered.'
            })
        
        return data

    def create(self, validated_data):
        try:
            # Generate username from email
            email = validated_data['email']
            base_username = email.split('@')[0]  # Get part before @
            username = base_username

            # Remove any characters that are not allowed in usernames
            username = re.sub(r'[^a-zA-Z0-9_]', '', username)
            
            # Ensure username starts with a letter or number
            if not username:
                username = 'user'
            elif not username[0].isalnum():
                username = 'u' + username
            
            # Ensure username is unique by appending numbers if needed
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            # Create User object
            user = User.objects.create_user(
                username=username,
                password=validated_data['password'],
                email=validated_data['email'],
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', '')
            )

            # Get role from validated data
            role = validated_data.get('role', 'student')
            
            # Create Profile object
            profile = Profile.objects.create(
                user=user,
                date_of_birth=validated_data.get('date_of_birth'),
                gender=validated_data.get('gender'),
                role=role
            )

            return user
        except Exception as e:
            raise serializers.ValidationError({
                'error': str(e)
            })


class GroupSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.username', read_only=True)
    member_count = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'teacher', 'teacher_name', 'created_at', 'member_count', 'members']
        read_only_fields = ['teacher', 'created_at']

    def get_member_count(self, obj):
        return obj.memberships.filter(status='approved').count()

    def get_members(self, obj):
        members = obj.memberships.filter(status='approved').select_related('student')
        return [{
            'id': membership.student.id,
            'username': membership.student.username,
            'first_name': membership.student.first_name,
            'last_name': membership.student.last_name,
            'email': membership.student.email
        } for membership in members]


class GroupDetailSerializer(GroupSerializer):
    members = serializers.SerializerMethodField()

    class Meta(GroupSerializer.Meta):
        fields = GroupSerializer.Meta.fields + ['members']

    def get_members(self, obj):
        request = self.context.get('request')
        if request and obj.teacher == request.user:
            # Teachers can see all members
            members = obj.memberships.filter(status='approved').select_related('student')
            return UserSerializer([membership.student for membership in members], many=True).data
        else:
            # Students can only see themselves
            return UserSerializer([request.user], many=True).data


class GroupMembershipSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    student_first_name = serializers.CharField(source='student.first_name', read_only=True)
    student_last_name = serializers.CharField(source='student.last_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = GroupMembership
        fields = [
            'id', 'group', 'group_name', 'student', 'student_name',
            'student_first_name', 'student_last_name', 'student_email',
            'status', 'joined_at'
        ]
        read_only_fields = ['joined_at']


class GroupMembershipRequestSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    student_first_name = serializers.CharField(source='student.first_name', read_only=True)
    student_last_name = serializers.CharField(source='student.last_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = GroupMembership
        fields = [
            'id', 'group', 'group_name', 'student', 'student_name',
            'student_first_name', 'student_last_name', 'student_email',
            'status'
        ]
        read_only_fields = ['status']


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(
        error_messages={
            'required': 'Email is required.',
            'invalid': 'Please enter a valid email address.',
        }
    )

    def validate(self, data):
        email = data.get('email')
        if not User.objects.filter(email=email).exists():
            raise serializers.ValidationError({
                'email': 'No user found with this email address.'
            })
        return data


class PasswordResetConfirmSerializer(serializers.Serializer):
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        error_messages={
            'required': 'Password is required.',
            'min_length': 'Password must be at least 8 characters long.',
        }
    )
    token = serializers.CharField(write_only=True)


class ValidationHistorySerializer(serializers.ModelSerializer):
    validated_by = UserSerializer(read_only=True)
    prev_tag = EcgDocLabelsSerializer(read_only=True)
    new_tag = EcgDocLabelsSerializer(read_only=True)

    class Meta:
        model = ValidationHistory
        fields = ['id', 'validated_by', 'prev_tag', 'new_tag', 'comment', 'created_at']
        read_only_fields = ['validated_by', 'created_at']


class EcgSampleValidationSerializer(serializers.ModelSerializer):
    sample = serializers.PrimaryKeyRelatedField(queryset=EcgSamples.objects.all())
    sample_path = serializers.CharField(source='sample.sample_path', read_only=True)
    prev_tag = EcgDocLabelsSerializer(read_only=True)
    new_tag = EcgDocLabelsSerializer(read_only=True)
    history = ValidationHistorySerializer(many=True, read_only=True)

    prev_tag_id = serializers.PrimaryKeyRelatedField(
        queryset=EcgDocLabels.objects.all(),
        source='prev_tag',
        required=False,
        allow_null=True,
        write_only=True
    )

    new_tag_id = serializers.PrimaryKeyRelatedField(
        queryset=EcgDocLabels.objects.all(),
        source='new_tag',
        required=False,
        allow_null=True,
        write_only=True
    )

    class Meta:
        model = EcgSampleValidation
        fields = [
            'id', 'sample', 'sample_path', 'have_been_validated',
            'prev_tag', 'new_tag', 'prev_tag_id', 'new_tag_id', 'history'
        ]
        read_only_fields = ['have_been_validated', 'history']

