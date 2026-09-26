/* Sneaky Booty Traps */
const HiddenUntilEditGroups = ['vemail', 'vpassword', 'Showstopper'];

/* They Got Caught in the Bear Trap X - x*/
const DisabledUntilEditFields = ['email', 'UserPassword', 'username', 'biodesc', 'profilePhotoInput', 'backgroundInput'];

/* Settings fields and the account values they mirror */
const AccountFields = [
    { input: 'email', property: 'email' },
    { input: 'username', property: 'username' },
    { input: 'biodesc', property: 'bio' },
    { input: 'UserPassword', property: 'password' }
];

/* Fields that must match their confirm input before saving */
const ConfirmFields = [
    { input: 'email', confirm: 'ConEmail', error: 'EmailMismatch', message: "Emails don't match.", trim: true },
    { input: 'UserPassword', confirm: 'ConPassword', error: 'PasswordMismatch', message: "Passwords don't match." }
];

let isEditing = false;
let currentAccount = null;

function field(id) {
    return document.getElementById(id);
}

function fieldValue(id, trim = false) {
    const value = field(id).value;
    return trim ? value.trim() : value;
}

function loadSavedValues(account = null) {
    currentAccount = account || currentAccount;
    if (!currentAccount) return;

    AccountFields.forEach(({ input, property }) => {
        field(input).value = currentAccount[property] || '';
    });

    ConfirmFields.forEach(({ input, confirm }) => {
        field(confirm).value = field(input).value;
    });
}

Account.protectPage(loadSavedValues);

/*Ediing Stuff In Settings*/
function setEditing(editing) {
    isEditing = editing;

    if (!isEditing) {
        loadSavedValues();
    }

    HiddenUntilEditGroups.forEach(function (id) {
        field(id).style.display = isEditing ? 'block' : 'none';
    });

    DisabledUntilEditFields.forEach(function (id) {
        field(id).disabled = !isEditing;
    });

    field('SaveButton').disabled = !isEditing;
    field('EditButton').textContent = isEditing ? 'Cancel' : 'Edit';
    field('SaveStatus').textContent = '';
    ConfirmFields.forEach(({ error }) => field(error).textContent = '');
}

function toggleEdit() {
    setEditing(!isEditing);
}

/*Saving Stuff In Settings */
async function saveSettings() {
    const mismatch = ConfirmFields.find(({ input, confirm, trim }) =>
        fieldValue(input, trim) !== fieldValue(confirm, trim));

    if (mismatch) {
        field(mismatch.error).textContent = mismatch.message;
        return;
    }
    ConfirmFields.forEach(({ error }) => field(error).textContent = '');

    if (currentAccount) {
        currentAccount.email = fieldValue('email', true);
        currentAccount.password = fieldValue('UserPassword');

        const newUsername = fieldValue('username', true);
        if (newUsername) currentAccount.username = newUsername;

        if (currentAccount instanceof Artist) currentAccount.bio = fieldValue('biodesc', true);

        await currentAccount.save();
    }

    /*You Shall Not Passed After You Finish Editing*/
    setEditing(false);
    field('SaveStatus').textContent = "Changes saved!";
}

/*Show Password toggle*/
setupShowPassword();

/* Log out */
function logout() {
    Account.logout();
    window.location.href = Account.INDEX;
}
