 let currentStep = 1;
let userEmail = '';
let resetToken = '';

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

function showSuccess(elementId, message) {
    const successElement = document.getElementById(elementId);
    successElement.textContent = message;
    successElement.style.display = 'block';
    setTimeout(() => {
        successElement.style.display = 'none';
    }, 5000);
}

function showStep(step) {
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');
    
    document.querySelectorAll('.progress-step').forEach(el => {
        const stepNum = parseInt(el.dataset.step);
        el.classList.remove('active', 'completed');
        if (stepNum === step) {
            el.classList.add('active');
        } else if (stepNum < step) {
            el.classList.add('completed');
        }
    });
    
    currentStep = step;
}

function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const requirements = {
        length: password.length >= minLength,
        upper: hasUpperCase,
        lower: hasLowerCase,
        number: hasNumbers,
        special: hasSpecialChar
    };

    const valid = Object.values(requirements).every(req => req);
    return { valid, requirements };
}

// Step 1: Request OTP
document.getElementById('emailForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    userEmail = email;

    try {
        const response = await axios.post('https://sop-rw-bn.amalitech-dev.net/users/api/v1/auth/password-reset/request-otp', {
            email: email
        });

        if (response.data && response.data.status === 200) {
            showSuccess('emailSuccess', 'Verification code sent to your email');
            setTimeout(() => showStep(2), 1500);
        } else {
            throw new Error(response.data?.message || 'Failed to send verification code');
        }
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to send verification code';
        showError('emailError', errorMessage);
    }
});

// Step 2: Verify OTP and get reset token
document.getElementById('verificationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const otp = document.getElementById('otp').value;

    try {
        const response = await axios.post('https://sop-rw-bn.amalitech-dev.net/users/api/v1/auth/password-reset/verify-otp', {
            email: userEmail,
            otp: otp
        });

        if (response.data && response.data.status === 200) {
            resetToken = response.data.data.token;  // Store the reset token
            showSuccess('verificationSuccess', 'OTP verified successfully. Please set your new password.');
            setTimeout(() => showStep(3), 1500);
        } else {
            throw new Error(response.data?.message || 'Verification failed');
        }
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Invalid or expired verification code';
        showError('verificationError', errorMessage);
    }
});

// Step 3: Reset Password
document.getElementById('passwordChangeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        showError('passwordChangeError', 'Passwords do not match');
        return;
    }

    const { valid, requirements } = validatePassword(newPassword);
    if (!valid) {
        let errorMessage = 'Password must have:';
        if (!requirements.length) errorMessage += '\n- At least 8 characters';
        if (!requirements.upper) errorMessage += '\n- At least one uppercase letter';
        if (!requirements.lower) errorMessage += '\n- At least one lowercase letter';
        if (!requirements.number) errorMessage += '\n- At least one number';
        if (!requirements.special) errorMessage += '\n- At least one special character';
        
        showError('passwordChangeError', errorMessage);
        return;
    }

    try {
        const response = await axios.post('https://sop-rw-bn.amalitech-dev.net/users/api/v1/auth/password-reset', 
            {
                newPassword: newPassword,
                confirmPassword: confirmPassword
            },
            {
                headers: {
                    'Authorization': `Bearer ${resetToken}`
                }
            }
        );

        if (response.data && response.data.status === 200) {
            showSuccess('passwordChangeSuccess', 'Password reset successfully! Redirecting to login...');
            setTimeout(() => {
                window.location.href = 'https://develop.d3ooqalrubre2v.amplifyapp.com/login';
            }, 2000);
        } else {
            throw new Error(response.data?.message || 'Failed to reset password');
        }
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to reset password. Please try again.';
        showError('passwordChangeError', errorMessage);
    }
});