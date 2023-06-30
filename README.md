# ICP-user-profiles

This is a canister that manages a collection of user profiles, including following and unfollowing functionality. It is written in TypeScript and follows best practices.
Here are the functionalities that it implements:

- get user profiles
- get a specific user profile
- create a user profile
- update user profile
- delete the user profile
- follow a user profile
- unfollow a user Profile

### To get started
#### 1. clone the repository
```bash
git clone https://github.com/Muhindo-Galien/ICP-user-profiles/
```
#### 2. Next, move into the cloned repository's directory with:
```bash
cd ICP-user-profiles
```
#### 3. Finally, install the project's dependencies by running:
```bash 
npm install

```
#### 4. Install Node Version Manager (nvm)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```
#### 5. Switch to Node.js version 18
```bash
nvm use 18
```

#### 6. Install DFX
```bash
DFX_VERSION=0.14.1 sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"
```
#### 7. Add DFX to your path
```bash
echo 'export PATH="$PATH:$HOME/bin"' >> "$HOME/.bashrc"
```
### Canister Test Guide
1. **getUserProfiles**
To retrieve all user profiles, run the following command:
```bash
dfx canister call <canister-name> getProfiles
```
This command will return a list of user profiles.

2. **getUserProfile**
To retrieve a specific user profile, run the following command:
```bash
dfx canister call <canister-name> getProfile '<profile-id>'
```
Replace `<profile-id>` with the ID of the user profile you want to retrieve. This command will return the details of the specified user profile.

3. **createUserProfile**
To create a new user profile, run the following command:
```bash
dfx canister call <canister-name> createProfile '{ "username": "<username>", "bio": "<bio>" }'
```
Replace `<username>` and `<bio>` with the desired username and bio for the new user profile. This command will create a new user profile and return its details.

4. **updateUserProfile**
To update an existing user profile, run the following command:
```bash
dfx canister call <canister-name> updateProfile '<profile-id>' '{ "username": "<new-username>", "bio": "<new-bio>" }'
```
Replace `<profile-id>` with the ID of the user profile you want to update. Replace `<new-username>` and `<new-bio>` with the updated username and bio for the user profile.
</br> This command will update the specified user profile and return its updated details.

5. **deleteUserProfile**
To delete a user profile, run the following command:
```bash
dfx canister call <canister-name> deleteProfile '<profile-id>'
```
Replace `<profile-id>` with the ID of the user profile you want to delete.
</br>  This command will delete the specified user profile.

6. **followProfile**
To follow another user profile, run the following command:
```bash
dfx canister call <canister-name> followProfile '<user-id>' '<profile-id>'
```
Replace `<user-id>` with the ID of the user profile that wants to follow another profile, and `<profile-id>` with the ID of the profile to be followed.
</br> This command will establish the following relationship between the user profiles.

7. **unfollowProfile**
To unfollow a user profile, run the following command:
```bash
dfx canister call <canister-name> unfollowProfile '<user-id>' '<profile-id>'
```
Replace `<user-id>` with the ID of the user profile that wants to unfollow another profile, and `<profile-id>` with the ID of the profile to be unfollowed.
</br> This command will remove the following relationship between the user profiles.

### Conclusion
Congratulations! You have successfully tested the functions of the user profile canister using the command-line interface (CLI).
</br> You can now integrate these functions into your application as needed.
