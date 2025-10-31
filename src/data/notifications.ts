const notificationsData = [
    {
      "id": "notif_001",
      "type": "like",
      "user": {
        "id": "user_123",
        "name": "Alice Smith",
        "username": "@alice_smith",
        "avatar": "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100"
      },
      "action": "Alice Smith liked your post",
      "content": "Loving the new features in this app!",
      "postId": "post_456",
      "timestamp": "48m ago",
      "read": false,
      "createdAt": 1737671400000
    },
    {
      "id": "notif_002",
      "type": "comment",
      "user": {
        "id": "user_789",
        "name": "Bob Johnson",
        "username": "@bobjohnson",
        "avatar": "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100"
      },
      "action": "Bob Johnson commented on your post",
      "content": "Great post! Can you share more details?",
      "postId": "post_456",
      "timestamp": "1h ago",
      "read": false,
      "createdAt": 1737670500000
    },
    {
      "id": "notif_003",
      "type": "follow",
      "user": {
        "id": "user_234",
        "name": "Carol White",
        "username": "@carol_white",
        "avatar": "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100"
      },
      "action": "Carol White started following you",
      "content": "",
      "postId": "",
      "timestamp": "1h ago",
      "read": true,
      "createdAt": 1737668700000
    },
    {
      "id": "notif_004",
      "type": "subscribe",
      "user": {
        "id": "user_567",
        "name": "David Lee",
        "username": "@davidlee",
        "avatar": "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100"
      },
      "action": "David Lee subscribed to your content",
      "content": "",
      "postId": "",
      "timestamp": "2h ago",
      "read": false,
      "createdAt": 1737666000000
    },
    {
      "id": "notif_005",
      "type": "trending",
      "user": {
        "id": "unknown",
        "name": "Unknown User",
        "username": "@unknown",
        "avatar": "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100"
      },
      "action": "Your post is trending!",
      "content": "My latest project is trending!",
      "postId": "post_789",
      "timestamp": "2h ago",
      "read": false,
      "createdAt": 1737664200000
    },
    {
      "id": "notif_006",
      "type": "reply",
      "user": {
        "id": "user_890",
        "name": "Emma Brown",
        "username": "@emmabrown",
        "avatar": "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100"
      },
      "action": "Emma Brown replied to your comment",
      "content": "Thanks for the info!",
      "postId": "post_456",
      "timestamp": "3h ago",
      "read": true,
      "createdAt": 1737662400000
    }
  ];

  export default notificationsData;