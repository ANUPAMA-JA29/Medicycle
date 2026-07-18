/**
 * ==========================================================================
 * MEDICYCLE AI — MAIN JAVASCRIPT APP FILE
 * Description: Client-side state, form validations, navigation router, 
 *              and decoupled event submission handlers.
 * ==========================================================================
 */

// 1. GLOBAL STATE & SESSION INITIALIZATION
const DEFAULT_MOCK_USER = {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "9876543210",
    address: "123 Green Valley Road, Sector 4, Health City",
    password: "Password123"
};

let state = {
    users: [DEFAULT_MOCK_USER], // Mock user database
    currentUser: null,           // Currently authenticated user session
    isLoggedIn: false
};

// Persistence Loader: Attempt to read past registration/login session from localStorage
function loadPersistedState() {
    try {
        const localData = localStorage.getItem("medicycle_state");
        if (localData) {
            const parsed = JSON.parse(localData);
            state = { ...state, ...parsed };
        }
    } catch (e) {
        console.warn("Storage reading failed, using transient memory state instead.", e);
    }

    // Safety checks: ensure state.users is a valid array and contains the default mock user
    if (!state.users || !Array.isArray(state.users) || state.users.length === 0) {
        state.users = [DEFAULT_MOCK_USER];
    } else {
        const hasMockUser = state.users.some(u => u.email.toLowerCase() === DEFAULT_MOCK_USER.email.toLowerCase());
        if (!hasMockUser) {
            state.users.push(DEFAULT_MOCK_USER);
        }
    }
    saveStateToStorage();
}

function saveStateToStorage() {
    try {
        localStorage.setItem("medicycle_state", JSON.stringify({
            users: state.users,
            currentUser: state.currentUser,
            isLoggedIn: state.isLoggedIn
        }));
    } catch (e) {
        console.error("Failed to write to local storage.", e);
    }
}

// 2. DOCUMENT READY & EVENT LISTENERS SETUP
document.addEventListener("DOMContentLoaded", () => {
    // Load persisted account data or set defaults
    loadPersistedState();

    // Set up global navigation listeners
    setupNavigationListeners();

    // Set up form submission logic
    setupFormListeners();

    // Set up real-time input validation triggers
    setupRealTimeValidation();

    // Route to appropriate view depending on authentication state
    if (state.isLoggedIn && state.currentUser) {
        showView("profile-view");
    } else {
        showView("landing-view");
    }
});

// 3. SPA ROUTING & NAVIGATION
function showView(viewId) {
    // Hide all views
    document.querySelectorAll(".view").forEach(view => {
        view.classList.remove("active");
    });

    // Show selected view
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add("active");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Refresh dynamic UI elements
    updateNavigationUI();
    
    if (viewId === "profile-view") {
        renderProfileInfo();
        resetProfileRightPanel();
    }
}

function updateNavigationUI() {
    const guestNav = document.getElementById("guest-nav");
    const authNav = document.getElementById("auth-nav");
    const navUsername = document.getElementById("nav-username");

    if (state.isLoggedIn && state.currentUser) {
        guestNav.classList.add("hidden");
        authNav.classList.remove("hidden");
        navUsername.textContent = state.currentUser.name;
    } else {
        guestNav.classList.remove("hidden");
        authNav.classList.add("hidden");
    }
}

function setupNavigationListeners() {
    // Logo Click returns to landing (or profile if logged in)
    document.getElementById("logo-btn").addEventListener("click", () => {
        if (state.isLoggedIn) {
            showView("profile-view");
        } else {
            showView("landing-view");
        }
    });

    // Guest Nav Buttons
    document.getElementById("nav-login-btn").addEventListener("click", () => showView("login-view"));
    document.getElementById("nav-register-btn").addEventListener("click", () => showView("register-view"));

    // Hero Action Buttons (Landing page CTA)
    document.getElementById("hero-login-btn").addEventListener("click", () => showView("login-view"));
    document.getElementById("hero-register-btn").addEventListener("click", () => showView("register-view"));

    // Form Footer Links
    document.getElementById("to-login-link").addEventListener("click", (e) => {
        e.preventDefault();
        showView("login-view");
    });
    document.getElementById("to-register-link").addEventListener("click", (e) => {
        e.preventDefault();
        showView("register-view");
    });

    // Forgot Password dummy trigger
    document.getElementById("forgot-password-btn").addEventListener("click", (e) => {
        e.preventDefault();
        showToast("Password reset link sent to your registered email address (mock action)!", "info");
    });

    // Auth Nav Profile link
    document.getElementById("nav-profile-btn").addEventListener("click", () => showView("profile-view"));

    // Logout actions
    document.getElementById("nav-logout-btn").addEventListener("click", handleLogout);
    document.getElementById("profile-logout-btn").addEventListener("click", handleLogout);

    // Profile Right Panel sub-navigation triggers
    const editBtn = document.getElementById("profile-edit-btn");
    const passBtn = document.getElementById("profile-password-btn");

    editBtn.addEventListener("click", () => {
        setActiveActionBtn(editBtn);
        showProfileSubState("profile-edit-state");
        populateEditForm();
    });

    passBtn.addEventListener("click", () => {
        setActiveActionBtn(passBtn);
        showProfileSubState("profile-password-state");
    });

    // Profile Action Cancel buttons
    document.getElementById("edit-cancel-btn").addEventListener("click", resetProfileRightPanel);
    document.getElementById("pwd-cancel-btn").addEventListener("click", resetProfileRightPanel);
}

