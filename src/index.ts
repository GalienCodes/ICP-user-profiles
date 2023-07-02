import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

type UserProfile = Record<{
    id: string;
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

const userProfileStorage = new StableBTreeMap<string, UserProfile>(0, 44, 1024);

$query;
export function getUserProfiles(): Result<Vec<UserProfile>, string> {
    return Result.Ok(userProfileStorage.values());
}

$query;
export function getUserProfile(id: string): Result<UserProfile, string> {
    return match(userProfileStorage.get(id), {
        Some: (profile: any) => Result.Ok<UserProfile, string>(profile),
        None: () => Result.Err<UserProfile, string>(`a user profile with id=${id} not found`)
    });
}

$update;
export function createUserProfile(payload: UserProfilePayload): Result<UserProfile, string> {
    const userProfile: UserProfile = {
        id: uuidv4(),
        createdAt: ic.time(),
        updatedAt: Opt.None,
        followers: [],
        following: [],
        ...payload
    };
    userProfileStorage.insert(userProfile.id, userProfile);
    return Result.Ok(userProfile);
}

$update;
export function updateUserProfile(id: string, payload: UserProfilePayload): Result<UserProfile, string> {
    return match(userProfileStorage.get(id), {
        Some: (profile: any) => {
            const updatedProfile: UserProfile = { ...profile, ...payload, updatedAt: Opt.Some(ic.time()) };
            userProfileStorage.insert(profile.id, updatedProfile);
            return Result.Ok<UserProfile, string>(updatedProfile);
        },
        None: () => Result.Err<UserProfile, string>(`couldn't update a user profile with id=${id}. Profile not found`)
    });
}

$update;
export function deleteUserProfile(id: string): Result<UserProfile, string> {
    return match(userProfileStorage.remove(id), {
        Some: (deletedProfile: any) => Result.Ok<UserProfile, string>(deletedProfile),
        None: () => Result.Err<UserProfile, string>(`couldn't delete a user profile with id=${id}. Profile not found.`)
    });
}

$update;
export function followProfile(userId: string, profileId: string): Result<UserProfile, string> {
    const user1Following = match(userProfileStorage.get(userId), {
        Some: (user) => {
            if(user.following.includes(profileId)) {
                return Result.Ok<UserProfile, string>(user)
            } else {
                const userFollowing: Vec<string> = user.following;
                userFollowing.push(profileId);
                const user1Profile: UserProfile = {
                    ...user,
                    following: userFollowing
                }
                userProfileStorage.insert(user.id, user1Profile);
                return Result.Ok<UserProfile, string>(user1Profile);
            }
        },
        None: () => Result.Err<UserProfile, string>("Unable to carry out the following function")
    })

    match(userProfileStorage.get(profileId), {
        Some: (user) => {
            if(user.following.includes(userId)) {
                return Result.Ok<UserProfile, string>(user)
            } else {
                const userFollowers: Vec<string> = user.followers;
                userFollowers.push(userId);
                const user2Profile: UserProfile = {
                    ...user,
                    followers: userFollowers
                }
                userProfileStorage.insert(user.id, user2Profile);
                return Result.Ok<UserProfile, string>(user2Profile);
            }
        },
        None: () => Result.Err<UserProfile, string>("Unable to carry out the following function")
    })

    return user1Following
}

$update;
export function unfollowProfile(userId: string, profileId: string): Result<UserProfile, string> {
    const user1Unfollowing = match(userProfileStorage.get(userId), {
        Some: (user) => {
            if(user.following.includes(profileId)) {
                const unfollowedUserIndex = user.following.indexOf(profileId)
                user.following.splice(unfollowedUserIndex, 0)
                const user1Profile: UserProfile = {
                    ...user,
                    following: user.following
                }
                userProfileStorage.insert(user.id, user1Profile);
                return Result.Ok<UserProfile, string>(user1Profile);
            } else {
                return Result.Ok<UserProfile, string>(user)
            }
        },
        None: () => Result.Err<UserProfile, string>("Unable to carry out the following function")
    })

    match(userProfileStorage.get(profileId), {
        Some: (user) => {
            if(user.followers.includes(userId)) {
                const unfollowingUserIndex = user.followers.indexOf(userId)
                user.followers.splice(unfollowingUserIndex, 0)
                const user1Profile: UserProfile = {
                    ...user,
                    followers: user.followers
                }
                userProfileStorage.insert(user.id, user1Profile);
                return Result.Ok<UserProfile, string>(user1Profile);
            } else {
                return Result.Ok<UserProfile, string>(user)
            }
        },
        None: () => Result.Err<UserProfile, string>(`Unable to remove the follower with the id = ${userId}`)
    })

    return user1Unfollowing
}

// a workaround to make uuid package work with Azle
globalThis.crypto = {
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    }
};
