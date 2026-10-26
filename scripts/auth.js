/* Sign in and sign up (data/accounts.json) */
Account.protectGuestPage();
setupShowPassword();

function fail(element, message) {
    element.textContent = message;
}

async function checkLogin() {
    const identifier = document.getElementById('email').value.trim();
    const password = document.getElementById('UserPassword').value;
    const error = document.getElementById('Invalid_Credentials');
    const account = await Account.find(identifier, password);

    if (!account) return fail(error, 'Incorrect Credentials');

    Account.setCurrent(account);
    window.location.href = Account.HOME;
}

async function createAccount() {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const error = document.getElementById('SignupError');

    if (!username || !email || !password) return fail(error, 'Please fill in all fields.');
    if (!email.includes('@')) return fail(error, 'Please enter a valid email.');
    if (password !== confirmPassword) return fail(error, "Passwords don't match.");

    const conflict = await Account.conflict(username, email);
    if (conflict) return fail(error, conflict);

    error.textContent = '';
    await new Artist(username, email, password).save();
    window.location.href = Account.HOME;
}