function setActiveActionBtn(activeBtn) {
    document.getElementById("profile-edit-btn").classList.remove("active-action");
    document.getElementById("profile-password-btn").classList.remove("active-action");
    if (activeBtn) {
        activeBtn.classList.add("active-action");
    }
}

function showProfileSubState(stateId) {
    document.querySelectorAll(".state-panel").forEach(panel => {
        panel.classList.remove("active");
    });
    document.getElementById(stateId).classList.add("active");
}

function resetProfileRightPanel() {
    setActiveActionBtn(null);
    showProfileSubState("profile-placeholder-state");
    
    // Clear sub forms
    document.getElementById("edit-profile-form").reset();
    document.getElementById("change-password-form").reset();
    
    // Clear validation errors in these forms
    clearFormErrors(document.getElementById("edit-profile-form"));
    clearFormErrors(document.getElementById("change-password-form"));
}

function renderProfileInfo() {
    if (!state.currentUser) return;
    
    const user = state.currentUser;
    document.getElementById("profile-display-name").textContent = user.name;
    document.getElementById("profile-display-email").textContent = user.email;
    document.getElementById("profile-display-phone").textContent = formatPhone(user.phone);
    document.getElementById("profile-display-address").textContent = user.address;

    // Calculate initials for Avatar
    const names = user.name.trim().split(" ");
    let initials = "";
    if (names.length > 0) initials += names[0].charAt(0).toUpperCase();
    if (names.length > 1) initials += names[names.length - 1].charAt(0).toUpperCase();
    document.getElementById("profile-initials").textContent = initials || "U";
}

function populateEditForm() {
    if (!state.currentUser) return;
    document.getElementById("edit-name").value = state.currentUser.name;
    document.getElementById("edit-email").value = state.currentUser.email;
    document.getElementById("edit-phone").value = state.currentUser.phone;
    document.getElementById("edit-address").value = state.currentUser.address;
}

// 4. FORM REGEX & VALIDATION HELPERS
const REGEX_PATTERNS = {
    lettersOnly: /^[A-Za-z\s]+$/,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    phone: /^\d{10}$/,
    passwordNumber: /[0-9]/
};

function validateField(input, value) {
    const id = input.id;
    
    // Name validation
    if (id === "reg-name" || id === "edit-name") {
        if (!value.trim()) return "Full Name is required.";
        if (!REGEX_PATTERNS.lettersOnly.test(value)) return "Full name must contain letters only.";
    }

    // Email validation
    if (id === "reg-email" || id === "login-email" || id === "edit-email") {
        if (!value.trim()) return "Email address is required.";
        if (!REGEX_PATTERNS.email.test(value)) return "Please enter a valid email address.";
    }

    // Phone validation
    if (id === "reg-phone" || id === "edit-phone") {
        if (!value.trim()) return "Phone number is required.";
        if (!REGEX_PATTERNS.phone.test(value)) return "Phone number must be exactly 10 digits.";
    }

    // Address validation
    if (id === "reg-address" || id === "edit-address") {
        if (!value.trim()) return "Residential address is required.";
    }

    // Password validation (Register)
    if (id === "reg-password") {
        if (!value) return "Password is required.";
        if (value.length < 8) return "Password must be at least 8 characters long.";
        if (!REGEX_PATTERNS.passwordNumber.test(value)) return "Password must contain at least 1 number.";
    }

    // Confirm password validation (Register)
    if (id === "reg-confirm-password") {
        const pwdInput = document.getElementById("reg-password");
        if (!value) return "Please confirm your password.";
        if (value !== pwdInput.value) return "Passwords do not match.";
    }

    // Login password validation
    if (id === "login-password") {
        if (!value) return "Password is required.";
    }

    // Old password validation (Profile Change)
    if (id === "pwd-old") {
        if (!value) return "Old password is required.";
        if (value !== state.currentUser.password) return "Incorrect old password.";
    }

    // New password validation (Profile Change)
    if (id === "pwd-new") {
        if (!value) return "New password is required.";
        if (value.length < 8) return "New password must be at least 8 characters long.";
        if (!REGEX_PATTERNS.passwordNumber.test(value)) return "New password must contain at least 1 number.";
        if (value === document.getElementById("pwd-old").value) return "New password must be different from old password.";
    }

    // Confirm new password validation (Profile Change)
    if (id === "pwd-confirm") {
        const newPwdVal = document.getElementById("pwd-new").value;
        if (!value) return "Please confirm your new password.";
        if (value !== newPwdVal) return "New passwords do not match.";
    }

    return ""; // Field is valid
}

