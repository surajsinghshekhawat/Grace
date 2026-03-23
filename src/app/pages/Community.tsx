import { useState } from "react";
import { BottomNav } from "../components/BottomNav";
import { WellnessCard } from "../components/WellnessCard";
import { WellnessButton } from "../components/WellnessButton";
import { MessageCircle, Heart, Users, Lightbulb, Coffee, Flower } from "lucide-react";
import { motion } from "motion/react";

const topicRooms = [
  {
    id: 1,
    name: "Health Tips",
    icon: Heart,
    color: "from-[#FF6B8A] to-[#FF8FA3]",
    members: 128,
    posts: 45,
  },
  {
    id: 2,
    name: "Daily Life",
    icon: Coffee,
    color: "from-[#6EE7B7] to-[#4ADE80]",
    members: 215,
    posts: 89,
  },
  {
    id: 3,
    name: "Mental Wellbeing",
    icon: Flower,
    color: "from-[#A78BFA] to-[#C4B5FD]",
    members: 167,
    posts: 67,
  },
  {
    id: 4,
    name: "Hobbies",
    icon: Lightbulb,
    color: "from-[#93C5FD] to-[#BFDBFE]",
    members: 142,
    posts: 53,
  },
];

const recentPosts = [
  {
    id: 1,
    author: "Margaret S.",
    room: "Daily Life",
    content: "Started my garden today! Planted tomatoes and herbs. Anyone else enjoy gardening?",
    likes: 12,
    replies: 5,
    time: "2 hours ago",
  },
  {
    id: 2,
    author: "Robert K.",
    room: "Health Tips",
    content: "My doctor recommended drinking more water. I've been trying to have 8 glasses a day. It's helping!",
    likes: 18,
    replies: 8,
    time: "4 hours ago",
  },
  {
    id: 3,
    author: "Linda P.",
    room: "Mental Wellbeing",
    content: "I've been practicing the breathing exercises from Resources. Feeling much calmer. Thank you all for the support!",
    likes: 24,
    replies: 11,
    time: "Yesterday",
  },
];

export function Community() {
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      {/* Header */}
      <div
        className="px-6 pt-12 pb-8"
        style={{
          background: "linear-gradient(135deg, #E0F7F4 0%, #E8DEFF 100%)",
        }}
      >
        <div className="max-w-[1100px] mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6EE7B7] to-[#A78BFA] flex items-center justify-center">
              <Users size={24} className="text-white" />
            </div>
            <h1
              className="text-gray-800"
              style={{ fontSize: "28px", fontWeight: 700 }}
            >
              Community
            </h1>
          </div>
          <p className="text-gray-600" style={{ fontSize: "16px" }}>
            Connect with others, share experiences
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-4 max-w-[1100px] mx-auto space-y-6">
        {/* Topic Rooms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2
            className="text-gray-800 mb-4"
            style={{ fontSize: "20px", fontWeight: 600 }}
          >
            Topic Rooms
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topicRooms.map((room, index) => {
              const Icon = room.icon;
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <WellnessCard
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedRoom(room.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-14 rounded-[16px] bg-gradient-to-br ${room.color} flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon size={28} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3
                          className="text-gray-800 mb-1"
                          style={{ fontSize: "18px", fontWeight: 600 }}
                        >
                          {room.name}
                        </h3>
                        <div className="flex items-center gap-4 text-gray-500">
                          <span style={{ fontSize: "14px" }}>
                            {room.members} members
                          </span>
                          <span style={{ fontSize: "14px" }}>
                            {room.posts} posts
                          </span>
                        </div>
                      </div>
                    </div>
                  </WellnessCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Posts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2
            className="text-gray-800 mb-4"
            style={{ fontSize: "20px", fontWeight: 600 }}
          >
            Recent Posts
          </h2>
          <div className="space-y-4">
            {recentPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <WellnessCard>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6EE7B7] to-[#A78BFA] flex items-center justify-center text-white font-semibold">
                      {post.author.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-gray-800"
                          style={{ fontSize: "15px", fontWeight: 600 }}
                        >
                          {post.author}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span
                          className="text-gray-500"
                          style={{ fontSize: "13px" }}
                        >
                          {post.time}
                        </span>
                      </div>
                      <span
                        className="inline-block px-2 py-1 rounded-full bg-gradient-to-br from-[#6EE7B7]/20 to-[#A78BFA]/20 text-gray-700"
                        style={{ fontSize: "12px", fontWeight: 500 }}
                      >
                        {post.room}
                      </span>
                    </div>
                  </div>
                  <p
                    className="text-gray-700 mb-4"
                    style={{ fontSize: "15px", lineHeight: 1.6 }}
                  >
                    {post.content}
                  </p>
                  <div className="flex items-center gap-6 text-gray-500">
                    <button className="flex items-center gap-2 hover:text-[#FF6B8A] transition-colors">
                      <Heart size={18} />
                      <span style={{ fontSize: "14px" }}>{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-[#6EE7B7] transition-colors">
                      <MessageCircle size={18} />
                      <span style={{ fontSize: "14px" }}>{post.replies}</span>
                    </button>
                  </div>
                </WellnessCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Create Post Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="pb-4"
        >
          <WellnessButton
            variant="primary"
            size="large"
            className="w-full flex items-center justify-center gap-3"
          >
            <MessageCircle size={22} />
            <span style={{ fontSize: "17px" }}>Share Your Thoughts</span>
          </WellnessButton>
        </motion.div>
      </div>

      <BottomNav activeTab="community" userType="elder" />
    </div>
  );
}
