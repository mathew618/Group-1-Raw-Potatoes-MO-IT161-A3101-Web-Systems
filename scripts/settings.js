/* Sneaky Booty Traps */
const HiddenUntilEditGroups = ['vemail', 'vpassword', 'Showstopper'];

/* They Got Caught in the Bear Trap X - x*/
const DisabledUntilEditFields = ['email', 'UserPassword', 'username', 'biodesc', 'profilePhotoInput', 'backgroundInput'];

let isEditing = false;

function loadSavedValues() {
    const savedEmail = localStorage.getItem('LoggedEmail');
    const savedPassword = localStorage.getItem('LoggedPassword');
    const savedUsername = localStorage.getItem('LoggedUser');
    const savedBio = localStorage.getItem('BioDesc');

    document.getElementById('email').value = savedEmail || '';
    document.getElementById('ConEmail').value = savedEmail || '';
    document.getElementById('UserPassword').value = savedPassword || '';
    document.getElementById('ConPassword').value = savedPassword || '';
    document.getElementById('username').value = savedUsername || '';
    document.getElementById('biodesc').value = savedBio || '';
}

window.onload = loadSavedValues;

/*Ediing Stuff In Settings*/
function toggleEdit() {
    isEditing = !isEditing;

    if (!isEditing) {
        loadSavedValues();
    }

    HiddenUntilEditGroups.forEach(function (id) {
        document.getElementById(id).style.display = isEditing ? 'block' : 'none';
    });

    DisabledUntilEditFields.forEach(function (id) {
        document.getElementById(id).disabled = !isEditing;
    });

    document.getElementById('SaveButton').disabled = !isEditing;
    document.getElementById('EditButton').textContent = isEditing ? 'Cancel' : 'Edit';
    document.getElementById('SaveStatus').textContent = '';
    document.getElementById('PasswordMismatch').textContent = '';
    document.getElementById('EmailMismatch').textContent = '';
}

/*Saving Stuff In Settings */
function saveSettings() {
    const newEmail = document.getElementById('email').value.trim();
    const confirmEmail = document.getElementById('ConEmail').value.trim();
    const newPassword = document.getElementById('UserPassword').value;
    const confirmPassword = document.getElementById('ConPassword').value;
    const newUsername = document.getElementById('username').value.trim();
    const newBioDesc = document.getElementById('biodesc').value.trim();

    if (newEmail !== confirmEmail) {
        document.getElementById('EmailMismatch').textContent = "Emails don't match.";
        return;
    }
    document.getElementById('EmailMismatch').textContent = "";

    if (newPassword !== confirmPassword) {
        document.getElementById('PasswordMismatch').textContent = "Passwords don't match.";
        return;
    }
    document.getElementById('PasswordMismatch').textContent = "";

    localStorage.setItem('LoggedEmail', newEmail);
    localStorage.setItem('LoggedPassword', newPassword);
    if (newUsername) localStorage.setItem('LoggedUser', newUsername);
    localStorage.setItem('BioDesc', newBioDesc);

    document.getElementById('SaveStatus').textContent = "Changes saved!";

    /*You Shall Not Passed After You Finish Editing*/
    isEditing = false;
    loadSavedValues();

    HiddenUntilEditGroups.forEach(function (id) {
        document.getElementById(id).style.display = 'none';
    });

    DisabledUntilEditFields.forEach(function (id) {
        document.getElementById(id).disabled = true;
    });
    document.getElementById('SaveButton').disabled = true;
    document.getElementById('EditButton').textContent = 'Edit';
}

/*Show Password toggle*/
const UserPassword = document.getElementById('UserPassword');
const ShowPassword = document.getElementById('ShowPassword');

ShowPassword.addEventListener('click', function () {
    const type = this.checked ? 'text' : 'password';
    UserPassword.type = type;
    document.getElementById('ConPassword').type = type;
});
