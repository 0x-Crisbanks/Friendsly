import { useNotifications } from '../context/NotificationsContext';

export const useNotificationActions = () => {
  const { addNotification } = useNotifications();

  const notifyLike = (postId: string, liker: { id: string; name: string; username: string; avatar: string }, postContent?: string) => {
    addNotification({
      type: 'like',
      user: liker,
      action: 'liked your post',
      content: postContent,
      postId,
    });
  };

  const notifyComment = (postId: string, commenter: { id: string; name: string; username: string; avatar: string }, comment: string) => {
    addNotification({
      type: 'comment',
      user: commenter,
      action: 'commented on your post',
      content: comment,
      postId,
    });
  };

  const notifyReply = (postId: string, replier: { id: string; name: string; username: string; avatar: string }, reply: string) => {
    addNotification({
      type: 'reply',
      user: replier,
      action: 'replied to your comment',
      content: reply,
      postId,
    });
  };

  const notifyFollow = (follower: { id: string; name: string; username: string; avatar: string }) => {
    addNotification({
      type: 'follow',
      user: follower,
      action: 'started following you',
    });
  };

  const notifySubscribe = (subscriber: { id: string; name: string; username: string; avatar: string }) => {
    addNotification({
      type: 'subscribe',
      user: subscriber,
      action: 'subscribed to your content',
    });
  };

  const notifyTrending = (postId: string, views: number) => {
    addNotification({
      type: 'trending',
      user: {
        id: 'friendsly',
        name: 'Friendsly',
        username: '@friendsly',
        avatar: '/assets/favicon.png',
      },
      action: 'Your post is trending',
      content: `Your recent post has gained ${views.toLocaleString()} views!`,
      postId,
    });
  };

  return {
    notifyLike,
    notifyComment,
    notifyReply,
    notifyFollow,
    notifySubscribe,
    notifyTrending,
  };
};

