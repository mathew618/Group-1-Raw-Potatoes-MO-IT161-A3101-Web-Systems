/*A test account dummy -Fidel */
function checkLogin() {
    const Email = document.getElementById('email').value.trim();
    const Password = document.getElementById('UserPassword').value;
    const DefaultUsername = "Justablub";
    const DefaultEmail = "ilosthotdogs@gmail.com";
    const DefaultPassword = "Beezytrave890";
    const SavedUsername = localStorage.getItem('LoggedUser') || DefaultUsername;
    const SavedEmail = localStorage.getItem('LoggedEmail') || DefaultEmail;
    const SavedPassword = localStorage.getItem('LoggedPassword') || DefaultPassword;

    const emailMatches = (Email === SavedUsername || Email === SavedEmail);

    if (emailMatches && Password === SavedPassword) {
        localStorage.setItem('LoggedUser', SavedUsername);
        localStorage.setItem('LoggedEmail', SavedEmail);
        localStorage.setItem('LoggedPassword', SavedPassword);
        window.location.href = "home.html";
    } else {
        document.getElementById('Invalid_Credentials').textContent = "Incorrect Credentials";
    }
}

/* Show Password because I keep having invalid credentials which pisses me off */
const UserPassword = document.getElementById('UserPassword');
const ShowPassword = document.getElementById('ShowPassword');

ShowPassword.addEventListener('click', function () {
    if (this.checked) {
        UserPassword.type = 'text';
    } else {
        UserPassword.type = 'password';
    }
});
