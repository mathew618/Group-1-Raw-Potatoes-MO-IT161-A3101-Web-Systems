/* Sign in and sign up (data/accounts.json) */
async function checkLogin() {
    const identifier = document.getElementById('email').value.trim();
    const password = document.getElementById('UserPassword').value;
    const account = await Account.find(identifier, password);

    if (account) {
        Account.setCurrent(account);
        window.location.href = 'home.html';
    } else {
        document.getElementById('Invalid_Credentials').textContent = 'Incorrect Credentials';
    }
}

async function createAccount() {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const error = document.getElementById('SignupError');

    if (!username || !email || !password) {
        error.textContent = 'Please fill in all fields.';
        return;
    }

    if (!email.includes('@')) {
        error.textContent = 'Please enter a valid email.';
        return;
    }

    if (password !== confirmPassword) {
        error.textContent = "Passwords don't match.";
        return;
    }

    const conflict = await Account.conflict(username, email);
    if (conflict) {
        error.textContent = conflict;
        return;
    }

    error.textContent = '';
    await new Artist(username, email, password).save();
    window.location.href = 'home.html';
}

/* Setup show password for sign in and sign up */
function setupShowPassword() {
    const checkbox = document.getElementById('ShowPassword');
    if (!checkbox) return;

    const inputs = ['UserPassword', 'password', 'confirm_password']
        .map(id => document.getElementById(id))
        .filter(Boolean);

    checkbox.addEventListener('change', function () {
        const type = this.checked ? 'text' : 'password';
        inputs.forEach(input => input.type = type);
    });
}

setupShowPassword();
