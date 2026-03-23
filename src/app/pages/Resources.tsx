import { useNavigate } from "react-router";
import { BottomNav } from "../components/BottomNav";
import { WellnessCard } from "../components/WellnessCard";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ArrowLeft, Phone, Heart, Users, Activity, Book, Smile, Search } from "lucide-react";
import { motion } from "motion/react";

const resources = [
  {
    icon: Smile,
    title: "Mindfulness & Relaxation",
    description: "Guided meditation, breathing exercises, and relaxation techniques",
    color: "#FF6B8A",
    image: "https://images.unsplash.com/photo-1619186067269-b14da5a19bcd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    link: "#",
  },
  {
    icon: Users,
    title: "Stay Socially Connected",
    description: "Community groups and social activities to reduce loneliness",
    color: "#A78BFA",
    image: "https://images.unsplash.com/photo-1758691031235-9db55497d898?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    link: "#",
  },
  {
    icon: Activity,
    title: "Healthy Movement",
    description: "Gentle exercises and yoga practices for better mobility",
    color: "#6EE7B7",
    image: "https://images.unsplash.com/photo-1758798469179-dea5d63257ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    link: "#",
  },
  {
    icon: Heart,
    title: "Mental Health Support",
    description: "Professional counseling and therapy resources",
    color: "#93C5FD",
    image: "https://images.unsplash.com/photo-1758273241078-8eec353836be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    link: "#",
  },
  {
    icon: Book,
    title: "Learning & Growth",
    description: "Articles and guides about healthy aging and wellbeing",
    color: "#FFB4C8",
    image: "https://images.unsplash.com/photo-1764173039323-04d1b1d85364?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    link: "#",
  },
  {
    icon: Activity,
    title: "Nutrition Tips",
    description: "Healthy eating habits and nutrition guidance for seniors",
    color: "#FBBF24",
    image: "https://images.unsplash.com/photo-1765200231320-987437f4acc5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    link: "#",
  },
];

export function Resources() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      {/* Header */}
      <div
        className="px-6 pt-12 pb-8"
        style={{
          background: "linear-gradient(135deg, #FFF5F7 0%, #F0E7FF 100%)",
        }}
      >
        <div className="max-w-[1100px] mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-[#FF6B8A] transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span style={{ fontSize: "14px", fontWeight: 500 }}>Back</span>
          </button>
          <h1
            className="text-gray-800 mb-2"
            style={{ fontSize: "28px", fontWeight: 700 }}
          >
            Wellbeing Resources
          </h1>
          <p className="text-gray-600" style={{ fontSize: "14px" }}>
            Helpful resources to support your health and wellbeing journey
          </p>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="px-6 -mt-4 max-w-[1100px] mx-auto">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search resources..."
              className="w-full pl-12 pr-4 py-3 bg-white rounded-[16px] border border-gray-200 focus:outline-none focus:border-[#FF6B8A] transition-colors"
              style={{ fontSize: "15px" }}
            />
          </div>
        </motion.div>

        {/* Featured Resource Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-gray-800 mb-3" style={{ fontSize: "20px", fontWeight: 600 }}>
            Popular Topics
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[
              { icon: Heart, label: "Mental Health", color: "#FF6B8A" },
              { icon: Users, label: "Social", color: "#A78BFA" },
              { icon: Activity, label: "Exercise", color: "#6EE7B7" },
              { icon: Book, label: "Learn", color: "#93C5FD" },
            ].map((topic, i) => {
              const TopicIcon = topic.icon;
              return (
                <button
                  key={i}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 hover:border-[#FF6B8A] transition-colors flex-shrink-0"
                  style={{ fontSize: "14px", fontWeight: 500 }}
                >
                  <TopicIcon size={18} style={{ color: topic.color }} />
                  {topic.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Resource Cards with Images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((resource, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <button
                onClick={() => {
                  console.log(`Opening resource: ${resource.title}`);
                }}
                className="w-full text-left overflow-hidden rounded-[20px] bg-white hover:shadow-lg transition-all duration-300"
                style={{
                  boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.06)",
                }}
              >
                {/* Image */}
                <div className="relative h-40 overflow-hidden">
                  <ImageWithFallback
                    src={resource.image}
                    alt={resource.title}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(180deg, transparent 0%, ${resource.color}20 100%)`,
                    }}
                  />
                </div>
                
                {/* Content */}
                <div className="p-5">
                  <h3
                    className="text-gray-800 mb-2"
                    style={{ fontSize: "18px", fontWeight: 600 }}
                  >
                    {resource.title}
                  </h3>
                  <p className="text-gray-600 mb-3" style={{ fontSize: "14px" }}>
                    {resource.description}
                  </p>
                  <span
                    className="inline-flex items-center gap-1"
                    style={{
                      color: resource.color,
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    Explore →
                  </span>
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Emergency Contact Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 mb-6"
        >
          <div
            className="rounded-[20px] p-6"
            style={{
              background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
              boxShadow: "0px 8px 20px rgba(239, 68, 68, 0.3)",
            }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Phone size={28} className="text-white" />
              </div>
              <div>
                <h3
                  className="text-white mb-1"
                  style={{ fontSize: "20px", fontWeight: 700 }}
                >
                  Crisis Support
                </h3>
                <p className="text-white/90" style={{ fontSize: "14px" }}>
                  Available 24/7 for immediate help
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <a
                href="tel:988"
                className="block w-full px-6 py-3 bg-white text-red-600 rounded-[16px] text-center transition-all hover:bg-red-50"
                style={{ fontSize: "18px", fontWeight: 700 }}
              >
                Call 988 - Suicide & Crisis Lifeline
              </a>
              <p className="text-white/80 text-center" style={{ fontSize: "12px" }}>
                Free and confidential support
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <BottomNav type="elder" />
    </div>
  );
}