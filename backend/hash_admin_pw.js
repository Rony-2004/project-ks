// hash_admin_pw.js
const bcrypt = require('bcrypt');
const saltRounds = 10; // Standard salt rounds

// -------- EDIT THIS LINE --------
const myAdminPassword = 'admin1234'; // <-- Replace with your actual desired password
// ---------------------------------

if (myAdminPassword === 'CHOOSE_A_STRONG_PASSWORD' || !myAdminPassword) {
    console.error("\nERROR: Please edit the 'myAdminPassword' variable in hash_admin_pw.js first!\n");
} else {
    console.log(`Hashing password: "${myAdminPassword}" ...`);
    bcrypt.hash(myAdminPassword, saltRounds, function(err, hash) {
        if (err) {
            console.error("Error hashing password:", err);
        } else {
            console.log("\nSUCCESS!");
            console.log("----------------------------------------------------");
            console.log("Your Admin Password Hash is:");
            console.log(hash); // This is the value to copy
            console.log("----------------------------------------------------");
            console.log("Copy the hash value above (including the starting $...)");
            console.log("and paste it into the 'passwordHash' column in your Supabase 'users' table for the admin user.");
        }
    });
}