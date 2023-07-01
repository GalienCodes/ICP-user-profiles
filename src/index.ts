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
    const user1: UserProfile = userProfileStorage.get(userId);
    const user2: UserProfile = userProfileStorage.get(profileId);

    if (user1.following.includes(profileId)) {
        return Result.Ok<UserProfile, string>(user1);
    }

    return match(user1, {
        Some: (user: any) => {
            const user1Profile: UserProfile = {
                ...user,
                following: user.following.push(profileId)
            }
            userProfileStorage.insert(user.id, user1Profile);
            return Result.Ok<UserProfile, string>(user1Profile);
        },
        None: Result<UserProfile, string>("Unable to carry out the following function")
    })
}

$update;
export function unfollowProfile(userId: string, profileId: string): Result<UserProfile, string> {
    const userResult = getUserProfile(userId);
    const profileResult = getUserProfile(profileId);

    if (userResult.isErr()) {
        return Result.Err<UserProfile, string>(`User profile with id=${userId} not found.`);
    }

    if (profileResult.isErr()) {
        return Result.Err<UserProfile, string>(`Profile with id=${profileId} not found.`);
    }

    const user = userResult.unwrap();
    const profile = profileResult.unwrap();

    if (!user.following.includes(profileId)) {
        return Result.Ok<UserProfile, string>(user);
    }

    const updatedUser: UserProfile = {
        ...user,
        following: user.following.filter((id) => id !== profileId),
        updatedAt: Opt.Some(ic.time())
    };

    const updatedProfile: UserProfile = {
        ...profile,
        followers: profile.followers.filter((id) => id !== userId),
        updatedAt: Opt.Some(ic.time())
    };

    userProfileStorage.insert(updatedUser.id, updatedUser);
    userProfileStorage.insert(updatedProfile.id, updatedProfile);

    return Result.Ok<UserProfile, string>(updatedUser);
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