function handleFieldValidation(input) {
    const errorSpan = document.getElementById(`${input.id}-error`);
    if (!errorSpan) return true;

    const errorMsg = validateField(input, input.value);
    const formGroup = input.closest(".form-group-field");

    if (errorMsg) {
        formGroup.classList.add("invalid");
        errorSpan.textContent = errorMsg;
        return false;
    } else {
        formGroup.classList.remove("invalid");
        errorSpan.textContent = "";
        return true;
    }
}

function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll("input");
    inputs.forEach(input => {
        const isFieldValid = handleFieldValidation(input);
        if (!isFieldValid) isValid = false;
    });
    return isValid;
}

function clearFormErrors(form) {
    form.querySelectorAll(".form-group-field").forEach(group => {
        group.classList.remove("invalid");
    });
    form.querySelectorAll(".error-msg").forEach(span => {
        span.textContent = "";
    });
}

function setupRealTimeValidation() {
    // Dynamic inline validation on typing or focus loss
    const inputs = document.querySelectorAll("input");
    inputs.forEach(input => {
        input.addEventListener("blur", () => handleFieldValidation(input));
        input.addEventListener("input", () => {
            // Only remove errors dynamically as the user corrects their input
            const formGroup = input.closest(".form-group-field");
            if (formGroup.classList.contains("invalid")) {
                handleFieldValidation(input);
            }
        });
    });
}

// 5. DECOUPLED EVENT HANDLERS (READY FOR API HOOKS)
function setupFormListeners() {
    // Registration Form
    document.getElementById("register-form").addEventListener("submit", handleRegister);

    // Login Form
    document.getElementById("login-form").addEventListener("submit", handleLogin);

    // Edit Profile Form
    document.getElementById("edit-profile-form").addEventListener("submit", handleEditProfile);

    // Change Password Form
    document.getElementById("change-password-form").addEventListener("submit", handleChangePassword);
}

/**
 * Handles account creation. Registers a mock user session.
 * @param {Event} event - Submit event object
 */
function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    
    if (!validateForm(form)) {
        showToast("Please correct the errors in the registration form.", "error");
        return;
    }

    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const phone = document.getElementById("reg-phone").value.trim();
    const address = document.getElementById("reg-address").value.trim();
    const password = document.getElementById("reg-password").value;

    // Check if account already exists
    const userExists = state.users.some(u => u.email === email);
    if (userExists) {
        const emailInput = document.getElementById("reg-email");
        const formGroup = emailInput.closest(".form-group-field");
        formGroup.classList.add("invalid");
        document.getElementById("reg-email-error").textContent = "This email is already registered.";
        showToast("Registration failed: Email address is already in use.", "error");
        return;
    }

    // Assemble mock user object
    const newUser = { name, email, phone, address, password };

    // Register User to database state
    state.users.push(newUser);
    state.currentUser = newUser;
    state.isLoggedIn = true;
    
    // Save to storage & sync UI
    saveStateToStorage();
    form.reset();
    clearFormErrors(form);

    showToast(`Account created successfully! Welcome to MediCycle AI, ${name}.`, "success");
    showView("profile-view");
}

/**
 * Handles system authentication. Validates credentials against mock state.
 * @param {Event} event - Submit event object
 */
function handleLogin(event) {
    event.preventDefault();
    const form = event.target;

    if (!validateForm(form)) {
        showToast("Please input valid email and password formats.", "error");
        return;
    }

    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value;

    // Search email in mock database
    const matchingUser = state.users.find(u => u.email === email);
    
    if (!matchingUser || matchingUser.password !== password) {
        // Mock error response
        const pwdInput = document.getElementById("login-password");
        const formGroup = pwdInput.closest(".form-group-field");
        formGroup.classList.add("invalid");
        document.getElementById("login-password-error").textContent = "Invalid email address or incorrect password.";
        showToast("Login failed. Check credentials.", "error");
        return;
    }

    // Establish active session
    state.currentUser = matchingUser;
    state.isLoggedIn = true;
    
    saveStateToStorage();
    form.reset();
    clearFormErrors(form);

    showToast(`Signed in successfully! Welcome back, ${matchingUser.name}.`, "success");
    showView("profile-view");
}

