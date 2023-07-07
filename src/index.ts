import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt, $init, Principal } from 'azle';

type UserProfile = Record<{
    username: string;
    bio: string;
    followers: Vec<string>;
    following: Vec<string>;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

type UserProfilePayload = Record<{
    username: string;
    bio: string;
}>

const userProfileStorage = new StableBTreeMap<Principal, UserProfile>(0, 44, 1024);



$query;
export function getUserProfiles(): Result<Vec<UserProfile>, string> {
    return Result.Ok(userProfileStorage.values());
}

$query;
export function getUserProfile(id: string): Result<UserProfile, string> {
    const pId = Principal.fromText(id)
    return match(userProfileStorage.get(pId), {
        Some: (profile: any) => Result.Ok<UserProfile, string>(profile),
        None: () => Result.Err<UserProfile, string>(`a user profile with id=${id} not found`)
    });
}

$update;
export function createUserProfile(payload: UserProfilePayload): Result<UserProfile, string> {
    const caller = ic.caller();

    if(caller.toString()==="2vxsx-fae"){
        return Result.Err<UserProfile,string>("Anonymous users are not allowed to create profiles")
    }
    const userProfile: UserProfile = {
        createdAt: ic.time(),
        updatedAt: Opt.None,
        followers: [],
        following: [],
        ...payload
    };
    userProfileStorage.insert(caller, userProfile);
    return Result.Ok(userProfile);
}

$update;
export function updateUserProfile( payload: UserProfilePayload): Result<UserProfile, string> {
    const caller = ic.caller();
    return match(userProfileStorage.get(caller), {
        Some: (profile: any) => {
            const updatedProfile: UserProfile = { ...profile, ...payload, updatedAt: Opt.Some(ic.time()) };
            userProfileStorage.insert(profile.id, updatedProfile);
            return Result.Ok<UserProfile, string>(updatedProfile);
        },
        None: () => Result.Err<UserProfile, string>(`couldn't update a user profile with Princpal Id=${caller.toString()}. Profile not found`)
    });
}


$update;
export function deleteUserProfile(): Result<UserProfile, string> {
    let callerID = ic.caller();
        return match(userProfileStorage.remove(callerID), {
            Some: (deletedProfile: any) => Result.Ok<UserProfile, string>(deletedProfile),
            None: () => Result.Err<UserProfile, string>(`couldn't delete a user profile with id=${callerID.toString()}. Profile not found.`)
        });
}



$update;
export function followProfile(profileId: string): Result<UserProfile, string> {
    const caller = ic.caller()
    // Get the user profile requesting the follow
    const user1Following = match(userProfileStorage.get(caller), {
        Some: (user) => {
            // Check if the user is already following the account to be followed
            // Return the user profile if account to be followed is already being followed
            if(user.following.includes(profileId)) {
                return Result.Ok<UserProfile, string>(user)
            } else { // Else run the code below
                // Save the user's initial following in a variable
                const userFollowing: Vec<string> = user.following;
                // Add the new user to be followed to the existing users already followed
                userFollowing.push(profileId);
                const user1Profile: UserProfile = {
                    ...user,
                    following: userFollowing // Assign the following variable to the list all of the users followed including the new user
                }
                // Save the current user's updated status in the userProfileStorage
                userProfileStorage.insert(caller, user1Profile);
                // Return the user's profile with the updated changes
                return Result.Ok<UserProfile, string>(user1Profile);
            }
        },
        None: () => Result.Err<UserProfile, string>("Unable to carry out the following function")
    })

    // Get the profile of the user to be followed
    match(userProfileStorage.get(Principal.fromText(profileId)), {
        Some: (user) => {
            // Check if the account is already being followed by the user requesting the follow
            // If yes, return the user's profile with no changes made
            if(user.following.includes(caller.toString())) {
                return Result.Ok<UserProfile, string>(user)
            } else { // Else run the code below
                // Get the followers of the user to be followed and store in a variable
                const userFollowers: Vec<string> = user.followers;
                // Add the user to the followers list of the variable created
                userFollowers.push(caller.toString());
                const user2Profile: UserProfile = {
                    ...user,
                    followers: userFollowers // Update the followers of the user
                }
                // Update the user's profile in userProfileStorage
                userProfileStorage.insert(caller, user2Profile);
                // Return the user with the updated followers
                return Result.Ok<UserProfile, string>(user2Profile);
            }
        },
        // If an error is encountered, return the below
        None: () => Result.Err<UserProfile, string>("Unable to carry out the following function")
    })

    // Return the user with the new updated following variable
    return user1Following
}


$update;
export function unfollowProfile(profileId: string): Result<UserProfile, string> {
    const caller = ic.caller()
    // Get the user profile requesting the unfollow
    const user1Unfollowing = match(userProfileStorage.get(caller), {
        Some: (user) => {
            // Check if the user to be unfollowed is part of the following list
            // If true, run the code below
            if(user.following.includes(profileId)) {
                // Get the index of the user to be unfollowed from the following list and save in a variable
                const unfollowedUserIndex = user.following.indexOf(profileId)
                // Using splice method and the user's index, remove the user from the following list
                user.following.splice(unfollowedUserIndex, 1)
                const user1Profile: UserProfile = {
                    ...user,
                    following: user.following  // Save the new following list
                }
                // Update the user's profile in userProfileStorage
                userProfileStorage.insert(caller, user1Profile);
                // Return the user's profile with the updated following list
                return Result.Ok<UserProfile, string>(user1Profile);
            } else { // Else if user is not in the following list, return the user profile with no changes made 
                return Result.Ok<UserProfile, string>(user)
            }
        },
        // If an error is encountered, return the code below
        None: () => Result.Err<UserProfile, string>("Unable to carry out the following function")
    })

    // Get the profile of the user to be unfollowed
    match(userProfileStorage.get(Principal.fromText(profileId)), {
        Some: (user) => {
            // Check if the user requesting the unfollowing is in the followers list
            // If true, run the code below
            if(user.followers.includes(caller.toString())) {
                // Get the index of the user requesting the unfollowing from the followers list
                const unfollowingUserIndex = user.followers.indexOf(caller.toString())
                // Using splice, remove the user from the followers list
                user.followers.splice(unfollowingUserIndex, 1)
                const user1Profile: UserProfile = {
                    ...user,
                    followers: user.followers // Save the new followers list
                }
                // Update the user's profile in userProfileStorage
                userProfileStorage.insert(caller, user1Profile);
                // Return the user with the updated followers list
                return Result.Ok<UserProfile, string>(user1Profile);
            } else { 
                // Else if the user requesting the unfollow is not part of the followers list,
                //  return the user without making any changes
                return Result.Ok<UserProfile, string>(user)
            }
        },
        // If an error is encountered, return the code below
        None: () => Result.Err<UserProfile, string>(`Unable to remove the follower with the Principal Id = ${caller.toString()}`)
    })

    return user1Unfollowing
}
