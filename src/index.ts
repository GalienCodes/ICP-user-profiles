import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

type Comment = Record<{
    id: string;
    postId: string;
    text: string;
    createdAt: nat64;
}>

type CommentPayload = Record<{
    postId: string;
    text: string;
}>

type BlogPost = Record<{
    id: string;
    title: string;
    body: string;
    attachmentURL: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
    comments: StableBTreeMap<string, Comment>;
    likes: number;
}>

type BlogPostPayload = Record<{
    title: string;
    body: string;
    attachmentURL: string;
}>

const blogPostStorage = new StableBTreeMap<string, BlogPost>(0, 44, 1024);

$query;
export function getBlogPosts(): Result<Vec<BlogPost>, string> {
    return Result.Ok(blogPostStorage.values());
}

$query;
export function getBlogPost(id: string): Result<BlogPost, string> {
    return match(blogPostStorage.get(id), {
        Some: (blogPost) => Result.Ok<BlogPost, string>(blogPost),
        None: () => Result.Err<BlogPost, string>(`A blog post with id=${id} not found`)
    });
}

$update;
export function addBlogPost(payload: BlogPostPayload): Result<BlogPost, string> {
    const blogPost: BlogPost = { id: uuidv4(), createdAt: ic.time(), updatedAt: Opt.None, comments: new StableBTreeMap<string, Comment>(0, 44, 1024), likes: 0, ...payload };
    blogPostStorage.insert(blogPost.id, blogPost);
    return Result.Ok(blogPost);
}

$update;
export function updateBlogPost(id: string, payload: BlogPostPayload): Result<BlogPost, string> {
    return match(blogPostStorage.get(id), {
        Some: (blogPost) => {
            const updatedBlogPost: BlogPost = {...blogPost, ...payload, updatedAt: Opt.Some(ic.time())};
            blogPostStorage.insert(blogPost.id, updatedBlogPost);
            return Result.Ok<BlogPost, string>(updatedBlogPost);
        },
        None: () => Result.Err<BlogPost, string>(`Couldn't update a blog post with id=${id}. Blog post not found`)
    });
}

$update;
export function deleteBlogPost(id: string): Result<BlogPost, string> {
    return match(blogPostStorage.remove(id), {
        Some: (deletedBlogPost) => Result.Ok<BlogPost, string>(deletedBlogPost),
        None: () => Result.Err<BlogPost, string>(`Couldn't delete a blog post with id=${id}. Blog post not found.`)
    });
}

$update;
export function addComment(postId: string, payload: CommentPayload): Result<Comment, string> {
    const comment: Comment = { id: uuidv4(), postId, createdAt: ic.time(), ...payload };
    const blogPost = blogPostStorage.get(postId);
    if (blogPost) {
        blogPost.comments.insert(comment.id, comment);
        return Result.Ok(comment);
    }
    return Result.Err<Comment, string>(`Couldn't add a comment. Blog post with id=${postId} not found.`);
}

$query;
export function getComments(postId: string): Result<Vec<Comment>, string> {
    const blogPost = blogPostStorage.get(postId);
    if (blogPost) {
        return Result.Ok(blogPost.comments.values());
    }
    return Result.Err<Vec<Comment>, string>(`Couldn't retrieve comments. Blog post with id=${postId} not found.`);
}

$update;
export function deleteComment(postId: string, commentId: string): Result<Comment, string> {
    const blogPost = blogPostStorage.get(postId);
    if (blogPost) {
        const deletedComment = blogPost.comments.remove(commentId);
        if (deletedComment) {
            return Result.Ok(deletedComment);
        }
        return Result.Err<Comment, string>(`Couldn't delete a comment with id=${commentId}. Comment not found.`);
    }
    return Result.Err<Comment, string>(`Couldn't delete a comment. Blog post with id=${postId} not found.`);
}

$update;
export function likeBlogPost(id: string): Result<BlogPost, string> {
    const blogPost = blogPostStorage.get(id);
    if (blogPost) {
        blogPost.likes += 1;
        blogPostStorage.insert(id, blogPost);
        return Result.Ok(blogPost);
    }
    return Result.Err<BlogPost, string>(`Couldn't like a blog post. Blog post with id=${id} not found.`);
}

$update;
export function unlikeBlogPost(id: string): Result<BlogPost, string> {
    const blogPost = blogPostStorage.get(id);
    if (blogPost && blogPost.likes > 0) {
        blogPost.likes -= 1;
        blogPostStorage.insert(id, blogPost);
        return Result.Ok(blogPost);
    }
    return Result.Err<BlogPost, string>(`Couldn't unlike a blog post. Blog post with id=${id} not found or no likes to remove.`);
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