/**
 * Handles profile detail updates. Validates and saves values.
 * @param {Event} event - Submit event object
 */
function handleEditProfile(event) {
    event.preventDefault();
    const form = event.target;

    if (!validateForm(form)) {
        showToast("Failed to save: please check form errors.", "error");
        return;
    }

    const name = document.getElementById("edit-name").value.trim();
    const email = document.getElementById("edit-email").value.trim().toLowerCase();
    const phone = document.getElementById("edit-phone").value.trim();
    const address = document.getElementById("edit-address").value.trim();

    // Check if new email conflicts with another user
    const hasConflict = state.users.some(u => u.email === email && u.email !== state.currentUser.email);
    if (hasConflict) {
        const emailInput = document.getElementById("edit-email");
        const formGroup = emailInput.closest(".form-group-field");
        formGroup.classList.add("invalid");
        document.getElementById("edit-email-error").textContent = "This email is registered to another account.";
        showToast("Failed to update profile. Email in use.", "error");
        return;
    }

    // Capture old email for syncing users list
    const oldEmail = state.currentUser.email;

    // Update session user
    state.currentUser.name = name;
    state.currentUser.email = email;
    state.currentUser.phone = phone;
    state.currentUser.address = address;

    // Sync changes to main database array
    const userIndex = state.users.findIndex(u => u.email === oldEmail);
    if (userIndex !== -1) {
        state.users[userIndex] = { ...state.users[userIndex], name, email, phone, address };
    }

    saveStateToStorage();
    renderProfileInfo();
    resetProfileRightPanel();
    showToast("Profile details updated successfully!", "success");
}

/**
 * Handles password replacement updates.
 * @param {Event} event - Submit event object
 */
function handleChangePassword(event) {
    event.preventDefault();
    const form = event.target;

    if (!validateForm(form)) {
        showToast("Password update failed. Correct form fields.", "error");
        return;
    }

    const newPassword = document.getElementById("pwd-new").value;

    // Update password fields
    state.currentUser.password = newPassword;
    
    // Sync to user DB array
    const userIndex = state.users.findIndex(u => u.email === state.currentUser.email);
    if (userIndex !== -1) {
        state.users[userIndex].password = newPassword;
    }

    saveStateToStorage();
    resetProfileRightPanel();
    showToast("Password updated successfully! Keep it secure.", "success");
}

/**
 * Resets user session state and routes back to Landing page.
 */
function handleLogout() {
    state.currentUser = null;
    state.isLoggedIn = false;
    
    saveStateToStorage();
    showToast("You have logged out successfully.", "success");
    showView("landing-view");
}

// 6. GENERAL UTILITY FUNCTIONS
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toast-message");
    const toastIcon = toast.querySelector(".toast-icon");
    
    toastMsg.textContent = message;

    // Adjust theme based on type
    if (type === "success") {
        toastIcon.className = "toast-icon icon-success";
        // SVG checkmark path
        toastIcon.innerHTML = `<circle cx="12" cy="12" r="10"></circle><polyline points="9 11 11 13 15 9"></polyline>`;
    } else if (type === "error") {
        toastIcon.className = "toast-icon";
        toastIcon.style.color = "#d32f2f";
        // SVG alert octagon/circle path
        toastIcon.innerHTML = `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>`;
    } else if (type === "info") {
        toastIcon.className = "toast-icon";
        toastIcon.style.color = "#0288d1";
        // SVG info circle path
        toastIcon.innerHTML = `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>`;
    }

    // Toggle styling classes to trigger CSS entry animations
    toast.classList.remove("hidden");
    // Brief timeout to trigger the translate effect
    setTimeout(() => {
        toast.classList.add("visible");
    }, 50);

    // Auto-dismiss after 4.5 seconds
    setTimeout(() => {
        toast.classList.remove("visible");
        // Wait for slide-out transition to complete before setting display:none
        setTimeout(() => {
            toast.classList.add("hidden");
        }, 300);
    }, 4500);
}

// Formats number to read +1 234 567 8900 format, or returns clean string
function formatPhone(phoneStr) {
    if (!phoneStr || phoneStr.length !== 10) return phoneStr;
    return `(${phoneStr.substring(0, 3)}) ${phoneStr.substring(3, 6)}-${phoneStr.substring(6)}`;
}
