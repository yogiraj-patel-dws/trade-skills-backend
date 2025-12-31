class FooterService {
  getFooterData() {
    return {
      company: {
        name: "TradeSkill",
        description: "The world's first skill exchange platform. Connect, learn, and grow together.",
        tagline: "Share talents, one swap together"
      },
      links: {
        platform: [
          { name: "Browse Skills", url: "/skills" },
          { name: "How it Works", url: "/how-it-works" },
          { name: "Find a Mentor", url: "/mentors" },
          { name: "Start Teaching", url: "/teach" }
        ],
        company: [
          { name: "About Us", url: "/about" },
          { name: "Careers", url: "/careers" },
          { name: "Contact", url: "/contact" },
          { name: "Blog", url: "/blog" }
        ],
        legal: [
          { name: "Terms of Service", url: "/terms" },
          { name: "Privacy Policy", url: "/privacy" },
          { name: "Cookie Policy", url: "/cookies" },
          { name: "Guidelines", url: "/guidelines" }
        ]
      },
      social: [
        { name: "Twitter", url: "https://twitter.com/tradeskill", icon: "twitter" },
        { name: "LinkedIn", url: "https://linkedin.com/company/tradeskill", icon: "linkedin" },
        { name: "Instagram", url: "https://instagram.com/tradeskill", icon: "instagram" },
        { name: "Facebook", url: "https://facebook.com/tradeskill", icon: "facebook" }
      ],
      contact: {
        email: "hello@tradeskill.com",
        phone: "+1 (555) 123-4567",
        address: "123 Innovation Street, Tech City, TC 12345"
      },
      copyright: `© ${new Date().getFullYear()} TradeSkill Inc. All rights reserved.`,
      callToAction: {
        title: "Ready to Share Your Skills?",
        subtitle: "Join a global community of lifelong learners today. It's free to join and start swapping!",
        buttonText: "Get Started Now",
        note: "No credit card required. Cancel anytime."
      }
    };
  }
}

module.exports = new FooterService();