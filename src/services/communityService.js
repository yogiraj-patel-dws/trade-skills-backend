class CommunityService {
  getCommunityStories() {
    return [
      {
        id: 1,
        rating: 5,
        story: "TradeSkill completely changed how I approach learning. It took me much less personal time achieving success!",
        author: {
          name: "Elena Rodriguez",
          title: "Marketing Manager",
          avatar: "/avatars/elena.jpg"
        }
      },
      {
        id: 2,
        rating: 5,
        story: "I've met amazing people here. I can't wait again and got expert advice on my small business finances.",
        author: {
          name: "David Kim",
          title: "Small Business Owner",
          avatar: "/avatars/david.jpg"
        }
      },
      {
        id: 3,
        rating: 5,
        story: "The platform is intuitive and the community is incredibly supportive. Highly recommended!",
        author: {
          name: "Sarah Jenkins",
          title: "Freelance Designer",
          avatar: "/avatars/sarah.jpg"
        }
      },
      {
        id: 4,
        rating: 5,
        story: "Amazing experience! I learned web development from scratch and now I'm building my own projects.",
        author: {
          name: "Michael Chen",
          title: "Software Developer",
          avatar: "/avatars/michael.jpg"
        }
      },
      {
        id: 5,
        rating: 5,
        story: "The credit system is fair and the teachers are genuinely passionate about sharing knowledge.",
        author: {
          name: "Priya Patel",
          title: "Data Analyst",
          avatar: "/avatars/priya.jpg"
        }
      }
    ];
  }

  getHowSwappingWorks() {
    return {
      title: "How Swapping Works",
      subtitle: "It's simple, fun, and fair too. Currency rewards—just a mutual exchange of how learning happens.",
      steps: [
        {
          step: 1,
          title: "List a Skill",
          description: "Create a profile and share what you know. It can be anything from video editing to breadmaking.",
          icon: "📝"
        },
        {
          step: 2,
          title: "Find a Match",
          description: "Browse our global community to find someone teaching what you want to learn.",
          icon: "🔍"
        },
        {
          step: 3,
          title: "Start Swapping",
          description: "Connect via video or in person. Schedule a session and start exchanging knowledge!",
          icon: "🤝"
        }
      ],
      testimonial: {
        quote: "I taught Sarah Spanish, and she helped me build my portfolio website. It was the perfect match!",
        author: {
          name: "Marcus Chen",
          title: "UX Designer & Language Tutor",
          avatar: "/avatars/marcus.jpg"
        }
      }
    };
  }
}

module.exports = new CommunityService();